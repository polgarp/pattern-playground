<script>
  import {
    zoom,
    rotation,
    panX,
    panY,
  } from '../stores/canvas.js';

  let zoomTarget = null;
  let zoomRaf = null;
  let rotTarget = null;
  let rotRaf = null;

  const LERP = 0.08;
  const EPSILON = 0.01;

  let zoomCurrent = null;
  let rotCurrent = null;

  // Cancel pending animations on component destroy (e.g. when slice mode activates)
  $effect(() => {
    return () => {
      if (zoomRaf) { cancelAnimationFrame(zoomRaf); zoomRaf = null; }
      if (rotRaf) { cancelAnimationFrame(rotRaf); rotRaf = null; }
    };
  });

  function tickZoom() {
    if (zoomTarget === null) return;
    if (zoomCurrent === null) zoomCurrent = $zoom;
    const diff = zoomTarget - zoomCurrent;
    if (Math.abs(diff) < EPSILON * 0.01) {
      // Adjust pan to keep viewport center fixed
      const ratio = zoomTarget / zoomCurrent;
      $panX *= ratio;
      $panY *= ratio;
      $zoom = zoomTarget;
      zoomTarget = null;
      zoomCurrent = null;
      zoomRaf = null;
      return;
    }
    const prevZoom = zoomCurrent;
    zoomCurrent += diff * LERP;
    // Adjust pan to keep viewport center fixed
    const ratio = zoomCurrent / prevZoom;
    $panX *= ratio;
    $panY *= ratio;
    $zoom = zoomCurrent;
    zoomRaf = requestAnimationFrame(tickZoom);
  }

  function tickRotation() {
    if (rotTarget === null) return;
    if (rotCurrent === null) rotCurrent = $rotation;
    let diff = rotTarget - rotCurrent;
    // Shortest path around the circle
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < EPSILON) {
      // Adjust pan to keep viewport center fixed
      const delta = (rotTarget - rotCurrent) * Math.PI / 180;
      const cos = Math.cos(delta), sin = Math.sin(delta);
      const px = $panX, py = $panY;
      $panX = px * cos - py * sin;
      $panY = px * sin + py * cos;
      $rotation = ((rotTarget % 360) + 360) % 360;
      rotTarget = null;
      rotCurrent = null;
      rotRaf = null;
      return;
    }
    const prevRot = rotCurrent;
    rotCurrent += diff * LERP;
    // Adjust pan to keep viewport center fixed
    const delta = (rotCurrent - prevRot) * Math.PI / 180;
    const cos = Math.cos(delta), sin = Math.sin(delta);
    const px = $panX, py = $panY;
    $panX = px * cos - py * sin;
    $panY = px * sin + py * cos;
    $rotation = ((rotCurrent % 360) + 360) % 360;
    rotRaf = requestAnimationFrame(tickRotation);
  }

  function animateZoom(target) {
    zoomCurrent = zoomCurrent ?? $zoom;
    zoomTarget = target;
    if (!zoomRaf) zoomRaf = requestAnimationFrame(tickZoom);
  }

  function animateRotation(target) {
    rotCurrent = rotCurrent ?? $rotation;
    rotTarget = ((target % 360) + 360) % 360;
    if (!rotRaf) rotRaf = requestAnimationFrame(tickRotation);
  }

  function zoomIn() { animateZoom(Math.min((zoomTarget ?? $zoom) * 1.2, 5)); }
  function zoomOut() { animateZoom(Math.max((zoomTarget ?? $zoom) / 1.2, 0.1)); }
  function rotateCCW() { animateRotation((rotTarget ?? $rotation) - 15); }
  function rotateCW() { animateRotation((rotTarget ?? $rotation) + 15); }
  function resetView() { animateZoom(1); animateRotation(0); $panX = 0; $panY = 0; }

  function stop(e) { e.stopPropagation(); }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onpointerdown={stop} onwheel={stop}>
  <!--
    L-shape layout:
           [zoom]
    [rot] [reset]
  -->

  <!-- Zoom stack: right-aligned above reset -->
  <div class="control-stack vertical">
    <button class="icon-btn" onclick={zoomIn} aria-label="Zoom in" title="Zoom in">+</button>
    <span class="val">{Math.round($zoom * 100)}%</span>
    <button class="icon-btn" onclick={zoomOut} aria-label="Zoom out" title="Zoom out">−</button>
  </div>

  <!-- Bottom row: rotation + reset -->
  <div class="bottom-row">
    <div class="control-stack horizontal">
      <button class="icon-btn" onclick={rotateCCW} aria-label="Rotate counter-clockwise" title="Rotate counter-clockwise">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 4v6h6"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>
      <span class="val">{Math.round($rotation)}°</span>
      <button class="icon-btn" onclick={rotateCW} aria-label="Rotate clockwise" title="Rotate clockwise">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6"/>
          <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <button
      class="reset-btn"
      onclick={resetView}
      aria-label="Reset view"
      title="Reset view"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    z-index: 10;
  }

  .bottom-row {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 4px;
  }

  .control-stack {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .control-stack.vertical {
    flex-direction: column;
  }

  .control-stack.horizontal {
    flex-direction: row;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 0;
    color: var(--text);
    font-size: 18px;
    font-weight: 300;
    padding: 0;
  }

  .icon-btn:hover {
    background: var(--bg-panel);
    color: var(--text);
  }

  .reset-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    color: var(--text-muted);
    padding: 0;
    transition: opacity 0.2s, color 0.15s;
  }

  .reset-btn:hover {
    background: var(--bg);
    color: var(--accent);
  }

  .val {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    user-select: none;
  }

  .vertical .val {
    padding: 2px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    width: 100%;
    text-align: center;
  }

  .horizontal .val {
    padding: 0 6px;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    height: 36px;
    line-height: 36px;
  }
</style>
