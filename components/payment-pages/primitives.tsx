"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { C, radius, shadow } from "./tokens";

// ── Label ──────────────────────────────────────────────────────────────────────
export const Label = ({ children, required }: { children: ReactNode; required?: boolean }) => (
  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>
    {children}
    {required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
  </label>
);

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: radius.md,
  fontSize: 14,
  color: C.text,
  outline: "none",
  boxSizing: "border-box",
  background: C.white,
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

// ── Input ──────────────────────────────────────────────────────────────────────
export const Inp = ({
  label, value, onChange, placeholder, hint, type = "text", required, prefix, suffix, disabled,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; type?: string;
  required?: boolean; prefix?: string; suffix?: string; disabled?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <Label required={required}>{label}</Label>}
      <div style={{
        display: "flex", border: `1.5px solid ${focused ? C.blue : C.border}`,
        borderRadius: radius.md, overflow: "hidden", background: disabled ? C.bg : C.white,
        transition: "border-color 0.15s", boxShadow: focused ? `0 0 0 3px ${C.blueLight}` : "none",
      }}>
        {prefix && (
          <span style={{ padding: "9px 11px", background: C.bg, borderRight: `1.5px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.textMuted, flexShrink: 0, display: "flex", alignItems: "center" }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputBase, border: "none", flex: 1, borderRadius: 0, background: "transparent" }}
        />
        {suffix && (
          <span style={{ padding: "9px 11px", background: C.bg, borderLeft: `1.5px solid ${C.border}`, fontSize: 13, color: C.textMuted, flexShrink: 0, display: "flex", alignItems: "center" }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <p style={{ fontSize: 12, color: C.textFaint, margin: "4px 0 0", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
};

// ── Textarea ───────────────────────────────────────────────────────────────────
export const Textarea = ({
  label, value, onChange, placeholder, hint, required, rows = 3,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; required?: boolean; rows?: number;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <Label required={required}>{label}</Label>}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          ...inputBase, resize: "vertical",
          border: `1.5px solid ${focused ? C.blue : C.border}`,
          boxShadow: focused ? `0 0 0 3px ${C.blueLight}` : "none",
          lineHeight: 1.6,
        }}
      />
      {hint && <p style={{ fontSize: 12, color: C.textFaint, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
};

// ── Select ─────────────────────────────────────────────────────────────────────
export const Sel = ({
  label, value, onChange, options, hint, required,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string; required?: boolean;
}) => (
  <div style={{ marginBottom: 18 }}>
    {label && <Label required={required}>{label}</Label>}
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputBase, cursor: "pointer" }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {hint && <p style={{ fontSize: 12, color: C.textFaint, margin: "4px 0 0" }}>{hint}</p>}
  </div>
);

// ── Toggle ─────────────────────────────────────────────────────────────────────
export const Toggle = ({
  checked, onChange, label, desc,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) => (
  <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 14, padding: "12px 14px", background: C.white, border: `1.5px solid ${checked ? C.blueMid : C.border}`, borderRadius: radius.md, transition: "border-color 0.15s" }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 38, height: 22, borderRadius: 11, background: checked ? C.blue : "#d1d5db",
        flexShrink: 0, position: "relative", cursor: "pointer", transition: "background 0.2s", marginTop: 1,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 19 : 3,
        width: 16, height: 16, borderRadius: "50%", background: C.white,
        transition: "left 0.2s", boxShadow: shadow.sm,
      }} />
    </div>
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: 0 }}>{label}</p>
      {desc && <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0", lineHeight: 1.5 }}>{desc}</p>}
    </div>
  </label>
);

// ── Btn ────────────────────────────────────────────────────────────────────────
export const Btn = ({
  children, onClick, variant = "primary", size = "md", disabled, fullWidth,
}: {
  children: ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean; fullWidth?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const sizeMap = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "9px 20px", fontSize: 14 }, lg: { padding: "11px 26px", fontSize: 15 } };
  const variantMap = {
    primary: { background: hovered ? C.blueHover : C.blue, color: C.white, border: "none", boxShadow: hovered ? shadow.blue : "none" },
    secondary: { background: hovered ? C.blueLight : C.white, color: C.blue, border: `1.5px solid ${C.blueMid}` },
    ghost: { background: hovered ? C.bg : "transparent", color: C.textSecondary, border: `1.5px solid ${C.border}` },
    danger: { background: hovered ? "#b91c1c" : C.red, color: C.white, border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...sizeMap[size], ...variantMap[variant],
        borderRadius: radius.md, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s", fontFamily: "inherit",
        width: fullWidth ? "100%" : undefined, display: "inline-flex", alignItems: "center",
        justifyContent: "center", gap: 6,
      }}
    >
      {children}
    </button>
  );
};

// ── StatusBadge ────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string; dot: string }> = {
    Active: { bg: "#e6f9f0", color: C.green, dot: C.green },
    Inactive: { bg: C.redBg, color: C.red, dot: C.red },
    Draft: { bg: C.amberBg, color: C.amber, dot: C.amber },
    Expired: { bg: "#f3f4f6", color: C.textMuted, dot: C.textMuted },
    Success: { bg: "#e6f9f0", color: C.green, dot: C.green },
    Failed: { bg: C.redBg, color: C.red, dot: C.red },
    Refunded: { bg: C.amberBg, color: C.amber, dot: C.amber },
  };
  const s = cfg[status] ?? { bg: "#f3f4f6", color: C.textMuted, dot: C.textMuted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: radius.full, padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────────
export const Modal = ({
  title, subtitle, onClose, children, width = 560, noPad,
}: {
  title: string; subtitle?: string; onClose: () => void;
  children: ReactNode; width?: number; noPad?: boolean;
}) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: C.white, borderRadius: radius.xl, width: "100%", maxWidth: width, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, background: C.white }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.3 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 13, color: C.textMuted, margin: "3px 0 0" }}>{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          style={{ background: C.bg, border: "none", borderRadius: radius.sm, width: 30, height: 30, cursor: "pointer", fontSize: 13, color: C.textMuted, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 12 }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: noPad ? 0 : "22px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
    </div>
  </div>
);

// ── Drawer (slide-in panel from right) ────────────────────────────────────────
export const Drawer = ({
  title, subtitle, onClose, children, width = 480,
}: {
  title: string; subtitle?: string; onClose: () => void;
  children: ReactNode; width?: number;
}) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
    <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
    <div style={{ width, background: C.white, boxShadow: "-8px 0 40px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column", maxHeight: "100vh" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 13, color: C.textMuted, margin: "3px 0 0" }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: radius.sm, width: 30, height: 30, cursor: "pointer", fontSize: 13, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
    </div>
  </div>
);

// ── InfoBanner ─────────────────────────────────────────────────────────────────
export const InfoBanner = ({ type, children }: { type: "info" | "success" | "warning" | "error"; children: ReactNode }) => {
  const map = {
    info: { bg: C.blueLight, border: C.blueMid, color: C.blue },
    success: { bg: C.greenBg, border: C.greenMid, color: C.green },
    warning: { bg: C.amberBg, border: C.amberMid, color: C.amber },
    error: { bg: C.redBg, border: C.redMid, color: C.red },
  };
  const s = map[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: radius.md, padding: "10px 14px", marginBottom: 18 }}>
      <p style={{ fontSize: 13, color: s.color, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
};

// ── SectionCard ────────────────────────────────────────────────────────────────
export const SectionCard = ({ title, children }: { title?: string; children: ReactNode }) => (
  <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "18px 20px", marginBottom: 16 }}>
    {title && <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</p>}
    {children}
  </div>
);

// ── TypeCard ───────────────────────────────────────────────────────────────────
export const TypeCard = ({
  icon, title, tagline, desc, steps, selected, onClick,
}: {
  icon: ReactNode; title: string; tagline: string; desc: string;
  steps: string[]; selected?: boolean; onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${active ? C.blue : C.border}`, borderRadius: radius.xl,
        padding: "22px 20px", cursor: "pointer", background: active ? C.blueLight : C.white,
        transition: "all 0.15s", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: radius.md, background: active ? C.blue : C.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, transition: "background 0.15s" }}>
        <span style={{ fontSize: 22, filter: active ? "brightness(10)" : "none" }}>{icon}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: active ? C.blue : C.text, margin: "0 0 3px" }}>{title}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: active ? C.blue : C.textMuted, margin: "0 0 8px" }}>{tagline}</p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 14px", lineHeight: 1.6, flex: 1 }}>{desc}</p>
      <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 10 }}>{steps.length} steps · {steps.join(" → ")}</div>
      <span style={{ fontSize: 12, color: active ? C.blue : C.textMuted, fontWeight: 600 }}>Select →</span>
    </div>
  );
};

