// ──────────────────────────────────────────────────────────────────────────────
// Brand-colour ↔ surface contrast helpers.
//
// Two jobs:
//  1. adaptBrandColor() — silently nudges the brand colour's lightness (keeping
//     its hue) so the price amount stays legible on the chosen theme. For most
//     colours this is a no-op; only kicks in when the literal colour is too close
//     to the surface. This is the "auto-adapt by default" behaviour.
//  2. brandClashes() — flags the rare case where the colour is so close to the
//     page that even buttons/accents would blend in, so the customization step
//     can show a (dismissible) hint suggesting a more visible shade.
//
// Contrast uses the standard WCAG relative-luminance ratio (1 = identical,
// 21 = black-on-white). We keep the thresholds in plain-English terms below.
// ──────────────────────────────────────────────────────────────────────────────

// Reference surface the brand-coloured elements (amount, button) sit on, per theme.
// Matches panelBg in page-preview.tsx.
export const SURFACE = { light: "#f7f7f9", dark: "#1a2540" };

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a), l2 = luminance(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ── HSL round-trip (so we adjust lightness without shifting hue) ────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const to = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Comfortable contrast for a large, bold number against its surface.
const AMOUNT_TARGET = 3.2;
// "True clash" — colour and page are so close the fill barely reads.
const CLASH_BELOW = 1.8;

// Keep the hue; lighten (dark theme) or darken (light theme) until the amount
// reads clearly. No-op when the colour already has enough contrast.
export function adaptBrandColor(brand: string, surface: string, dark: boolean, target = AMOUNT_TARGET): string {
  if (contrastRatio(brand, surface) >= target) return brand;
  const [r, g, b] = hexToRgb(brand);
  const [h, s, l0] = rgbToHsl(r, g, b);
  const step = dark ? 0.04 : -0.04;
  let l = l0;
  for (let i = 0; i < 25; i++) {
    l = Math.max(0, Math.min(1, l + step));
    const hex = hslToHex(h, s, l);
    if (contrastRatio(hex, surface) >= target) return hex;
    if (l <= 0 || l >= 1) break;
  }
  return hslToHex(h, s, l);
}

// For System mode we evaluate the dark case — it's the harder one to get right.
function resolveDark(theme: "light" | "dark" | "system"): boolean {
  return theme === "dark" || theme === "system";
}

// True only on a genuine clash, so the hint stays rare and meaningful.
export function brandClashes(brand: string, theme: "light" | "dark" | "system"): boolean {
  const surface = resolveDark(theme) ? SURFACE.dark : SURFACE.light;
  return contrastRatio(brand, surface) < CLASH_BELOW;
}

// The "more visible shade" we offer — their colour, lightness-adjusted to be legible.
export function suggestedShade(brand: string, theme: "light" | "dark" | "system"): string {
  const dark = resolveDark(theme);
  const surface = dark ? SURFACE.dark : SURFACE.light;
  return adaptBrandColor(brand, surface, dark, 4.0); // push a little past the amount target so buttons read too
}
