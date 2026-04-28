// EnKash design tokens — single source of truth for inline styles
export const C = {
  blue: "#1c5af4",
  blueHover: "#1549d4",
  blueLight: "#eaf0fe",
  blueMid: "#c7d7fc",
  blueDark: "#1240b8",

  green: "#16a34a",
  greenBg: "#e6f9f0",
  greenMid: "#bbf7d0",

  amber: "#ca8a04",
  amberBg: "#fffbeb",
  amberMid: "#fde68a",

  red: "#dc2626",
  redBg: "#fef2f2",
  redMid: "#fecaca",

  // Neutrals
  white: "#ffffff",
  bg: "#f4f6fb",
  surface: "#ffffff",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",

  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",

  // Navy / dark
  navy: "#0f172a",
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadow = {
  sm: "0 1px 4px rgba(0,0,0,0.06)",
  md: "0 4px 14px rgba(0,0,0,0.08)",
  lg: "0 8px 28px rgba(0,0,0,0.12)",
  blue: `0 4px 14px rgba(28,90,244,0.28)`,
} as const;
