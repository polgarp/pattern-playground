<script>
  import Sidebar from './lib/Sidebar.svelte';
  import Canvas from './lib/Canvas.svelte';
  import AboutModal from './lib/AboutModal.svelte';
  import { fetchFontList, pickRandomFont, loadFont, selectedFont } from './stores/fonts.js';
  import { initMethods } from './methods/index.js';
  import { initUrlState } from './stores/urlState.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let aboutOpen = $state(false);

  onMount(async () => {
    await fetchFontList();
    initMethods();

    // If URL hash has state, restore it; otherwise pick a random font
    const hasHash = window.location.hash.length > 1;
    initUrlState();

    if (!hasHash) aboutOpen = true;

    if (hasHash) {
      // Load the font that was restored from the hash
      await loadFont(get(selectedFont));
    } else {
      pickRandomFont();
    }
  });
</script>

<div class="app-layout">
  <header class="app-header">
    <h1>Tilecraft</h1>
    <button class="header-btn" onclick={() => aboutOpen = true} aria-label="About">?</button>
  </header>

  <div class="app-body">
    <aside class="sidebar">
      <Sidebar />
    </aside>
    <main class="canvas-area">
      <Canvas />
    </main>
  </div>
</div>

{#if aboutOpen}
  <AboutModal onclose={() => aboutOpen = false} />
{/if}

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .app-header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--accent);
    flex-shrink: 0;
    color: #fff;
    gap: 8px;
  }

  .app-header h1 {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #fff;
    flex: 1;
  }

  .header-btn {
    width: 36px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: rgba(255,255,255,0.2);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
  }

  .header-btn:hover {
    background: rgba(255,255,255,0.35);
    color: #fff;
  }

  .app-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: var(--sidebar-width);
    flex-shrink: 0;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    overflow-y: scroll;
    overflow-x: hidden;
  }

  .canvas-area {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  @media (max-width: 768px) {
    .sidebar {
      position: absolute;
      z-index: 10;
      height: calc(100% - var(--header-height));
      width: 100%;
      max-width: var(--sidebar-width);
    }
  }
</style>
