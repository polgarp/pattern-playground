<script>
  let { method, config, onupdate } = $props();

  function snapToZero(value, field) {
    if (field.min < 0 && field.max > 0) {
      const range = field.max - field.min;
      const threshold = range * 0.015;
      if (Math.abs(value) < threshold) return 0;
    }
    return value;
  }
</script>

{#if !method}
  <p class="placeholder">Select an operation to see its settings.</p>
{:else if !method.configSchema || method.configSchema.length === 0}
  <p class="placeholder">This operation has no configurable settings.</p>
{:else}
  {#each method.configSchema as field}
    <div class="control-group">
      <label for={field.key}>
        {field.label}
        {#if field.type === 'range'}
          : {config[field.key] ?? field.default}
        {/if}
      </label>

      {#if field.type === 'range'}
        <input
          id={field.key}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={config[field.key] ?? field.default}
          oninput={(e) => {
            const v = snapToZero(Number(e.target.value), field);
            if (v === 0) e.target.value = 0;
            onupdate(field.key, v);
          }}
        />
      {:else if field.type === 'number'}
        <input
          id={field.key}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={config[field.key] ?? field.default}
          oninput={(e) => onupdate(field.key, Number(e.target.value))}
        />
      {:else if field.type === 'select'}
        <div class="segmented-buttons" role="radiogroup" aria-label={field.label}>
          {#each field.options as opt}
            <button
              class:active={(config[field.key] ?? field.default) === opt.value}
              onclick={() => onupdate(field.key, opt.value)}
              role="radio"
              aria-checked={(config[field.key] ?? field.default) === opt.value}
            >{opt.label}</button>
          {/each}
        </div>
      {:else if field.type === 'toggle'}
        <label class="toggle-label">
          <input
            type="checkbox"
            checked={config[field.key] ?? field.default}
            onchange={(e) => onupdate(field.key, e.target.checked)}
          />
          {field.label}
        </label>
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

  .segmented-buttons {
    display: flex;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .segmented-buttons button {
    flex: 1;
    padding: 4px 8px;
    font-size: 12px;
    border: none;
    border-right: 1px solid var(--border);
    background: var(--bg-input);
    color: var(--text);
    cursor: pointer;
  }

  .segmented-buttons button:last-child {
    border-right: none;
  }

  .segmented-buttons button.active {
    background: var(--accent);
    color: #fff;
  }

  .segmented-buttons button:hover:not(.active) {
    background: var(--border);
    color: var(--text);
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
