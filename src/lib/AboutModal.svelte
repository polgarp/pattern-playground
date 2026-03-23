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
  <div class="modal" role="dialog" aria-modal="true" aria-label="About Tilecraft">
    <button class="close-btn" onclick={onclose} aria-label="Close">&times;</button>

    <h2>Tilecraft</h2>

    <p>
      An interactive tool for exploring repeating pattern techniques from
      Paul Jackson's
      <a href="https://www.laurenceking.com/products/how-to-make-repeating-patterns" target="_blank" rel="noopener">
        <em>"How to Make Repeating Patterns"</em></a>.
    </p>

    <p>
      Choose a motif &mdash; type a letter with any Google Font, or upload an SVG.
      Build a pattern pipeline by chaining symmetry operations (rotation,
      translation, reflection, glide reflection), then tile the result with
      adjustable padding, row/column offsets, and skew. Reorder, toggle, or
      remove steps at any time.
    </p>

    <p>
      Export your designs as SVG or PNG, or copy embed-friendly SVG to your
      clipboard. Pan with left-click, rotate the canvas with right-click,
      and zoom with the scroll wheel.
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

  p {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 8px;
  }

  em {
    color: var(--accent);
    font-style: italic;
  }

  a {
    color: var(--accent);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .footer {
    margin-top: 20px;
    font-size: 12px;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    padding-top: 12px;
  }
</style>
