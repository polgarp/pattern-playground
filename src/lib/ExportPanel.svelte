<script>
  import { exportWidth, exportHeight } from '../stores/canvas.js';
  import { exportSVG, exportPNG, copySVG } from './export.js';

  let copyLabel = $state('Copy SVG');
  async function handleCopy() {
    await copySVG();
    copyLabel = 'Copied!';
    setTimeout(() => copyLabel = 'Copy SVG', 1500);
  }
</script>

<div class="control-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label>Export size</label>
  <div class="control-row">
    <input type="number" min="256" max="8192" step="256" bind:value={$exportWidth} style="width:70px" />
    <span class="size-sep">&times;</span>
    <input type="number" min="256" max="8192" step="256" bind:value={$exportHeight} style="width:70px" />
  </div>
</div>

<div class="control-row">
  <button onclick={exportSVG}>Export SVG</button>
  <button onclick={exportPNG}>Export PNG</button>
  <button onclick={handleCopy}>{copyLabel}</button>
</div>

<style>
  .size-sep {
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
