<script>
  import {
    filteredFonts,
    fontSearch,
    selectedFont,
    fontSize,
    letterInput,
    loadFont,
  } from '../stores/fonts.js';

  let showDropdown = $state(false);
  let inputEl = $state(null);

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
    // Delay to allow click on dropdown option
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }

  $effect(() => {
    loadFont($selectedFont);
  });
</script>

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
  <label for="font-size">Size: {$fontSize}px</label>
  <input
    id="font-size"
    type="range"
    min="20"
    max="400"
    bind:value={$fontSize}
  />
</div>

<style>
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
  }

  .no-results {
    padding: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
