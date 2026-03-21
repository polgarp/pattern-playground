<script>
  import {
    viewMode,
    zoom,
    rotation,
    showGuides,
    tilesX,
    tilesY,
    paddingX,
    paddingY,
    exportWidth,
    exportHeight,
  } from '../stores/canvas.js';
  import { exportSVG, exportPNG } from './export.js';

  function zoomIn() { $zoom = Math.min($zoom * 1.2, 5); }
  function zoomOut() { $zoom = Math.max($zoom / 1.2, 0.1); }
  function zoomReset() { $zoom = 1; }
  function resetTileSettings() {
    $paddingX = 10;
    $paddingY = 10;
    $tilesX = 1;
    $tilesY = 1;
  }
</script>

<div class="control-row">
  <button class:active={$viewMode === 'tile'} onclick={() => $viewMode = 'tile'}>
    Tile
  </button>
  <button class:active={$viewMode === 'tiled'} onclick={() => $viewMode = 'tiled'}>
    Tiled
  </button>
</div>

<label class="toggle-label">
  <input type="checkbox" bind:checked={$showGuides} />
  Show guides
</label>

<div class="tile-settings">
  <div class="tile-settings-header">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Tile Settings</label>
    <button class="reset-btn" onclick={resetTileSettings}>Reset</button>
  </div>

  <div class="control-group">
    <label for="padding-x">Horizontal padding: {$paddingX}px</label>
    <input id="padding-x" type="range" min="0" max="100" bind:value={$paddingX} />
  </div>

  <div class="control-group">
    <label for="padding-y">Vertical padding: {$paddingY}px</label>
    <input id="padding-y" type="range" min="0" max="100" bind:value={$paddingY} />
  </div>

  {#if $viewMode === 'tiled'}
    <div class="control-group">
      <label for="tiles-x">Horizontal tiles: {$tilesX}</label>
      <input id="tiles-x" type="range" min="1" max="20" bind:value={$tilesX} />
    </div>

    <div class="control-group">
      <label for="tiles-y">Vertical tiles: {$tilesY}</label>
      <input id="tiles-y" type="range" min="1" max="20" bind:value={$tilesY} />
    </div>
  {/if}
</div>

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
  <label for="canvas-rotation">Rotation: {$rotation}°</label>
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
</div>

<style>
  .zoom-val {
    font-size: 13px;
    min-width: 40px;
    text-align: center;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    text-transform: none;
    color: var(--text);
    cursor: pointer;
  }

  .tile-settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .tile-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .reset-btn {
    font-size: 11px;
    padding: 2px 8px;
  }
</style>
