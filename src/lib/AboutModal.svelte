<script>
  let { onclose } = $props();

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="backdrop" onclick={handleBackdrop}>
  <div class="modal" role="dialog" aria-modal="true" aria-label="About Pattern Playground">
    <button class="close-btn" onclick={onclose} aria-label="Close">&times;</button>

    <h2>Pattern Playground</h2>

    <p>
      An interactive browser-based tool for exploring repeating pattern methods
      from Paul Jackson's book
      <em>"How to Make Repeating Patterns."</em>
    </p>

    <p>
      Select a font and letter, choose a pattern method, adjust its settings,
      and see the result rendered live. Toggle between a single tile view and
      a tiled preview to see how the pattern repeats. Export your designs as
      SVG or PNG.
    </p>

    <h3>How to use</h3>
    <ol>
      <li>Pick a font from the dropdown and type a letter or short text.</li>
      <li>Select a pattern method from the sidebar.</li>
      <li>Adjust the method's settings to explore variations.</li>
      <li>Use the tile margin slider to control spacing.</li>
      <li>Toggle between Tile and Tiled views.</li>
      <li>Export your pattern as SVG or PNG.</li>
    </ol>

    <h3>About the book</h3>
    <p>
      <em>"How to Make Repeating Patterns"</em> by Paul Jackson presents a
      systematic exploration of pattern-making techniques. This playground
      brings those methods to life, letting you experiment with them
      interactively using any font and character.
    </p>

    <p class="footer">
      Built with Svelte + Vite. All rendering happens in the browser &mdash; no
      server required.
    </p>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #fff;
    color: var(--text);
    border-radius: 12px;
    padding: 32px;
    max-width: 520px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    padding: 0;
    background: none;
    color: var(--text-muted);
    border-radius: 50%;
  }

  .close-btn:hover {
    background: var(--accent);
    color: #fff;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 12px;
    color: var(--accent);
  }

  h3 {
    margin-top: 16px;
    margin-bottom: 6px;
    border-bottom: none;
    color: var(--text);
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 8px;
  }

  ol {
    font-size: 14px;
    line-height: 1.8;
    padding-left: 20px;
    margin-bottom: 8px;
  }

  em {
    color: var(--accent);
    font-style: italic;
  }

  .footer {
    margin-top: 20px;
    font-size: 12px;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    padding-top: 12px;
  }
</style>