// ── ColorPicker ────────────────────────────────────────────────────────────────
export const ColorPicker = ({
  label, value, onChange,
}: { label?: string; value: string; onChange: (v: string) => void }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <Label>{label}</Label>}
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 44, height: 38, border: `1.5px solid ${C.border}`, borderRadius: radius.md, cursor: "pointer", padding: 3, background: C.white }}
      />
      <code style={{ fontSize: 12, color: C.textMuted, background: C.bg, padding: "5px 10px", borderRadius: radius.sm }}>{value}</code>
      <button
        onClick={() => onChange("#1c5af4")}
        style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.sm, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
      >
        Reset
      </button>
    </div>
  </div>
);

// ── SegmentedControl ───────────────────────────────────────────────────────────
export const SegmentedControl = ({
  options, value, onChange,
}: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: radius.md, padding: 3 }}>
    {options.map(o => (
      <button
        key={o.key} onClick={() => onChange(o.key)}
        style={{
          flex: 1, padding: "7px 12px", border: "none", borderRadius: radius.sm, fontSize: 13, fontWeight: 600,
          background: value === o.key ? C.white : "transparent",
          color: value === o.key ? C.text : C.textMuted,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: value === o.key ? shadow.sm : "none",
          transition: "all 0.15s",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ── useClickOutside ────────────────────────────────────────────────────────────
export const useClickOutside = (handler: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) handler(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [handler]);
  return ref;
};
