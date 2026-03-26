<script>
  let { method, config, onupdate } = $props();

  function snap(value, field) {
    const range = field.max - field.min;
    const threshold = range * 0.015;
    // Snap to zero for ranges crossing zero
    if (field.min < 0 && field.max > 0 && Math.abs(value) < threshold) return 0;
    // Snap to custom snap points (static or dynamic from config)
    if (field.snap != null) {
      const raw = typeof field.snap === 'function' ? field.snap(config) : field.snap;
      const points = Array.isArray(raw) ? raw : [raw];
      for (const p of points) {
        if (Math.abs(value - p) < threshold) return p;
      }
    }
    return value;
  }

  function isDisabled(field) {
    return typeof field.disabled === 'function' ? field.disabled(config) : false;
  }

  function handleUpdate(field, value) {
    onupdate(field.key, value);
    // Apply side-effects from onChange
    if (typeof field.onChange === 'function') {
      const updates = field.onChange(value, config);
      if (updates) {
        for (const [k, v] of Object.entries(updates)) {
          onupdate(k, v);
        }
      }
    }
  }
</script>

{#if !method}
  <p class="placeholder">Select an operation to see its settings.</p>
{:else if !method.configSchema || method.configSchema.length === 0}
  <p class="placeholder">This operation has no configurable settings.</p>
{:else}
  {#each method.configSchema as field}
    <div class="control-group" class:disabled={isDisabled(field)}>
      {#if field.type === 'range'}
        <div class="range-label">
          <label for={field.key}>{field.label}</label>
          <span class="range-value">{config[field.key] ?? field.default}</span>
        </div>
      {:else}
        <label for={field.key}>{field.label}</label>
      {/if}

      {#if field.type === 'range'}
        <input
          id={field.key}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={config[field.key] ?? field.default}
          disabled={isDisabled(field)}
          oninput={(e) => {
            const v = snap(Number(e.target.value), field);
            if (v !== Number(e.target.value)) e.target.value = v;
            handleUpdate(field, v);
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
          disabled={isDisabled(field)}
          oninput={(e) => handleUpdate(field, Number(e.target.value))}
        />
      {:else if field.type === 'select'}
        <div class="mode-toggle" role="radiogroup" aria-label={field.label}>
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

  .control-group.disabled {
    opacity: 0.4;
    pointer-events: none;
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
