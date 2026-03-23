<script>
  import {
    motifType,
    svgMotif,
    parseSVGUpload,
    filteredFonts,
    fontSearch,
    selectedFont,
    fontSize,
    letterInput,
    loadFont,
  } from '../stores/fonts.js';

  let showDropdown = $state(false);
  let inputEl = $state(null);
  let fileInputEl = $state(null);
  let dragOver = $state(false);
  let uploadError = $state('');

  const MAX_SVG_SIZE = 500 * 1024; // 500KB

  function selectFont(family) {
    $selectedFont = family;
    $fontSearch = '';
    showDropdown = false;
    loadFont(family);
  }

  function handleInput() {
    showDropdown = true;
  }

  function handleFocus() {
    showDropdown = true;
  }

  function handleBlur(e) {
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }

  function handleSVGFile(file) {
    uploadError = '';
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      uploadError = 'Please upload an SVG file';
      return;
    }
    if (file.size > MAX_SVG_SIZE) {
      uploadError = 'SVG must be under 500KB';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseSVGUpload(e.target.result);
      if (!result) {
        uploadError = 'Could not parse SVG';
        return;
      }
      $svgMotif = result;
    };
    reader.readAsText(file);
  }

  function onFileChange(e) {
    handleSVGFile(e.target.files[0]);
  }

  function onDrop(e) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer.files[0];
    handleSVGFile(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    dragOver = true;
  }

  function onDragLeave() {
    dragOver = false;
  }

  function clearSVG() {
    $svgMotif = null;
    uploadError = '';
    if (fileInputEl) fileInputEl.value = '';
  }

  $effect(() => {
    loadFont($selectedFont);
  });
</script>

<div class="control-row mode-tabs">
  <button class:active={$motifType === 'text'} onclick={() => $motifType = 'text'}>
    Text
  </button>
  <button class:active={$motifType === 'svg'} onclick={() => $motifType = 'svg'}>
    SVG Upload
  </button>
</div>

{#if $motifType === 'text'}
  <div class="control-group">
    <label for="letter-input">Letter / Text</label>
    <input
      id="letter-input"
      type="text"
      bind:value={$letterInput}
      maxlength="6"
      placeholder="A"
    />
  </div>

  <div class="control-group font-selector">
    <label for="font-combo">Font</label>
    <input
      id="font-combo"
      type="text"
      bind:this={inputEl}
      value={showDropdown ? $fontSearch : $selectedFont}
      oninput={(e) => { $fontSearch = e.target.value; handleInput(); }}
      onfocus={handleFocus}
      onblur={handleBlur}
      placeholder="Search fonts..."
      autocomplete="off"
    />

    {#if showDropdown}
      <div class="font-dropdown">
        {#each $filteredFonts as font}
          <button
            class="font-option"
            class:active={font.family === $selectedFont}
            onmousedown={(e) => { e.preventDefault(); selectFont(font.family); }}
          >
            {font.family}
          </button>
        {/each}
        {#if $filteredFonts.length === 0}
          <div class="no-results">No fonts found</div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="control-group">
    <div class="range-label">
      <label for="font-size">Size</label>
      <span class="range-value">{$fontSize}px</span>
    </div>
    <input
      id="font-size"
      type="range"
      min="20"
      max="400"
      bind:value={$fontSize}
    />
  </div>
{:else}
  <div
    class="drop-zone"
    class:drag-over={dragOver}
    ondrop={onDrop}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    role="button"
    tabindex="0"
    onclick={() => fileInputEl?.click()}
    onkeydown={(e) => { if (e.key === 'Enter') fileInputEl?.click(); }}
  >
    {#if $svgMotif}
      <div class="svg-preview">
        {@html `<svg viewBox="${$svgMotif.viewBox}" width="80" height="80" xmlns="http://www.w3.org/2000/svg">${$svgMotif.markup}</svg>`}
      </div>
      <span class="upload-info">{$svgMotif.w} x {$svgMotif.h}</span>
    {:else}
      <span class="upload-prompt">Drop SVG here or click to browse</span>
    {/if}
  </div>

  <input
    bind:this={fileInputEl}
    type="file"
    accept=".svg,image/svg+xml"
    onchange={onFileChange}
    style="display:none"
  />

  {#if uploadError}
    <span class="upload-error">{uploadError}</span>
  {/if}

  {#if $svgMotif}
    <div class="control-group">
      <div class="range-label">
        <label for="svg-scale">Scale</label>
        <span class="range-value">{$fontSize}px</span>
      </div>
      <input
        id="svg-scale"
        type="range"
        min="20"
        max="400"
        bind:value={$fontSize}
      />
    </div>
    <button class="clear-btn" onclick={clearSVG}>Remove SVG</button>
  {/if}
{/if}

<style>
  .mode-tabs {
    display: flex;
    gap: 4px;
  }

  .mode-tabs button.active {
    background: var(--accent);
    color: #fff;
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

  .font-selector {
    position: relative;
  }

  .font-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 240px;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    z-index: 20;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .font-option {
    text-align: left;
    padding: 8px 10px;
    border-radius: 0;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    background: none;
    color: var(--text);
  }

  .font-option:hover {
    background: var(--bg-panel);
    color: var(--text);
  }

  .font-option.active {
    background: var(--bg-panel);
    color: var(--accent);
    font-weight: 600;
  }

  .no-results {
    padding: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }

  .drop-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 16px;
    text-align: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: border-color 0.15s, background 0.15s;
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    border-color: var(--accent);
    background: rgba(255, 63, 49, 0.04);
  }

  .upload-prompt {
    font-size: 12px;
    color: var(--text-muted);
  }

  .upload-info {
    font-size: 11px;
    color: var(--text-muted);
  }

  .upload-error {
    font-size: 12px;
    color: var(--accent);
  }

  .svg-preview {
    width: 80px;
    height: 80px;
  }

  .svg-preview :global(svg) {
    width: 100%;
    height: 100%;
  }

  .clear-btn {
    font-size: 12px;
    padding: 4px 10px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  .clear-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
