"use client";
import { C, radius, shadow } from "./tokens";

const NAV_ITEMS = [
  { key: "analytics", icon: "📊", label: "Analytics" },
  { key: "transactions", icon: "💳", label: "Transactions" },
  { key: "orders", icon: "📦", label: "Orders" },
  { key: "refunds", icon: "↩", label: "Refunds" },
  { key: "settlements", icon: "🏦", label: "Settlements" },
];

const PAYMENT_ITEMS = [
  { key: "payment-buttons", icon: "🔘", label: "Payment Buttons" },
  { key: "payment-pages", icon: "📄", label: "Payment Pages" },
  { key: "payment-links", icon: "🔗", label: "Payment Links" },
];

export function AppSidebar({ active }: { active: string }) {
  return (
    <div style={{ width: 216, background: C.white, borderRight: `1px solid ${C.border}`, padding: "16px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
      {/* Section header */}
      <p style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px", padding: "0 16px" }}>Overview</p>
      {NAV_ITEMS.map(item => (
        <div key={item.key} style={{ margin: "1px 8px" }}>
          <div style={{ padding: "8px 10px", borderRadius: radius.md, color: C.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, transition: "background 0.1s" }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: C.border, margin: "10px 16px" }} />

      <p style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px", padding: "0 16px" }}>Products</p>
      {PAYMENT_ITEMS.map(item => {
        const isActive = item.key === active;
        return (
          <div key={item.key} style={{ margin: "1px 8px" }}>
            <div style={{
              padding: "8px 10px", borderRadius: radius.md, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 9, transition: "all 0.1s",
              background: isActive ? C.blueLight : "transparent",
              color: isActive ? C.blue : C.textMuted,
              fontWeight: isActive ? 700 : 400,
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.bg; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
              {isActive && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.blue, flexShrink: 0 }} />}
            </div>
          </div>
        );
      })}

      <div style={{ height: 1, background: C.border, margin: "10px 16px" }} />

      <div style={{ margin: "1px 8px" }}>
        <div style={{ padding: "8px 10px", borderRadius: radius.md, color: C.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}
          onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <span style={{ fontSize: 15 }}>⚙</span> Configuration
        </div>
      </div>
    </div>
  );
}

export function TopNav() {
  return (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: shadow.sm }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: C.blue, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>E</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>
          En<span style={{ color: C.blue }}>Kash</span>
        </span>
        <span style={{ width: 1, height: 20, background: C.border, margin: "0 6px" }} />
        <span style={{ fontSize: 12, color: C.textFaint, fontWeight: 500 }}>Product Gateway</span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Notification bell */}
        <div style={{ width: 34, height: 34, borderRadius: radius.md, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
          onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.red, border: `2px solid ${C.white}` }} />
        </div>
        {/* Help */}
        <div style={{ width: 34, height: 34, borderRadius: radius.md, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: C.textMuted, fontWeight: 700 }}
          onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
          ?
        </div>
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", border: `1.5px solid ${C.border}`, borderRadius: radius.full, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, background: C.blueLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.blue }}>CA</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Company Admin</span>
          <span style={{ fontSize: 10, color: C.textFaint }}>▼</span>
        </div>
      </div>
    </div>
  );
}
