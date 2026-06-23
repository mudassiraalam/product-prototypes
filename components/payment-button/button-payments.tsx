"use client";
import { useMemo, useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { StatusBadge } from "@/components/payment-pages/primitives";
import { PaymentButton, BUTTON_TRANSACTIONS } from "./button-mock-data";
import { RecordDrawer, DrawerRecord } from "@/components/payment-pages/record-drawer";

// ──────────────────────────────────────────────────────────────────────────────
// Global Payments view — every payment across every button, filterable by button.
// Each payment carries the clicked button's unique reference, so the Button
// column resolves even though all buttons share one PG settlement account.
// ──────────────────────────────────────────────────────────────────────────────

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, padding: "14px 16px", flex: 1, minWidth: 150 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{value}</p>
    </div>
  );
}

const amt = (s: string) => parseFloat(s.replace(/[₹,]/g, "")) || 0;
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function ButtonPaymentsPanel({ buttons }: { buttons: PaymentButton[] }) {
  const [buttonFilter, setButtonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed" | "Refunded">("All");

  const byId = useMemo(() => new Map(buttons.map(b => [b.id, b])), [buttons]);
  const [record, setRecord] = useState<DrawerRecord | null>(null);

  const toRecord = (t: (typeof BUTTON_TRANSACTIONS)[number], b: PaymentButton | undefined): DrawerRecord => ({
    id: t.payId,
    amount: t.amount,
    status: t.status,
    date: t.time,
    source: { kind: "button", name: b?.title ?? t.buttonId, ref: b?.reference ?? t.buttonId },
    party: [{ label: "Customer", value: t.customer }],
    details: [{ label: "Payment ID", value: t.payId }, { label: "Method", value: t.method }, { label: "Time", value: t.time }],
  });

  const rows = BUTTON_TRANSACTIONS
    .filter(t => buttonFilter === "all" || t.buttonId === buttonFilter)
    .filter(t => statusFilter === "All" || t.status === statusFilter);

  const collected = rows.filter(t => t.status === "Success").reduce((s, t) => s + amt(t.amount), 0);

  const selStyle: React.CSSProperties = {
    padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md,
    fontSize: 13.5, fontFamily: "inherit", color: C.text, background: C.white, outline: "none", cursor: "pointer",
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.55 }}>
        All payments across your buttons. Each one settles to your PG settlement account
        (<span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{require("./button-mock-data").SETTLEMENT_ACCOUNT}</span>) — the Button column shows which button each payment came through, matched by its unique reference.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={buttonFilter} onChange={e => setButtonFilter(e.target.value)} style={{ ...selStyle, minWidth: 220 }} aria-label="Filter by button">
          <option value="all">All buttons</option>
          {buttons.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={selStyle} aria-label="Filter by status">
          <option value="All">All statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <SummaryChip label="Payments shown" value={rows.length.toString()} />
        <SummaryChip label="Collected (successful)" value={inr(collected)} />
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.4fr 1.3fr 0.9fr 0.8fr 0.9fr 1.1fr", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
          {["Payment ID", "Button", "Customer", "Method", "Amount", "Status", "Date"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Amount" ? "right" : "left" }}>{h}</span>
          ))}
        </div>

        {rows.length === 0 && (
          <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: 18 }}>No payments match these filters.</p>
        )}

        {rows.map((t, i) => {
          const b = byId.get(t.buttonId);
          return (
            <div key={t.id} onClick={() => setRecord(toRecord(t, b))} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.4fr 1.3fr 0.9fr 0.8fr 0.9fr 1.1fr", gap: 12, alignItems: "center", padding: "12px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.payId}</span>
              <span style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b?.title ?? t.buttonId}</span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.customer}</span>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>{t.method}</span>
              <span style={{ fontWeight: 700, color: C.text, textAlign: "right" }}>{t.amount}</span>
              <span><StatusBadge status={t.status} /></span>
              <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{t.time}</span>
            </div>
          );
        })}
      </div>

      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
