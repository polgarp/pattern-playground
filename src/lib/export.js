import { get } from 'svelte/store';
import { exportWidth, exportHeight } from '../stores/canvas.js';

function makeEmbedSVG() {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return null;

  const clone = svgEl.cloneNode(true);
  const w = get(exportWidth);
  const h = get(exportHeight);

  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('viewBox');
  clone.setAttribute('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`);

  // Inline <use> references so SVG works standalone
  const defs = clone.querySelector('defs');
  const symbols = {};
  if (defs) {
    for (const sym of defs.querySelectorAll('symbol')) {
      symbols['#' + sym.id] = sym;
    }
  }
  for (const use of clone.querySelectorAll('use')) {
    const href = use.getAttribute('href');
    const sym = symbols[href];
    if (!sym) continue;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const x = use.getAttribute('x');
    const y = use.getAttribute('y');
    if (x || y) g.setAttribute('transform', `translate(${x || 0}, ${y || 0})`);
    for (const child of sym.children) {
      g.appendChild(child.cloneNode(true));
    }
    use.replaceWith(g);
  }

  // Remove defs (symbols no longer needed)
  if (defs) defs.remove();

  return clone;
}

export function exportSVG() {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  download(blob, 'pattern.svg');
}

export async function copySVG() {
  const clone = makeEmbedSVG();
  if (!clone) return;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  await navigator.clipboard.writeText(svgString);
}

export function exportPNG() {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return;

  const w = get(exportWidth);
  const h = get(exportHeight);

  const clone = svgEl.cloneNode(true);
  clone.setAttribute('width', w);
  clone.setAttribute('height', h);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) download(blob, 'pattern.png');
    }, 'image/png');
  };
  img.src = url;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
