import { get } from 'svelte/store';
import { exportWidth, exportHeight } from '../stores/canvas.js';

export function exportSVG() {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  download(blob, 'pattern.svg');
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
