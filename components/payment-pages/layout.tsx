"use client";
import { ReactNode } from "react";
import { C, radius, shadow } from "./tokens";

// ──────────────────────────────────────────────────────────────────────────────
// Left nav — exact replica of the production gateway dashboard (image 1):
// "Payment Gateway" as the top active item, then SETTLEMENT OVERVIEW, PAYMENT
// PRODUCTS and SETTINGS groups with their literal items. The ONLY addition is
// "Payment Pages" inserted directly under "Payment Links".
// ──────────────────────────────────────────────────────────────────────────────
const NAV_TOP = { key: "payment-gateway", icon: "🗔", label: "Payment Gateway" };

const NAV_GROUPS: { label: string; items: { key: string; icon: string; label: string }[] }[] = [
  {
    label: "Settlement Overview",
    items: [
      { key: "settlements", icon: "$", label: "Settlements" },
      { key: "summary", icon: "▤", label: "Summary" },
    ],
  },
  {
    label: "Payment Products",
    items: [
      { key: "payment-links", icon: "🔗", label: "Payment Links" },
      { key: "payment-pages", icon: "📄", label: "Payment Pages" },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "configuration", icon: "⚙", label: "Configuration" },
      { key: "account-ledger", icon: "▢", label: "Account Ledger" },
    ],
  },
];

function NavRow({ item, active }: { item: { key: string; icon: string; label: string }; active: boolean }) {
  return (
    <div style={{ position: "relative", margin: "1px 10px" }}>
      {/* Solid left accent bar on the active item (matches image 1) */}
      {active && (
        <span style={{ position: "absolute", left: -10, top: 4, bottom: 4, width: 3, borderRadius: "0 3px 3px 0", background: C.blue }} />
      )}
      <div style={{
        padding: "9px 11px", borderRadius: radius.md, fontSize: 13.5, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 10, transition: "all 0.1s",
        background: active ? C.blueLight : "transparent",
        color: active ? C.blue : C.textSecondary,
        fontWeight: active ? 700 : 500,
      }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bg; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
        <span style={{ fontSize: 16, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </div>
    </div>
  );
}

export function AppSidebar({ active }: { active: string }) {
  // In image 1 the top "Payment Gateway" item is the active (blue) one. Here the
  // prototype's active screen is Payment Pages, so we light that one instead —
  // but the structure (top item, then the three labelled groups) is identical.
  return (
    <div style={{ width: 232, background: C.white, borderRight: `1px solid ${C.border}`, padding: "16px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
      {/* Top product item */}
      <NavRow item={NAV_TOP} active={NAV_TOP.key === active} />

      {NAV_GROUPS.map(group => (
        <div key={group.label}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", margin: "16px 0 6px", padding: "0 20px" }}>{group.label}</p>
          {group.items.map(item => (
            <NavRow key={item.key} item={item} active={item.key === active} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Breadcrumb — rendered INSIDE the global header (image 1 places the breadcrumb
// trail in the top bar, not in the page body). Accepts a simple trail array.
// ──────────────────────────────────────────────────────────────────────────────
export type Crumb = { label: string; icon?: string };

function HeaderBreadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      {trail.map((c, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: isLast ? C.text : C.textMuted, fontWeight: isLast ? 600 : 500, cursor: isLast ? "default" : "pointer" }}>
              {c.icon && <span style={{ fontSize: 14 }}>{c.icon}</span>}
              {c.label}
            </span>
            {!isLast && <span style={{ color: C.textFaint }}>/</span>}
          </span>
        );
      })}
    </div>
  );
}

function HeaderIconBtn({ children, dot }: { children: ReactNode; dot?: boolean }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: C.textMuted, transition: "background 0.1s" }}
      onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {children}
      {dot && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: C.red, border: `2px solid ${C.white}` }} />}
    </div>
  );
}

export function TopNav({ breadcrumb, onHome }: { breadcrumb?: Crumb[]; onHome?: () => void }) {
  return (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: shadow.sm }}>
      {/* Left: logo + (optional) breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          onClick={onHome}
          role={onHome ? "button" : undefined}
          title={onHome ? "Go to dashboard" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: onHome ? "pointer" : "default" }}
        >
          <div style={{ width: 32, height: 32, background: C.blue, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>E</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>
            En<span style={{ color: C.blue }}>Kash</span>
          </span>
        </div>
        {breadcrumb && breadcrumb.length > 0 && (
          <>
            <span style={{ width: 1, height: 22, background: C.border }} />
            <HeaderBreadcrumb trail={breadcrumb} />
          </>
        )}
      </div>

      {/* Right: help, notifications, app-switcher, user block (image 1 set) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HeaderIconBtn><span style={{ fontSize: 17, fontWeight: 700 }}>?</span></HeaderIconBtn>
        <HeaderIconBtn dot><span style={{ fontSize: 17 }}>🔔</span></HeaderIconBtn>
        {/* App-switcher grid */}
        <HeaderIconBtn>
          <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 4px)", gap: 2.5 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} style={{ width: 4, height: 4, borderRadius: 1, background: C.textMuted }} />
            ))}
          </span>
        </HeaderIconBtn>
        <span style={{ width: 1, height: 28, background: C.border, margin: "0 8px" }} />
        {/* User block — name over role (image 1 layout) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ textAlign: "right", lineHeight: 1.2 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: 0 }}>Alam</p>
            <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0 }}>Company Admin</p>
          </div>
          <div style={{ width: 36, height: 36, background: C.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.white }}>A</div>
        </div>
      </div>
    </div>
  );
}
