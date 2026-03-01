<script>
  import {
    methodCategories,
    selectedMethodId,
    selectedMethod,
    methodConfig,
    getDefaultConfig,
    methodRegistry,
  } from '../stores/methods.js';
  import ConfigPanel from './ConfigPanel.svelte';

  let expandedCategories = $state({});

  function toggleCategory(cat) {
    expandedCategories = {
      ...expandedCategories,
      [cat]: !expandedCategories[cat],
    };
  }

  function selectMethod(method) {
    $selectedMethodId = method.id;
    $methodConfig = getDefaultConfig(method);
  }
</script>

{#if $methodRegistry.length === 0}
  <p class="placeholder">No operations loaded yet.</p>
{:else}
  {#each Object.entries($methodCategories) as [category, methods]}
    <div class="category">
      <button class="category-header" onclick={() => toggleCategory(category)}>
        <span class="arrow">{expandedCategories[category] ? '▾' : '▸'}</span>
        {category}
        <span class="count">{methods.length}</span>
      </button>

      {#if expandedCategories[category]}
        <div class="category-methods">
          {#each methods as method}
            <button
              class="method-btn"
              class:active={$selectedMethodId === method.id}
              onclick={() => selectMethod(method)}
            >
              {method.name}
            </button>

            {#if $selectedMethodId === method.id}
              <div class="inline-config">
                <ConfigPanel />
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/each}
{/if}

<style>
  .placeholder {
    color: var(--text-muted);
    font-size: 12px;
    font-style: italic;
  }

  .category {
    display: flex;
    flex-direction: column;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .category-header:hover {
    background: var(--bg-input);
    color: var(--accent);
  }

  .arrow {
    font-size: 10px;
    width: 14px;
  }

  .count {
    margin-left: auto;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 400;
  }

  .category-methods {
    display: flex;
    flex-direction: column;
    padding-left: 20px;
    gap: 2px;
  }

  .method-btn {
    text-align: left;
    font-size: 13px;
    padding: 4px 8px;
  }

  .inline-config {
    padding: 8px 8px 8px 8px;
    margin: 4px 0 8px 0;
    border-left: 2px solid var(--accent);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
