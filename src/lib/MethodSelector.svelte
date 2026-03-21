<script>
  import {
    methodRegistry,
    operationChain,
    addOperation,
    removeOperation,
    updateOperationConfig,
    moveOperation,
    MAX_OPERATIONS,
  } from '../stores/methods.js';
  import ConfigPanel from './ConfigPanel.svelte';

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

{#if $methodRegistry.length === 0}
  <p class="placeholder">No operations loaded yet.</p>
{:else}
  <div class="chain-list" bind:this={listEl}>
    {#each $operationChain as op, index}
      {@const method = getMethod(op.methodId)}
      {#if getPlaceholderIndex() === index && dragIndex > index}
        <div class="drop-placeholder"></div>
      {/if}
      <div
        class="chain-step {getStepClass(index)}"
        bind:this={stepEls[index]}
      >
        <div class="step-header">
          <div
            class="drag-handle"
            onpointerdown={(e) => onHandlePointerDown(e, index)}
            aria-label="Reorder step"
          >⋮⋮</div>
          <button class="step-toggle" onclick={() => toggleStep(index)}>
            <span class="arrow">{expandedSteps[index] ? '▾' : '▸'}</span>
            <span class="step-label">Step {index + 1}: {method?.name ?? 'Unknown'}</span>
          </button>
          <button class="remove-btn" onclick={() => removeOperation(index)} aria-label="Remove step">x</button>
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
      <span class="add-label">+ Add operation</span>
      <div class="add-buttons">
        {#each $methodRegistry as m}
          <button class="add-method-btn" onclick={() => handleAdd(m.id)}>
            {m.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}
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
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background: var(--bg-input);
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    font-size: 14px;
    letter-spacing: -3px;
    padding: 6px 6px;
    user-select: none;
    line-height: 1;
    touch-action: none;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle:hover {
    color: var(--accent);
  }

  .step-toggle {
    display: flex;
    align-items: center;
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

  .remove-btn {
    font-size: 12px;
    padding: 0 6px;
    line-height: 1.4;
    color: var(--text-muted);
    background: none;
    border: none;
  }

  .remove-btn:hover {
    color: var(--accent);
    background: var(--bg-input);
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
</style>
