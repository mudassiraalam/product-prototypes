"use client";
import React from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Inline-SVG icon set. Replaces the cross-device-unreliable emoji/symbol glyphs
// (🗔 ▤ ▢ 🖥 🛍 🎟 ⛔ 𝕏 …) that render as empty boxes on some OS/browsers.
// SVGs render identically everywhere. Small functional arrows (← → › ▲ ▼) are
// deliberately left as text glyphs elsewhere — those are reliable cross-device.
//
// Line icons inherit `currentColor`; brand glyphs (whatsapp/facebook/x) are
// filled. Set the colour on the icon (or a wrapping element) via `color`.
// ──────────────────────────────────────────────────────────────────────────────

export type IconName =
  // chrome / nav
  | "gateway" | "link" | "page" | "summary" | "settings" | "ledger" | "settlements" | "bell" | "home"
  // dashboard / page categories
  | "invoice" | "donation" | "ticket" | "bag" | "coins" | "card" | "receipt" | "handshake"
  // controls
  | "search" | "download" | "copy" | "archive" | "ban" | "checkCircle" | "refresh" | "expand" | "redirect" | "qr"
  | "monitor" | "smartphone"
  // preview info / contact
  | "lock" | "calendar" | "mapPin" | "mail" | "phone" | "clock" | "user" | "globe" | "eye" | "bulb"
  // brand / social
  | "whatsapp" | "facebook" | "x";

const STROKE: IconName[] = [
  "gateway", "link", "page", "summary", "settings", "ledger", "settlements", "bell", "home",
  "invoice", "donation", "ticket", "bag", "coins", "card", "receipt", "handshake",
  "search", "download", "copy", "archive", "ban", "checkCircle", "refresh", "expand", "redirect", "qr",
  "monitor", "smartphone", "lock", "calendar", "mapPin", "mail", "phone", "clock", "user", "globe", "eye", "bulb",
];

// Path/children for each icon, drawn on a 24×24 grid.
const PATHS: Record<IconName, React.ReactNode> = {
  gateway: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v16" /></>),
  link: (<><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>),
  page: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  summary: (<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4z" /></>),
  ledger: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  settlements: (<><path d="M6 4h12M6 8h12M9 8c5 0 5 7 0 7H6l7 5" /></>),
  bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>),
  home: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),

  invoice: (<><path d="M5 3h11l3 3v15H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  donation: (<><path d="M19 5.5c-1.7-1.8-4.5-1.8-6.3 0L12 6.3l-.7-.8C9.5 3.7 6.7 3.7 5 5.5 3.2 7.3 3.2 10 5 11.9l7 7 7-7c1.8-1.9 1.8-4.6 0-6.4z" /></>),
  ticket: (<><path d="M3 9a2 2 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" /><path d="M14 5v14" /></>),
  bag: (<><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
  coins: (<><circle cx="9" cy="9" r="5" /><path d="M16.7 5.3a5 5 0 0 1 0 13.4M8 19a5 5 0 0 0 8-4" /></>),
  card: (<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>),
  receipt: (<><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z" /><path d="M9 8h6M9 12h6" /></>),
  handshake: (<><path d="M11 17l-3 3-4-4 5-5 3 2 3-2 5 5-4 4-3-3" /><path d="M8 11l3-3 3 3" /></>),

  search: (<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  download: (<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 21h16" /></>),
  copy: (<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
  archive: (<><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M9 13h6" /></>),
  ban: (<><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>),
  expand: (<><path d="M9 3H3v6M15 21h6v-6M21 3l-7 7M3 21l7-7" /></>),
  redirect: (<><path d="M15 14l5-5-5-5" /><path d="M20 9H9a5 5 0 0 0-5 5v5" /></>),
  qr: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" /></>),
  monitor: (<><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>),
  smartphone: (<><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>),

  lock: (<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>),
  mapPin: (<><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  phone: (<><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>),
  eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></>),

  // Brand glyphs (filled).
  whatsapp: (<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.6 4.7-1.2A10 10 0 1 0 12 2zm5.5 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4 0 .5l-.4.5c-.2.2-.3.4-.1.6.2.3.8 1.3 1.7 2 .9.6 1.3.8 1.6.9.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6-.1 1.1z" />),
  facebook: (<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />),
  x: (<path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.9H5.2z" />),
};

export function Icon({
  name, size = 16, color, strokeWidth = 2, style,
}: {
  name: IconName; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties;
}) {
  const isStroke = STROKE.includes(name);
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} aria-hidden
      style={{ display: "inline-block", flexShrink: 0, color, verticalAlign: "middle", ...style }}
      fill={isStroke ? "none" : "currentColor"}
      stroke={isStroke ? "currentColor" : "none"}
      strokeWidth={isStroke ? strokeWidth : undefined}
      strokeLinecap="round" strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// EnKash logo. `wordmark` = full "EnKash" lockup (for the admin header, always on
// a light surface). `mark` = the standalone ribbon glyph (for compact trust marks
// like "Powered by"; seated on a white chip by the caller so it's theme-safe).
// ──────────────────────────────────────────────────────────────────────────────
export function EnkashLogo({
  variant = "wordmark", height = 24, style,
}: {
  variant?: "wordmark" | "mark"; height?: number; style?: React.CSSProperties;
}) {
  const src = variant === "wordmark" ? "/enkash-wordmark.png" : "/enkash-mark.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="EnKash" style={{ height, width: "auto", display: "block", objectFit: "contain", ...style }} />
  );
}
