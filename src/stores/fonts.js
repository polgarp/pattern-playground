import { writable, derived } from 'svelte/store';

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
  fontLoaded.set(false);
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);

    // Wait for font to be ready
    await document.fonts.load(`16px "${family}"`);
    loadedFonts.add(family);
    fontLoaded.set(true);
  } catch (e) {
    console.error('Failed to load font:', e);
    fontLoaded.set(true); // fallback
  }
}
