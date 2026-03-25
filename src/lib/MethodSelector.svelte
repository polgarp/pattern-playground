<script>
  import {
    methodRegistry,
    operationChain,
    addOperation,
    removeOperation,
    updateOperationConfig,
    moveOperation,
    toggleOperationEnabled,
    MAX_OPERATIONS,
  } from '../stores/methods.js';
  import {
    viewMode,
    showGuides,
    tilesX,
    tilesY,
    paddingX,
    paddingY,
    rowOffset,
    colOffset,
    tileSkew,
    showOperationGuides,
    hoveredOperationIndex,
  } from '../stores/canvas.js';
  import ConfigPanel from './ConfigPanel.svelte';

  let tilingExpanded = $state(true);

  function snapOffset(value) {
    const threshold = 0.03;
    if (Math.abs(value) < threshold) return 0;
    if (Math.abs(value - 0.5) < threshold) return 0.5;
    if (Math.abs(value + 0.5) < threshold) return -0.5;
    return value;
  }

  let expandedSteps = $state({});
  let stepEls = $state([]);
  let listEl = $state(null);

  // Drag state
  let dragIndex = $state(null);
  let dragOverIndex = $state(null);
  let dragClone = $state(null);
  let dragOffsetY = $state(0);

  function toggleStep(index) {
    expandedSteps = { ...expandedSteps, [index]: !expandedSteps[index] };
  }

  function getMethod(methodId) {
    return $methodRegistry.find(m => m.id === methodId) || null;
  }

  function handleAdd(methodId) {
    addOperation(methodId);
    expandedSteps = { ...expandedSteps, [$operationChain.length - 1]: true };
  }

  function onHandlePointerDown(e, index) {
    e.preventDefault();
    const el = stepEls[index];
    if (!el) return;

    dragIndex = index;
    dragOverIndex = index;

    // Create a floating clone
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.9';
    clone.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    clone.style.borderRadius = 'var(--radius)';
    clone.style.transition = 'none';
    document.body.appendChild(clone);
    dragClone = clone;

    dragOffsetY = e.clientY - rect.top;

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
  }

  function onDragMove(e) {
    if (dragClone) {
      const rect = dragClone.getBoundingClientRect();
      dragClone.style.top = (e.clientY - dragOffsetY) + 'px';
    }

    // Determine which step we're over
    if (!listEl) return;
    const chain = $operationChain;
    let newOver = chain.length - 1;
    for (let i = 0; i < chain.length; i++) {
      const el = stepEls[i];
      if (!el || i === dragIndex) continue;
      const rect = el.getBoundingClientRect();
      // Cursor is above this card — drop before it
      if (e.clientY < rect.top) {
        newOver = i;
        break;
      }
      // Cursor is within this card — drop at this position
      if (e.clientY <= rect.bottom) {
        newOver = i;
        break;
      }
    }
    dragOverIndex = newOver;
  }

  function onDragEnd() {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);

    const from = dragIndex;
    const to = dragOverIndex;

    // Capture clone position before removing it
    let cloneRect = null;
    if (dragClone) {
      cloneRect = dragClone.getBoundingClientRect();
      dragClone.remove();
      dragClone = null;
    }

    if (from !== null && to !== null && from !== to) {
      const oldExpanded = { ...expandedSteps };
      const newExpanded = {};
      const order = $operationChain.map((_, i) => i);
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      for (let newIdx = 0; newIdx < order.length; newIdx++) {
        newExpanded[newIdx] = oldExpanded[order[newIdx]] ?? false;
      }
      expandedSteps = newExpanded;
      moveOperation(from, to);

      // FLIP: animate from clone position to new DOM position
      if (cloneRect) {
        requestAnimationFrame(() => {
          const el = stepEls[to];
          if (!el) return;
          const newRect = el.getBoundingClientRect();
          const dx = cloneRect.left - newRect.left;
          const dy = cloneRect.top - newRect.top;

          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.zIndex = '10';

          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)';
            el.style.transform = '';
            el.addEventListener('transitionend', () => {
              el.style.zIndex = '';
              el.style.transition = '';
            }, { once: true });
          });
        });
      }
    }

    dragIndex = null;
    dragOverIndex = null;
  }

  function getStepClass(index) {
    if (dragIndex === null) return '';
    if (index === dragIndex) return 'dragging';
    if (dragOverIndex === null) return '';
    if (dragIndex < dragOverIndex) {
      if (index > dragIndex && index <= dragOverIndex) return 'shift-up';
    } else {
      if (index >= dragOverIndex && index < dragIndex) return 'shift-down';
    }
    return '';
  }

  function getPlaceholderIndex() {
    if (dragIndex === null || dragOverIndex === null) return -1;
    if (dragIndex === dragOverIndex) return -1;
    return dragOverIndex;
  }
