<script>
  import { selectedFont, fontSize, letterInput, fontLoaded } from '../stores/fonts.js';
  import { viewMode, zoom, panX, panY, rotation, showGuides, tilesX, tilesY, paddingX, paddingY, rowOffset, colOffset, tileSkew, measureText } from '../stores/canvas.js';
  import { operationChain, methodRegistry } from '../stores/methods.js';
  import { onMount } from 'svelte';

  let containerEl = $state(null);
  let containerW = $state(800);
  let containerH = $state(600);
  let isPanning = $state(false);
  let isRotating = $state(false);
  let lastMouse = $state({ x: 0, y: 0 });

  // Measure actual text dimensions, re-measure when font/text/size/fontLoaded changes
  let textMetrics = $derived.by(() => {
    // depend on fontLoaded so we re-measure after font loads
    void $fontLoaded;
    return measureText($letterInput || 'A', $selectedFont, $fontSize);
  });

  // Base motif size (just the text, no padding yet)
  let motifW = $derived(textMetrics.w);
  let motifH = $derived(textMetrics.h);

  // Text position within motif (centered)
  let textX = $derived(motifW / 2);
  let textY = $derived(textMetrics.ascent);

  // Compose transforms from the operation chain via cartesian product
  // Operations use motif dimensions for their calculations
  let transforms = $derived.by(() => {
    const chain = $operationChain;
    const registry = $methodRegistry;
    if (chain.length === 0) return [{ transform: '' }];

    let result = [{ transform: '' }];
    for (const op of chain) {
      if (!(op.enabled ?? true)) continue;
      const method = registry.find(m => m.id === op.methodId);
      if (!method) continue;
      let stepTransforms;
      try {
        stepTransforms = method.getTransforms(op.config, motifW, motifH);
      } catch {
        continue;
      }
      const next = [];
      for (const existing of result) {
        for (const step of stepTransforms) {
          const combined = `${step.transform} ${existing.transform}`.trim();
          next.push({ transform: combined });
        }
      }
      result = next;
    }
    return result;
  });

  // Parse SVG transform string into a DOMMatrix
  // Handles rotate(a, cx, cy) which DOMMatrix doesn't support natively
  function svgTransformToMatrix(str) {
    let matrix = new DOMMatrix();
    if (!str) return matrix;
    const re = /(translate|scale|rotate|skewX|skewY|matrix)\s*\(([^)]+)\)/g;
    let match;
    while ((match = re.exec(str)) !== null) {
      const fn = match[1];
      const args = match[2].split(/[\s,]+/).map(Number);
      switch (fn) {
        case 'translate':
          matrix = matrix.translate(args[0] || 0, args[1] || 0);
          break;
        case 'scale':
          matrix = matrix.scale(args[0] || 1, args[1] ?? args[0] ?? 1);
          break;
        case 'rotate':
          if (args.length >= 3) {
            matrix = matrix.translate(args[1], args[2]);
            matrix = matrix.rotate(args[0]);
            matrix = matrix.translate(-args[1], -args[2]);
          } else {
            matrix = matrix.rotate(args[0] || 0);
          }
          break;
        case 'skewX':
          matrix = matrix.skewX(args[0] || 0);
          break;
        case 'skewY':
          matrix = matrix.skewY(args[0] || 0);
          break;
        case 'matrix':
          matrix = matrix.multiply(new DOMMatrix([args[0], args[1], args[2], args[3], args[4], args[5]]));
          break;
      }
    }
    return matrix;
  }

  // Compute bounding box of all transforms applied to the motif
  let tileBounds = $derived.by(() => {
    const corners = [
      [0, 0], [motifW, 0], [motifW, motifH], [0, motifH]
    ];

    let minX = 0, minY = 0, maxX = motifW, maxY = motifH;

    for (const t of transforms) {
      if (!t.transform) continue;
      const matrix = svgTransformToMatrix(t.transform);
      for (const [x, y] of corners) {
        const pt = matrix.transformPoint({ x, y });
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      }
    }

    return { minX, minY, maxX, maxY };
  });

  // Tile size = bounding box of composed transforms + padding
  let tileW = $derived(tileBounds.maxX - tileBounds.minX + $paddingX * 2);
  let tileH = $derived(tileBounds.maxY - tileBounds.minY + $paddingY * 2);

  // Offset to shift the tile content so the bounding box starts at (padding, padding)
  let tileOffsetX = $derived(-tileBounds.minX + $paddingX);
  let tileOffsetY = $derived(-tileBounds.minY + $paddingY);

  // Total SVG dimensions (account for offset + skew overflow)
  let svgW = $derived($viewMode === 'tiled' ? tileW * $tilesX + Math.abs($rowOffset) * tileW + Math.abs($tileSkew) * tileW * $tilesY : tileW);
  let svgH = $derived($viewMode === 'tiled' ? tileH * $tilesY + Math.abs($colOffset) * tileH : tileH);

  // Compute visible tile range based on viewport, pan, zoom, and rotation
  let visibleTiles = $derived.by(() => {
    if ($viewMode !== 'tiled') return [{ x: 0, y: 0 }];

    const z = $zoom;
    const rot = $rotation * Math.PI / 180;
    const halfW = containerW / 2 / z;
    const halfH = containerH / 2 / z;

    const cosR = Math.abs(Math.cos(rot));
    const sinR = Math.abs(Math.sin(rot));
    const boundsHalfW = halfW * cosR + halfH * sinR;
    const boundsHalfH = halfW * sinR + halfH * cosR;

    const cx = -$panX / z + svgW / 2;
    const cy = -$panY / z + svgH / 2;

    // Expand range by 1 extra tile to cover offset overflow
    const colMin = Math.max(0, Math.floor((cx - boundsHalfW) / tileW) - 2);
    const colMax = Math.min($tilesX - 1, Math.ceil((cx + boundsHalfW) / tileW) + 2);
    const rowMin = Math.max(0, Math.floor((cy - boundsHalfH) / tileH) - 2);
    const rowMax = Math.min($tilesY - 1, Math.ceil((cy + boundsHalfH) / tileH) + 2);

    const rOff = $rowOffset;
    const cOff = $colOffset;
    const skew = $tileSkew;

    const positions = [];
    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        const x = col * tileW + (row % 2) * rOff * tileW + row * skew * tileW;
        const y = row * tileH + (col % 2) * cOff * tileH;
        positions.push({ x, y });
      }
    }
    return positions;
  });

  onMount(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerW = entry.contentRect.width;
        containerH = entry.contentRect.height;
      }
    });
    if (containerEl) ro.observe(containerEl);
    return () => ro.disconnect();
  });

  function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max($zoom * factor, 0.1), 5);

    // Zoom toward mouse pointer: adjust pan so the point under the cursor stays fixed
    const rect = containerEl.getBoundingClientRect();
    const mx = e.clientX - rect.left - containerW / 2;
    const my = e.clientY - rect.top - containerH / 2;

    $panX = mx - (mx - $panX) * (newZoom / $zoom);
    $panY = my - (my - $panY) * (newZoom / $zoom);
    $zoom = newZoom;
  }

  function onPointerDown(e) {
    if (e.button === 0) {
      isPanning = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (e.button === 2) {
      isRotating = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e) {
    if (isPanning) {
      $panX += e.clientX - lastMouse.x;
      $panY += e.clientY - lastMouse.y;
      lastMouse = { x: e.clientX, y: e.clientY };
    } else if (isRotating) {
      const rect = containerEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const prevAngle = Math.atan2(lastMouse.y - cy, lastMouse.x - cx);
      const currAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const delta = (currAngle - prevAngle) * (180 / Math.PI);
      $rotation = Math.round((($rotation + delta) % 360 + 360) % 360);
      lastMouse = { x: e.clientX, y: e.clientY };
    }
  }

  function onPointerUp() {
    isPanning = false;
    isRotating = false;
  }
</script>

<div
  class="canvas-container"
  id="pattern-canvas"
  bind:this={containerEl}
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  oncontextmenu={(e) => e.preventDefault()}
  role="img"
  aria-label="Pattern canvas"
>
  <svg
    width={containerW}
    height={containerH}
    viewBox="{-containerW/2} {-containerH/2} {containerW} {containerH}"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Define the motif once -->
    <defs>
      <symbol id="motif" overflow="visible">
        <text
          x={textX}
          y={textY}
          font-family="'{$selectedFont}', sans-serif"
          font-size={$fontSize}
          fill="#1a1a1a"
          text-anchor="middle"
        >{$letterInput}</text>
      </symbol>
      <!-- A single tile with all transforms applied -->
      <symbol id="tile" overflow="visible">
        <g transform="translate({tileOffsetX}, {tileOffsetY})">
          {#each transforms as t}
            <g transform={t.transform}>
              <use href="#motif" />
            </g>
          {/each}
        </g>
      </symbol>
    </defs>

    <g transform="translate({$panX}, {$panY}) scale({$zoom}) rotate({$rotation})">
      <!-- Center the pattern -->
      <g transform="translate({-svgW/2}, {-svgH/2})">

        {#if $viewMode === 'tiled'}
          <g>
            {#each visibleTiles as pos}
              <use href="#tile" x={pos.x} y={pos.y} />
            {/each}
          </g>
        {:else}
          <use href="#tile" />
        {/if}

        <!-- Guides -->
        {#if $showGuides}
          {#if $viewMode === 'tiled'}
            {@const skewPx = $tileSkew * tileW}
            {#each visibleTiles as pos}
              <polygon
                points="{pos.x},{pos.y} {pos.x + tileW},{pos.y} {pos.x + tileW + skewPx},{pos.y + tileH} {pos.x + skewPx},{pos.y + tileH}"
                fill="none"
                stroke="rgba(255,63,49,0.3)"
                stroke-width={1 / $zoom}
              />
            {/each}
          {:else}
            <rect
              x={0} y={0}
              width={tileW} height={tileH}
              fill="none"
              stroke="rgba(255,63,49,0.4)"
              stroke-width={1 / $zoom}
              stroke-dasharray="{4 / $zoom}"
            />
          {/if}
        {/if}
      </g>
    </g>
  </svg>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    cursor: grab;
    background: #ffffff;
  }

  .canvas-container:active {
    cursor: grabbing;
  }
</style>
