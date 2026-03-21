<script>
  import { selectedFont, fontSize, letterInput, fontLoaded } from '../stores/fonts.js';
  import { viewMode, zoom, panX, panY, rotation, showGuides, tilesX, tilesY, paddingX, paddingY, measureText } from '../stores/canvas.js';
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

  // Tile size = measured text + padding on each side
  let tileW = $derived(textMetrics.w + $paddingX * 2);
  let tileH = $derived(textMetrics.h + $paddingY * 2);

  // Text position within tile (centered)
  let textX = $derived(tileW / 2);
  let textY = $derived($paddingY + textMetrics.ascent);

  // Total SVG dimensions
  let svgW = $derived($viewMode === 'tiled' ? tileW * $tilesX : tileW);
  let svgH = $derived($viewMode === 'tiled' ? tileH * $tilesY : tileH);

  // Compose transforms from the operation chain via cartesian product
  let transforms = $derived.by(() => {
    const chain = $operationChain;
    const registry = $methodRegistry;
    if (chain.length === 0) return [{ transform: '' }];

    let result = [{ transform: '' }];
    for (const op of chain) {
      const method = registry.find(m => m.id === op.methodId);
      if (!method) continue;
      let stepTransforms;
      try {
        stepTransforms = method.getTransforms(op.config, tileW, tileH);
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

  // Generate tile positions for tiled view
  let tilePositions = $derived.by(() => {
    if ($viewMode !== 'tiled') return [{ x: 0, y: 0 }];
    const positions = [];
    for (let row = 0; row < $tilesY; row++) {
      for (let col = 0; col < $tilesX; col++) {
        positions.push({ x: col * tileW, y: row * tileH });
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
    <g transform="translate({$panX}, {$panY}) scale({$zoom}) rotate({$rotation})">
      <!-- Center the pattern -->
      <g transform="translate({-svgW/2}, {-svgH/2})">

        {#if $viewMode === 'tiled'}
          <g>
            {#each tilePositions as pos}
              <g transform="translate({pos.x}, {pos.y})">
                {#each transforms as t}
                  <g transform={t.transform}>
                    <text
                      x={textX}
                      y={textY}
                      font-family="'{$selectedFont}', sans-serif"
                      font-size={$fontSize}
                      fill="#1a1a1a"
                      text-anchor="middle"
                    >{$letterInput}</text>
                  </g>
                {/each}
              </g>
            {/each}
          </g>
        {:else}
          <!-- Single tile view -->
          {#each transforms as t}
            <g transform={t.transform}>
              <text
                x={textX}
                y={textY}
                font-family="'{$selectedFont}', sans-serif"
                font-size={$fontSize}
                fill="#1a1a1a"
                text-anchor="middle"
              >{$letterInput}</text>
            </g>
          {/each}
        {/if}

        <!-- Guides -->
        {#if $showGuides}
          {#if $viewMode === 'tiled'}
            {#each Array($tilesX + 1) as _, i}
              <line
                x1={i * tileW} y1={0}
                x2={i * tileW} y2={svgH}
                stroke="rgba(255,63,49,0.3)"
                stroke-width={1 / $zoom}
              />
            {/each}
            {#each Array($tilesY + 1) as _, i}
              <line
                x1={0} y1={i * tileH}
                x2={svgW} y2={i * tileH}
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
            <!-- Center crosshair -->
            <line
              x1={tileW/2 - 10/$zoom} y1={tileH/2}
              x2={tileW/2 + 10/$zoom} y2={tileH/2}
              stroke="rgba(255,63,49,0.3)"
              stroke-width={1 / $zoom}
            />
            <line
              x1={tileW/2} y1={tileH/2 - 10/$zoom}
              x2={tileW/2} y2={tileH/2 + 10/$zoom}
              stroke="rgba(255,63,49,0.3)"
              stroke-width={1 / $zoom}
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