</script>

<label class="toggle-label">
  <input type="checkbox" bind:checked={$showOperationGuides} />
  Show operation guides
</label>

{#if $methodRegistry.length === 0}
  <p class="placeholder">No operations loaded yet.</p>
{:else}
  <div class="chain-list" bind:this={listEl}>
    {#each $operationChain as op, index}
      {@const method = getMethod(op.methodId)}
      {#if getPlaceholderIndex() === index && dragIndex > index}
        <div class="drop-placeholder"></div>
      {/if}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="chain-step {getStepClass(index)}"
        class:step-disabled={!(op.enabled ?? true)}
        class:step-hovered={$hoveredOperationIndex === index}
        bind:this={stepEls[index]}
        onpointerenter={() => $hoveredOperationIndex = index}
        onpointerleave={() => $hoveredOperationIndex = null}
      >
        <div class="step-header">
          <div
            class="drag-handle"
            onpointerdown={(e) => onHandlePointerDown(e, index)}
            aria-label="Reorder step"
          ><span class="grip">⋮⋮</span><span class="step-num">{index + 1}</span></div>
          <button class="step-toggle" onclick={() => toggleStep(index)}>
            <span class="arrow">{expandedSteps[index] ? '▾' : '▸'}</span>
            <span class="step-label">{method?.name ?? 'Unknown'}</span>
          </button>
          <button
            class="visibility-btn"
            class:off={!(op.enabled ?? true)}
            onclick={() => toggleOperationEnabled(index)}
            aria-label={(op.enabled ?? true) ? 'Hide operation' : 'Show operation'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              {#if op.enabled ?? true}
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              {:else}
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              {/if}
            </svg>
          </button>
          <button class="remove-btn" onclick={() => removeOperation(index)} aria-label="Remove step">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>

        {#if expandedSteps[index]}
          {#if method}
            <div class="step-body">
              <ConfigPanel
                {method}
                config={op.config}
                onupdate={(key, value) => updateOperationConfig(index, key, value)}
              />
            </div>
          {/if}
        {/if}
      </div>
      {#if getPlaceholderIndex() === index && dragIndex < index}
        <div class="drop-placeholder"></div>
      {/if}
    {/each}
  </div>

  {#if $operationChain.length < MAX_OPERATIONS}
    <div class="add-section">
      {#if $operationChain.length === 0}
        <span class="add-hint">Add a symmetry operation to start building your pattern</span>
      {/if}
      <span class="add-label">+ Add operation</span>
      <div class="add-buttons">
        {#each $methodRegistry as m}
          <button
            class="add-method-btn"
            onclick={() => handleAdd(m.id)}
            title={m.description}
          >
            {m.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Permanent Tiling step -->
  <div class="chain-step tiling-step">
    <div class="step-header">
      <button class="step-toggle" onclick={() => tilingExpanded = !tilingExpanded}>
        <span class="arrow">{tilingExpanded ? '▾' : '▸'}</span>
        <span class="step-label">Tiling</span>
      </button>
    </div>

    {#if tilingExpanded}
      <div class="step-body">
        <div class="mode-toggle">
          <button class:active={$viewMode === 'tile'} onclick={() => $viewMode = 'tile'}>
            Single
          </button>
          <button class:active={$viewMode === 'tiled'} onclick={() => $viewMode = 'tiled'}>
            Tiled
          </button>
        </div>

        <label class="toggle-label">
          <input type="checkbox" bind:checked={$showGuides} />
          Show tile guides
        </label>

        <div class="control-group">
          <div class="range-label">
            <label for="padding-x">Horizontal padding</label>
            <span class="range-value">{$paddingX}px</span>
          </div>
          <input id="padding-x" type="range" min="-50" max="100" bind:value={$paddingX} />
        </div>

        <div class="control-group">
          <div class="range-label">
            <label for="padding-y">Vertical padding</label>
            <span class="range-value">{$paddingY}px</span>
          </div>
          <input id="padding-y" type="range" min="-50" max="100" bind:value={$paddingY} />
        </div>

        {#if $viewMode === 'tiled'}
          <div class="control-group">
            <div class="range-label">
              <label for="tiles-x">Horizontal tiles</label>
              <span class="range-value">{$tilesX}</span>
            </div>
            <input id="tiles-x" type="range" min="1" max="20" bind:value={$tilesX} />
          </div>

          <div class="control-group">
            <div class="range-label">
              <label for="tiles-y">Vertical tiles</label>
              <span class="range-value">{$tilesY}</span>
            </div>
            <input id="tiles-y" type="range" min="1" max="20" bind:value={$tilesY} />
          </div>

          <div class="control-group">
            <div class="range-label">
              <label for="row-offset">Row offset</label>
              <span class="range-value">{Math.round($rowOffset * 100)}%</span>
            </div>
            <input id="row-offset" type="range" min="-1" max="1" step="0.01" value={$rowOffset} oninput={(e) => $rowOffset = snapOffset(Number(e.target.value))} />
          </div>

          <div class="control-group">
            <div class="range-label">
              <label for="col-offset">Column offset</label>
              <span class="range-value">{Math.round($colOffset * 100)}%</span>
            </div>
            <input id="col-offset" type="range" min="-1" max="1" step="0.01" value={$colOffset} oninput={(e) => $colOffset = snapOffset(Number(e.target.value))} />
          </div>

          <div class="control-group">
            <div class="range-label">
              <label for="tile-skew">Skew</label>
              <span class="range-value">{Math.round($tileSkew * 100)}%</span>
            </div>
            <input id="tile-skew" type="range" min="-1" max="1" step="0.01" value={$tileSkew} oninput={(e) => $tileSkew = snapOffset(Number(e.target.value))} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .placeholder {
    color: var(--text-muted);
    font-size: 12px;
    font-style: italic;
  }

  .chain-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .chain-step {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
    background: var(--bg-panel);
  }

  .chain-step.step-hovered {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  .chain-step.dragging {
    opacity: 0.15;
  }

  .chain-step.shift-up {
    transform: translateY(-8px);
  }

  .chain-step.shift-down {
    transform: translateY(8px);
  }

  .drop-placeholder {
    height: 32px;
    border: 2px dashed var(--accent);
    border-radius: var(--radius);
    background: rgba(255, 63, 49, 0.06);
  }

  .step-header {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 6px 0 6px 8px;
    background: var(--bg-input);
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    padding: 4px 0;
    user-select: none;
    touch-action: none;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .grip {
    font-size: 14px;
    letter-spacing: -3px;
    line-height: 1;
  }

  .step-num {
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle:hover {
    color: var(--accent);
  }

  .step-toggle {
    display: flex;
    align-items: baseline;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    flex: 1;
  }

  .step-toggle:hover {
    background: none;
    color: var(--accent);
  }

  .step-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--accent);
  }

  .arrow {
    font-size: 10px;
    width: 14px;
    color: var(--text);
  }

  .step-disabled .step-label {
    color: var(--text-muted);
  }

  .step-disabled .step-header {
    opacity: 0.6;
  }

  .visibility-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    padding: 2px;
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
  }

  .visibility-btn:hover {
    color: var(--accent);
    background: none;
  }

  .visibility-btn.off {
    opacity: 0.4;
  }

  .remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    padding: 4px;
    margin-left: 2px;
    margin-right: 6px;
    color: var(--text-muted);
    background: none;
    border: none;
    opacity: 0.5;
    transition: opacity 0.15s, color 0.15s;
  }

  .remove-btn:hover {
    color: var(--accent);
    background: none;
    opacity: 1;
  }

  .step-body {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .add-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    padding: 8px;
  }

  .add-hint {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    padding-bottom: 4px;
  }

  .add-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
  }

  .add-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .add-method-btn {
    font-size: 12px;
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: none;
    color: var(--text);
    cursor: pointer;
  }

  .add-method-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--bg-input);
  }

  .tiling-step .step-header {
    padding-left: 8px;
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

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    text-transform: none;
    color: var(--text);
    cursor: pointer;
  }

</style>
