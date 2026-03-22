import { get } from 'svelte/store';
import { selectedFont, fontSize, letterInput } from './fonts.js';
import { viewMode, zoom, panX, panY, rotation, showGuides, tilesX, tilesY, paddingX, paddingY, rowOffset, colOffset, tileSkew } from './canvas.js';
import { operationChain } from './methods.js';

// Define all params with their store, type, and default value
const params = [
  { key: 'font', store: selectedFont, type: 'string' },
  { key: 'size', store: fontSize, type: 'number' },
  { key: 'letter', store: letterInput, type: 'string' },
  { key: 'view', store: viewMode, type: 'string' },
  { key: 'zoom', store: zoom, type: 'number' },
  { key: 'px', store: panX, type: 'number' },
  { key: 'py', store: panY, type: 'number' },
  { key: 'rot', store: rotation, type: 'number' },
  { key: 'guides', store: showGuides, type: 'boolean' },
  { key: 'tx', store: tilesX, type: 'number' },
  { key: 'ty', store: tilesY, type: 'number' },
  { key: 'padx', store: paddingX, type: 'number' },
  { key: 'pady', store: paddingY, type: 'number' },
  { key: 'roff', store: rowOffset, type: 'number' },
  { key: 'coff', store: colOffset, type: 'number' },
  { key: 'skew', store: tileSkew, type: 'number' },
];

function parseValue(raw, type) {
  if (type === 'number') return Number(raw);
  if (type === 'boolean') return raw === 'true' || raw === '1';
  return raw;
}

function readHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return new URLSearchParams(hash);
}

function writeHash() {
  const hp = new URLSearchParams();

  for (const p of params) {
    hp.set(p.key, String(get(p.store)));
  }

  // Serialize operation chain as JSON
  const chain = get(operationChain);
  if (chain.length > 0) {
    hp.set('chain', JSON.stringify(chain));
  }

  history.replaceState(null, '', '#' + hp.toString());
}

let debounceTimer;
function debouncedWriteHash() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(writeHash, 150);
}

export function initUrlState() {
  // 1. Restore state from hash if present
  const hp = readHash();
  if (hp) {
    for (const p of params) {
      if (hp.has(p.key)) {
        p.store.set(parseValue(hp.get(p.key), p.type));
      }
    }
    if (hp.has('chain')) {
      try {
        operationChain.set(JSON.parse(hp.get('chain')));
      } catch { /* ignore bad JSON */ }
    }
  }

  // 2. Subscribe to all stores and update hash on changes
  for (const p of params) {
    p.store.subscribe(debouncedWriteHash);
  }
  operationChain.subscribe(debouncedWriteHash);
}
