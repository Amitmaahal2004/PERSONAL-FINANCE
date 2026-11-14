// Pure color & theme utility functions (Safe for both Server Components and Client Components)

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex) return { r: 16, g: 185, b: 129 };
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 16, g: 185, b: 129 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustColorBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (c: number) => {
    const val = Math.round(c * (1 + percent / 100));
    return Math.min(255, Math.max(0, val));
  };
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

