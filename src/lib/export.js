import { get } from 'svelte/store';
import { exportWidth, exportHeight } from '../stores/canvas.js';
import { selectedFont } from '../stores/fonts.js';

// Fetch Google Font CSS, download all font files, and return CSS with inlined data URIs
async function embedFontStyle(family) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    const cssRes = await fetch(cssUrl);
    let cssText = await cssRes.text();

    // Find all font file URLs in the CSS
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    const urls = [...cssText.matchAll(urlRegex)].map(m => m[1]);
    if (urls.length === 0) return null;

    // Fetch each font file and replace URLs with base64 data URIs
    const unique = [...new Set(urls)];
    for (const fontUrl of unique) {
      const fontRes = await fetch(fontUrl);
      const fontBuf = await fontRes.arrayBuffer();
      const bytes = new Uint8Array(fontBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const format = fontUrl.includes('.woff2') ? 'woff2' : 'woff';
      cssText = cssText.replaceAll(fontUrl, `data:font/${format};base64,${base64}`);
    }

    return cssText;
  } catch (e) {
    console.warn('Could not embed font:', e);
    return null;
  }
}

function injectFontStyle(svgClone, fontFaceRule) {
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = fontFaceRule;
  svgClone.insertBefore(style, svgClone.firstChild);
}

function getSliceViewBox(bounds) {
  const container = document.querySelector('#pattern-canvas');
  if (!container) return null;
  const rect = container.getBoundingClientRect();
  const cw = rect.width, ch = rect.height;
  return {
    x: bounds.x - cw / 2,
    y: bounds.y - ch / 2,
    w: Math.round(bounds.w),
    h: Math.round(bounds.h),
  };
}

function makeEmbedSVG(sliceBounds) {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return null;

  const clone = svgEl.cloneNode(true);

  let w, h, vbX, vbY;
  if (sliceBounds) {
    const vb = getSliceViewBox(sliceBounds);
    w = vb.w; h = vb.h; vbX = vb.x; vbY = vb.y;
  } else {
    w = get(exportWidth);
    h = get(exportHeight);
    vbX = -w / 2;
    vbY = -h / 2;
  }

  clone.setAttribute('width', w);
  clone.setAttribute('height', h);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('viewBox');
  clone.setAttribute('viewBox', `${vbX} ${vbY} ${w} ${h}`);

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

export async function exportSVG(sliceBounds = null) {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true);

  if (sliceBounds) {
    const vb = getSliceViewBox(sliceBounds);
    clone.setAttribute('width', vb.w);
    clone.setAttribute('height', vb.h);
    clone.removeAttribute('viewBox');
    clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  const fontRule = await embedFontStyle(get(selectedFont));
  if (fontRule) injectFontStyle(clone, fontRule);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  download(blob, 'pattern.svg');
}

export async function copySVG(sliceBounds = null) {
  const clone = makeEmbedSVG(sliceBounds);
  if (!clone) return;

  const fontRule = await embedFontStyle(get(selectedFont));
  if (fontRule) injectFontStyle(clone, fontRule);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  await navigator.clipboard.writeText(svgString);
}

export async function exportPNG(sliceBounds = null) {
  const svgEl = document.querySelector('#pattern-canvas svg');
  if (!svgEl) return;

  let w, h;
  const clone = svgEl.cloneNode(true);

  if (sliceBounds) {
    const vb = getSliceViewBox(sliceBounds);
    w = vb.w; h = vb.h;
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    clone.removeAttribute('viewBox');
    clone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  } else {
    w = get(exportWidth);
    h = get(exportHeight);
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
  }

  // Embed the font so it renders in the isolated <img> context
  const fontRule = await embedFontStyle(get(selectedFont));
  if (fontRule) injectFontStyle(clone, fontRule);

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

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
