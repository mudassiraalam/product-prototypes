"use client";
import { ReactNode } from "react";
import { C, radius, shadow } from "./tokens";
import { Icon, IconName, EnkashLogo } from "./icons";

// ──────────────────────────────────────────────────────────────────────────────
// Left nav — exact replica of the production gateway dashboard (image 1):
// "Payment Gateway" as the top active item, then SETTLEMENT OVERVIEW, PAYMENT
// PRODUCTS and SETTINGS groups with their literal items. The ONLY addition is
// "Payment Pages" inserted directly under "Payment Links".
// ──────────────────────────────────────────────────────────────────────────────
type NavItem = { key: string; icon: IconName; label: string };
const NAV_TOP: NavItem = { key: "payment-gateway", icon: "gateway", label: "Payment Gateway" };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Settlement Overview",
    items: [
      { key: "settlements", icon: "settlements", label: "Settlements" },
      { key: "summary", icon: "summary", label: "Summary" },
    ],
  },
  {
    label: "Payment Products",
    items: [
      { key: "payment-links", icon: "link", label: "Payment Links" },
      { key: "payment-pages", icon: "page", label: "Payment Pages" },
      { key: "payment-qr", icon: "qr", label: "Payment QR" },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "configuration", icon: "settings", label: "Configuration" },
      { key: "account-ledger", icon: "ledger", label: "Account Ledger" },
    ],
  },
];

function NavRow({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: (key: string) => void }) {
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
        onClick={() => onNavigate?.(item.key)}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bg; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
        <span style={{ width: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={item.icon} size={17} /></span>
        {item.label}
      </div>
    </div>
  );
}

export function AppSidebar({ active, onNavigate }: { active: string; onNavigate?: (key: string) => void }) {
  // In image 1 the top "Payment Gateway" item is the active (blue) one. Here the
  // prototype's active screen is Payment Pages, so we light that one instead —
  // but the structure (top item, then the three labelled groups) is identical.
  return (
    <div style={{ width: 232, background: C.white, borderRight: `1px solid ${C.border}`, padding: "16px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
      {/* Top product item */}
      <NavRow item={NAV_TOP} active={NAV_TOP.key === active} onNavigate={onNavigate} />

      {NAV_GROUPS.map(group => (
        <div key={group.label}>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", margin: "16px 0 6px", padding: "0 20px" }}>{group.label}</p>
          {group.items.map(item => (
            <NavRow key={item.key} item={item} active={item.key === active} onNavigate={onNavigate} />
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
              {c.icon && <Icon name={c.icon as IconName} size={14} />}
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
          style={{ display: "flex", alignItems: "center", cursor: onHome ? "pointer" : "default" }}
        >
          <EnkashLogo variant="wordmark" height={26} />
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
        <HeaderIconBtn dot><Icon name="bell" size={18} /></HeaderIconBtn>
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
