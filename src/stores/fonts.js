import { writable, derived } from 'svelte/store';

// Motif mode: 'text' or 'svg'
export const motifType = writable('text');

// SVG motif data: { markup, viewBox, w, h } or null
export const svgMotif = writable(null);

export const fontList = writable([]);
export const fontSearch = writable('');
export const selectedFont = writable('Arial');
export const fontSize = writable(120);
export const letterInput = writable('a');
export const fontLoaded = writable(false);

export const filteredFonts = derived(
  [fontList, fontSearch],
  ([$fontList, $fontSearch]) => {
    if (!$fontSearch) return $fontList.slice(0, 60);
    const q = $fontSearch.toLowerCase();
    return $fontList.filter(f => f.family.toLowerCase().includes(q)).slice(0, 60);
  }
);

export function parseSVGUpload(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return null;

  // Get dimensions from viewBox or width/height
  const vb = svg.getAttribute('viewBox');
  let w, h;
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    w = parts[2];
    h = parts[3];
  } else {
    w = parseFloat(svg.getAttribute('width')) || 100;
    h = parseFloat(svg.getAttribute('height')) || 100;
  }

  // Extract inner content (everything inside <svg>)
  const markup = svg.innerHTML;

  return { markup, viewBox: vb || `0 0 ${w} ${h}`, w, h };
}

let loadedFonts = new Set();

export async function fetchFontList(apiKey) {
  // Use a curated popular font list if no API key, or fetch from Google Fonts API
  if (!apiKey) {
    const popular = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
      'Poppins', 'Merriweather', 'Playfair Display', 'Bebas Neue',
      'Lobster', 'Pacifico', 'Dancing Script', 'Caveat', 'Permanent Marker',
      'Abril Fatface', 'Alfa Slab One', 'Bangers', 'Bungee', 'Concert One',
      'Fredoka One', 'Righteous', 'Russo One', 'Sigmar One', 'Titan One',
      'Ultra', 'Anton', 'Archivo Black', 'Black Ops One', 'Bungee Shade',
      'Press Start 2P', 'Special Elite', 'Vollkorn', 'Crimson Text',
      'Libre Baskerville', 'Source Serif Pro', 'PT Serif', 'Noto Serif',
      'EB Garamond', 'Cormorant Garamond', 'Spectral', 'Literata',
      'IBM Plex Sans', 'Inter', 'Work Sans', 'Nunito', 'Quicksand',
      'Comfortaa', 'Josefin Sans', 'Titillium Web',
    ];
    fontList.set(popular.map(f => ({ family: f })));
    return;
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
    );
    const data = await res.json();
    fontList.set(data.items || []);
  } catch (e) {
    console.error('Failed to fetch fonts:', e);
  }
}

export function pickRandomFont() {
  let list;
  fontList.subscribe(v => list = v)();
  if (list && list.length > 0) {
    const random = list[Math.floor(Math.random() * list.length)];
    selectedFont.set(random.family);
  }
}

export async function loadFont(family) {
  if (loadedFonts.has(family)) {
    fontLoaded.set(true);
    return;
  }
  // Add immediately to prevent concurrent calls from duplicating work
  loadedFonts.add(family);
  fontLoaded.set(false);
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);

    await document.fonts.load(`16px "${family}"`);
    fontLoaded.set(true);
  } catch (e) {
    console.error('Failed to load font:', e);
    loadedFonts.delete(family); // allow retry on failure
    fontLoaded.set(true); // fallback
  }
}
