// Heuristics for picking jersey colors per side. Home keeps it simple (color +
// alternateColor as trim). Away tries to use alternateColor as the base — to feel
// like a real "away kit" — but only when it's genuinely distinct from `color` and
// won't blend into the dark pitch background.

export type JerseyColorSet = {
  primary: string;
  trim?: string;
};

// Minimum RGB distance (0–441.7) for two colors to be considered visually distinct.
const DISTINCT_THRESHOLD = 70;

// Colors darker than this blend into the pitch's dark green background.
const PITCH_BLEND_LUMINANCE = 0.12;

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1; // unknown color → assume safe/light, don't block it
  const [r, g, b] = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return Infinity; // can't compare → treat as distinct
  const [r1, g1, b1] = rgbA;
  const [r2, g2, b2] = rgbB;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function blendsWithPitch(hex: string): boolean {
  return relativeLuminance(hex) < PITCH_BLEND_LUMINANCE;
}

export function resolveHomeJersey(color?: string | null, alternateColor?: string | null): JerseyColorSet | null {
  if (!color) return null;
  return { primary: color, trim: alternateColor ?? undefined };
}

export function resolveAwayJersey(color?: string | null, alternateColor?: string | null): JerseyColorSet | null {
  if (!color && !alternateColor) return null;
  if (!alternateColor) return { primary: color! };
  if (!color) return { primary: alternateColor };

  const tooSimilar = colorDistance(color, alternateColor) < DISTINCT_THRESHOLD;
  const altBlends = blendsWithPitch(alternateColor);

  if (tooSimilar || altBlends) {
    // The alternate doesn't add real differentiation, or it would vanish against
    // the pitch — keep the main color as base, same treatment as home.
    return { primary: color, trim: altBlends ? undefined : alternateColor };
  }

  return { primary: alternateColor, trim: color };
}
