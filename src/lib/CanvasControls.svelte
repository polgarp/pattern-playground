<script>
  import {
    zoom,
    rotation,
    exportWidth,
    exportHeight,
  } from '../stores/canvas.js';
  import { exportSVG, exportPNG, copySVG } from './export.js';

  let copyLabel = $state('Copy SVG');
  async function handleCopy() {
    await copySVG();
    copyLabel = 'Copied!';
    setTimeout(() => copyLabel = 'Copy SVG', 1500);
  }

  function zoomIn() { $zoom = Math.min($zoom * 1.2, 5); }
  function zoomOut() { $zoom = Math.max($zoom / 1.2, 0.1); }
  function zoomReset() { $zoom = 1; }
</script>

<div class="control-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Zoom</label>
  <div class="control-row">
    <button onclick={zoomOut}>−</button>
    <span class="zoom-val">{Math.round($zoom * 100)}%</span>
    <button onclick={zoomIn}>+</button>
    <button onclick={zoomReset}>Reset</button>
  </div>
</div>

<div class="control-group">
  <div class="range-label">
    <label for="canvas-rotation">Rotation</label>
    <span class="range-value">{$rotation}°</span>
  </div>
  <div class="control-row">
    <input id="canvas-rotation" type="range" min="0" max="359" value={$rotation} oninput={(e) => $rotation = Number(e.target.value)} />
    <button onclick={() => $rotation = 0}>Reset</button>
  </div>
</div>

<div class="control-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Export size</label>
  <div class="control-row">
    <input type="number" min="256" max="8192" step="256" bind:value={$exportWidth} style="width:70px" />
    <span>x</span>
    <input type="number" min="256" max="8192" step="256" bind:value={$exportHeight} style="width:70px" />
  </div>
</div>

<div class="control-row">
  <button onclick={exportSVG}>Export SVG</button>
  <button onclick={exportPNG}>Export PNG</button>
  <button onclick={handleCopy}>{copyLabel}</button>
</div>

<style>
  .zoom-val {
    font-size: 13px;
    min-width: 40px;
    text-align: center;
  }

  .range-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .range-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
</style>
