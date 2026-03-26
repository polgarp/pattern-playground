import { writable } from 'svelte/store';

export const viewMode = writable('tile'); // 'tile' or 'tiled'
export const zoom = writable(1);
export const panX = writable(0);
export const panY = writable(0);
export const rotation = writable(0);
export const showGuides = writable(false);
export const showOperationGuides = writable(false);
export const hoveredOperationIndex = writable(null);
export const tilesX = writable(5);
export const tilesY = writable(5);
export const paddingX = writable(10);
export const paddingY = writable(10);
export const rowOffset = writable(0);
export const colOffset = writable(0);
export const tileSkew = writable(0);
export const exportWidth = writable(2048);
export const exportHeight = writable(2048);
export const sliceActive = writable(false);
export const sliceBounds = writable({ x: 0, y: 0, w: 0, h: 0 });

// Measures actual text dimensions using a canvas 2D context
const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

export function measureText(text, fontFamily, fontSizePx) {
  if (!measureCanvas) return { w: fontSizePx * 0.6, h: fontSizePx };
  measureCanvas.font = `${fontSizePx}px "${fontFamily}", sans-serif`;
  const m = measureCanvas.measureText(text);
  const w = m.width;
  // Use actual bounding box if available, otherwise approximate
  const ascent = m.actualBoundingBoxAscent ?? fontSizePx * 0.8;
  const descent = m.actualBoundingBoxDescent ?? fontSizePx * 0.2;
  const h = ascent + descent;
  return { w, h, ascent, descent };
}
