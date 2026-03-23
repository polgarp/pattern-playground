<script>
  import FontSelector from './FontSelector.svelte';
  import MethodSelector from './MethodSelector.svelte';
  import CanvasControls from './CanvasControls.svelte';

  let expandedSections = $state({
    'font': true,
    'operations': true,
    'canvas': true,
  });

  function toggleSection(key) {
    expandedSections = { ...expandedSections, [key]: !expandedSections[key] };
  }
</script>

<div class="sidebar-content">
  <section>
    <h3>
      <button class="section-toggle" onclick={() => toggleSection('font')}>
        <span class="arrow">{expandedSections['font'] ? '▾' : '▸'}</span>
        Motif
      </button>
    </h3>
    {#if expandedSections['font']}
      <div class="section-body">
        <FontSelector />
      </div>
    {/if}
  </section>

  <section>
    <h3>
      <button class="section-toggle" onclick={() => toggleSection('operations')}>
        <span class="arrow">{expandedSections['operations'] ? '▾' : '▸'}</span>
        Operations
      </button>
    </h3>
    {#if expandedSections['operations']}
      <div class="section-body">
        <MethodSelector />
      </div>
    {/if}
  </section>

  <section>
    <h3>
      <button class="section-toggle" onclick={() => toggleSection('canvas')}>
        <span class="arrow">{expandedSections['canvas'] ? '▾' : '▸'}</span>
        Canvas & Export
      </button>
    </h3>
    {#if expandedSections['canvas']}
      <div class="section-body">
        <CanvasControls />
      </div>
    {/if}
  </section>
</div>

<style>
  .sidebar-content {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  section {
    display: flex;
    flex-direction: column;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 0;
  }

  .section-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    text-align: left;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    color: var(--accent);
    background: none;
    padding: 0;
    border-radius: 0;
  }

  .section-toggle:hover {
    background: none;
    color: var(--accent-hover);
  }

  .arrow {
    font-size: 10px;
    width: 14px;
  }
</style>
