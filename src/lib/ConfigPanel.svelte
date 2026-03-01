<script>
  import { selectedMethod, methodConfig } from '../stores/methods.js';

  function updateConfig(key, value) {
    $methodConfig = { ...$methodConfig, [key]: value };
  }
</script>

{#if !$selectedMethod}
  <p class="placeholder">Select an operation to see its settings.</p>
{:else if !$selectedMethod.configSchema || $selectedMethod.configSchema.length === 0}
  <p class="placeholder">This operation has no configurable settings.</p>
{:else}
  {#each $selectedMethod.configSchema as field}
    <div class="control-group">
      <label for={field.key}>
        {field.label}
        {#if field.type === 'range'}
          : {$methodConfig[field.key] ?? field.default}
        {/if}
      </label>

      {#if field.type === 'range'}
        <input
          id={field.key}
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={$methodConfig[field.key] ?? field.default}
          oninput={(e) => updateConfig(field.key, Number(e.target.value))}
        />
      {:else if field.type === 'number'}
        <input
          id={field.key}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={$methodConfig[field.key] ?? field.default}
          oninput={(e) => updateConfig(field.key, Number(e.target.value))}
        />
      {:else if field.type === 'select'}
        <select
          id={field.key}
          value={$methodConfig[field.key] ?? field.default}
          onchange={(e) => updateConfig(field.key, e.target.value)}
        >
          {#each field.options as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      {:else if field.type === 'toggle'}
        <label class="toggle-label">
          <input
            type="checkbox"
            checked={$methodConfig[field.key] ?? field.default}
            onchange={(e) => updateConfig(field.key, e.target.checked)}
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
