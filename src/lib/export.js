import { get } from 'svelte/store';
import { exportWidth, exportHeight } from '../stores/canvas.js';
import { selectedFont, letterInput, motifType } from '../stores/fonts.js';
import { operationChain } from '../stores/methods.js';

// Fetch Google Font CSS, download all font files, and return CSS with inlined data URIs
const fontStyleCache = new Map();
async function embedFontStyle(family) {
  if (fontStyleCache.has(family)) return fontStyleCache.get(family);
  const promise = embedFontStyleUncached(family);
  fontStyleCache.set(family, promise);
  return promise;
}

async function embedFontStyleUncached(family) {
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
      const CHUNK = 8192;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
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
  // Strip properties Inkscape doesn't understand
  const cleaned = fontFaceRule
    .replace(/font-display:\s*swap;?\s*/g, '')
    .replace(/unicode-range:[^;]+;?\s*/g, '');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.setAttribute('type', 'text/css');
  style.textContent = cleaned;
  defs.appendChild(style);
  svgClone.insertBefore(defs, svgClone.firstChild);
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

  // Remove guide/overlay elements (markers, guide lines, hit areas)
  for (const el of clone.querySelectorAll('[marker-end], [stroke-dasharray], [pointer-events]')) {
    el.remove();
  }
  // Remove invisible transparent hit-area elements
  for (const el of clone.querySelectorAll('[fill="transparent"], [stroke="transparent"]')) {
    el.remove();
  }

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

  // Remove any empty <g> elements left behind
  for (const g of [...clone.querySelectorAll('g')]) {
    if (g.children.length === 0 && !g.textContent.trim()) g.remove();
  }

  return clone;
}

export async function exportSVG(sliceBounds = null) {
  const clone = makeEmbedSVG(sliceBounds);
  if (!clone) return;

  const fontRule = await embedFontStyle(get(selectedFont));
  if (fontRule) injectFontStyle(clone, fontRule);

  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  download(blob, buildFilename('svg'));
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
      if (blob) download(blob, buildFilename('png'));
    }, 'image/png');
  };
  img.src = url;
}

const OP_ABBR = {
  rotation: 'rot',
  translation: 'shift',
  reflection: 'flip',
  glideReflection: 'glide',
};

function buildFilename(ext) {
  const type = get(motifType);
  const chain = get(operationChain).filter(op => op.enabled ?? true);

  // Motif part
  let motif;
  if (type === 'svg') {
    motif = 'svg';
  } else {
    const letter = get(letterInput) || 'x';
    const font = get(selectedFont).replace(/\s+/g, '');
    motif = `${letter}-${font}`;
  }

  // Operations part — abbreviate each, deduplicate consecutive same ops with count
  let ops = '';
  if (chain.length > 0) {
    const abbrs = chain.map(op => OP_ABBR[op.methodId] || op.methodId.slice(0, 4));
    // Collapse runs: [rot, rot, flip] → "rot×2-flip"
    const parts = [];
    let i = 0;
    while (i < abbrs.length) {
      let count = 1;
      while (i + count < abbrs.length && abbrs[i + count] === abbrs[i]) count++;
      parts.push(count > 1 ? `${abbrs[i]}x${count}` : abbrs[i]);
      i += count;
    }
    ops = parts.join('-');
  }

  // Short fingerprint from config values so different settings → different names
  const configStr = chain.map(op =>
    Object.values(op.config).join(',')
  ).join(';');
  let hash = 0;
  for (let i = 0; i < configStr.length; i++) {
    hash = ((hash << 5) - hash + configStr.charCodeAt(i)) | 0;
  }
  const tag = Math.abs(hash).toString(36).slice(0, 4);

  const segments = ['tilecraft', motif];
  if (ops) segments.push(ops);
  segments.push(tag);
  return segments.join('-') + '.' + ext;
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
