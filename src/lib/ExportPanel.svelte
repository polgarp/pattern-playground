<script>
  import { exportWidth, exportHeight, sliceActive, sliceBounds } from '../stores/canvas.js';
  import { exportSVG, exportPNG, copySVG } from './export.js';

  let copyLabel = $state('Copy SVG');

  function getBounds() {
    return $sliceActive ? $sliceBounds : null;
  }

  function handleExportSVG() { exportSVG(getBounds()); }
  function handleExportPNG() { exportPNG(getBounds()); }
  async function handleCopy() {
    await copySVG(getBounds());
    copyLabel = 'Copied!';
    setTimeout(() => copyLabel = 'Copy SVG', 1500);
  }
</script>

<div class="control-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Export mode</label>
  <div class="mode-toggle">
    <button class:active={!$sliceActive} onclick={() => $sliceActive = false}>Full Canvas</button>
    <button class:active={$sliceActive} onclick={() => $sliceActive = true}>Slice</button>
  </div>
</div>

{#if $sliceActive}
  <div class="control-group">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Slice size</label>
    <div class="slice-dims">
      {Math.round($sliceBounds.w)} &times; {Math.round($sliceBounds.h)} px
    </div>
  </div>
{:else}
  <div class="control-group">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Export size</label>
    <div class="control-row">
      <input type="number" min="256" max="8192" step="256" bind:value={$exportWidth} style="width:70px" />
      <span class="size-sep">&times;</span>
      <input type="number" min="256" max="8192" step="256" bind:value={$exportHeight} style="width:70px" />
    </div>
  </div>
{/if}

<div class="control-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Download</label>
  <div class="control-row">
    <button onclick={handleExportSVG}>SVG</button>
    <button onclick={handleExportPNG}>PNG</button>
    <button onclick={handleCopy}>{copyLabel}</button>
  </div>
</div>

<style>
  .size-sep {
    font-size: 13px;
    color: var(--text-muted);
  }

  .slice-dims {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
</style>
