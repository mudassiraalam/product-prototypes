"use client";
import { useState } from "react";
import { C, radius, shadow } from "../payment-pages/tokens";
import { TopNav, AppSidebar } from "../payment-pages/layout";
import { StatusBadge } from "../payment-pages/primitives";
import { EmptyTab } from "../payment-pages/page-detail";
import { SUBSCRIBERS, PLANS, CHARGES } from "./mock-data";
import { SubscriberDetail } from "./subscriber-detail";
import type { Subscriber, SubscriberStatus } from "./types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all",       label: "All statuses" },
  { value: "active",    label: "Active" },
  { value: "paused",    label: "Paused" },
  { value: "pending",   label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

function SourcePill({ kind }: { kind: "page" | "button" }) {
  const isButton = kind === "button";
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: radius.full,
      background: isButton ? "#f3f0ff" : C.blueLight,
      color: isButton ? "#7c3aed" : C.blueDark,
      marginRight: 6, flexShrink: 0,
    }}>
      {isButton ? "Button" : "Page"}
    </span>
  );
}

function SubscribersList({ onOpen }: { onOpen: (s: Subscriber) => void }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = SUBSCRIBERS.filter(s =>
    statusFilter === "all" || s.status === statusFilter
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 2px", letterSpacing: "-0.01em" }}>All Subscribers</h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
            Every active subscription across Payment Pages and Payment Buttons
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "8px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 13, fontFamily: "inherit", outline: "none", background: C.white, color: C.textSecondary, cursor: "pointer" }}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyTab
          icon="subscriptions"
          title="No subscribers match"
          body="Try a different status filter, or subscribers will appear here once customers sign up."
        />
      ) : (
        <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Subscriber", "Source", "Plan", "Frequency", "Status", "Started"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const plan = PLANS.find(p => p.id === sub.planId);
                  const capStatus = (sub.status.charAt(0).toUpperCase() + sub.status.slice(1)) as string;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => onOpen(sub)}
                      style={{ borderTop: `1px solid ${C.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, margin: "0 0 2px" }}>{sub.name}</p>
                        <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{sub.email}</p>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                          <SourcePill kind={sub.source.kind} />
                          <span style={{ fontSize: 12, color: C.textSecondary }}>{sub.source.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: C.textSecondary }}>{plan?.name ?? "—"}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted, textTransform: "capitalize" }}>{plan?.frequency ?? "—"}</td>
                      <td style={{ padding: "13px 16px" }}><StatusBadge status={capStatus} /></td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{sub.startDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.borderLight}` }}>
            <span style={{ fontSize: 12, color: C.textFaint }}>
              {filtered.length} of {SUBSCRIBERS.length} subscriber{SUBSCRIBERS.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubscriptionsApp({ onNavigateProduct }: { onNavigateProduct: (key: string) => void }) {
  const [selected, setSelected] = useState<Subscriber | null>(null);

  const onNav = (key: string) => { if (key !== "subscriptions") onNavigateProduct(key); };

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopNav
        onHome={() => { setSelected(null); onNavigateProduct("payment-pages"); }}
        breadcrumb={
          selected
            ? [{ label: "Home", icon: "home" }, { label: "Subscriptions" }, { label: selected.name }]
            : [{ label: "Home", icon: "home" }, { label: "Subscriptions" }]
        }
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AppSidebar active="subscriptions" onNavigate={onNav} />

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selected ? (
            <SubscriberDetail
              subscriber={selected}
              plan={PLANS.find(p => p.id === selected.planId)}
              charges={CHARGES[selected.id] ?? []}
              onBack={() => setSelected(null)}
            />
          ) : (
            <SubscribersList onOpen={setSelected} />
          )}
        </div>
      </div>
    </div>
  );
}
