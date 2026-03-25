<script>
  import { sliceBounds } from '../stores/canvas.js';
  import { onMount } from 'svelte';

  let containerEl = $state(null);
  let containerW = $state(800);
  let containerH = $state(600);

  let dragging = $state(null); // null | 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  let dragStart = $state({ x: 0, y: 0 });
  let boundsStart = $state({ x: 0, y: 0, w: 0, h: 0 });

  const MIN_SIZE = 20;

  onMount(() => {
    const parent = containerEl?.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerW = entry.contentRect.width;
        containerH = entry.contentRect.height;
      }
    });
    ro.observe(parent);

    // Initialize slice to 50% centered
    const w = parent.clientWidth * 0.5;
    const h = parent.clientHeight * 0.5;
    $sliceBounds = {
      x: (parent.clientWidth - w) / 2,
      y: (parent.clientHeight - h) / 2,
      w, h,
    };

    return () => ro.disconnect();
  });

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function onPointerDown(e, mode) {
    e.preventDefault();
    e.stopPropagation();
    dragging = mode;
    dragStart = { x: e.clientX, y: e.clientY };
    boundsStart = { ...$sliceBounds };
    containerEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const b = { ...boundsStart };

    if (dragging === 'move') {
      b.x = clamp(b.x + dx, 0, containerW - b.w);
      b.y = clamp(b.y + dy, 0, containerH - b.h);
    } else {
      // Resize based on handle
      if (dragging.includes('w')) {
        const newX = clamp(b.x + dx, 0, b.x + b.w - MIN_SIZE);
        b.w = b.w + (b.x - newX);
        b.x = newX;
      }
      if (dragging.includes('e')) {
        b.w = clamp(b.w + dx, MIN_SIZE, containerW - b.x);
      }
      if (dragging.includes('n')) {
        const newY = clamp(b.y + dy, 0, b.y + b.h - MIN_SIZE);
        b.h = b.h + (b.y - newY);
        b.y = newY;
      }
      if (dragging.includes('s')) {
        b.h = clamp(b.h + dy, MIN_SIZE, containerH - b.y);
      }
    }

    $sliceBounds = b;
  }

  function onPointerUp() {
    dragging = null;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="slice-overlay"
  bind:this={containerEl}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
>
  <!-- Dimming mask -->
  <svg class="dim-mask" width={containerW} height={containerH}>
    <defs>
      <clipPath id="slice-hole" clipPathUnits="userSpaceOnUse">
        <path
          fill-rule="evenodd"
          d="M 0 0 H {containerW} V {containerH} H 0 Z
             M {$sliceBounds.x} {$sliceBounds.y}
             V {$sliceBounds.y + $sliceBounds.h}
             H {$sliceBounds.x + $sliceBounds.w}
             V {$sliceBounds.y}
             Z"
        />
      </clipPath>
    </defs>
    <rect
      width={containerW}
      height={containerH}
      fill="rgba(0,0,0,0.4)"
      clip-path="url(#slice-hole)"
    />
  </svg>

  <!-- Slice rectangle -->
  <div
    class="slice-rect"
    style="left:{$sliceBounds.x}px; top:{$sliceBounds.y}px; width:{$sliceBounds.w}px; height:{$sliceBounds.h}px;"
  >
    <!-- Drag area -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="drag-area" onpointerdown={(e) => onPointerDown(e, 'move')}></div>

    <!-- Dimensions label -->
    <div class="dimensions">{Math.round($sliceBounds.w)} &times; {Math.round($sliceBounds.h)}</div>

    <!-- Corner handles -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle corner nw" onpointerdown={(e) => onPointerDown(e, 'nw')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle corner ne" onpointerdown={(e) => onPointerDown(e, 'ne')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle corner sw" onpointerdown={(e) => onPointerDown(e, 'sw')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle corner se" onpointerdown={(e) => onPointerDown(e, 'se')}></div>

    <!-- Edge handles -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle edge n" onpointerdown={(e) => onPointerDown(e, 'n')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle edge s" onpointerdown={(e) => onPointerDown(e, 's')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle edge e" onpointerdown={(e) => onPointerDown(e, 'e')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="handle edge w" onpointerdown={(e) => onPointerDown(e, 'w')}></div>
  </div>
</div>

<style>
  .slice-overlay {
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
  }

  .dim-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .slice-rect {
    position: absolute;
    border: 2px solid var(--accent);
    pointer-events: none;
  }

  .drag-area {
    position: absolute;
    inset: 0;
    cursor: move;
    pointer-events: auto;
  }

  .dimensions {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    background: rgba(255, 255, 255, 0.85);
    padding: 2px 8px;
    border-radius: 3px;
    pointer-events: none;
    user-select: none;
    font-variant-numeric: tabular-nums;
  }

  .handle {
    position: absolute;
    pointer-events: auto;
  }

  .handle.corner {
    width: 10px;
    height: 10px;
    background: var(--accent);
    border-radius: 2px;
  }

  .handle.corner.nw { top: -5px; left: -5px; cursor: nwse-resize; }
  .handle.corner.ne { top: -5px; right: -5px; cursor: nesw-resize; }
  .handle.corner.sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
  .handle.corner.se { bottom: -5px; right: -5px; cursor: nwse-resize; }

  .handle.edge {
    background: var(--accent);
    border-radius: 2px;
  }

  .handle.edge.n {
    top: -4px; left: 50%; transform: translateX(-50%);
    width: 24px; height: 6px; cursor: ns-resize;
  }
  .handle.edge.s {
    bottom: -4px; left: 50%; transform: translateX(-50%);
    width: 24px; height: 6px; cursor: ns-resize;
  }
  .handle.edge.e {
    right: -4px; top: 50%; transform: translateY(-50%);
    width: 6px; height: 24px; cursor: ew-resize;
  }
  .handle.edge.w {
    left: -4px; top: 50%; transform: translateY(-50%);
    width: 6px; height: 24px; cursor: ew-resize;
  }
</style>
