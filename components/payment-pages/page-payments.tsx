"use client";
import { useMemo, useState } from "react";
import { C, radius, shadow } from "./tokens";
import { StatusBadge } from "./primitives";
import { Icon } from "./icons";
import { PaymentPage, Submission, PAGE_SUBMISSIONS } from "./mock-data";
import { RecordDrawer, DrawerRecord } from "./record-drawer";

// ──────────────────────────────────────────────────────────────────────────────
// Global Payments view — every payment across every payment page, filterable by
// page. The Source column attributes each payment back to the page it came
// through (the page id is the attribution key), mirroring the QR Payments view
// so the two products read identically.
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

const customerName = (s: Submission) =>
  s.responses["Full Name"] || s.responses["Name"] || Object.values(s.responses)[0] || "—";

function submissionRecord(s: Submission, page: PaymentPage): DrawerRecord {
  const entries = Object.entries(s.responses);
  return {
    id: s.id,
    amount: s.amount,
    status: s.status,
    date: s.date,
    source: { kind: "page", name: page.title, ref: page.id },
    party: entries.slice(0, 2).map(([label, value]) => ({ label, value })),
    details: [{ label: "Date", value: s.date }, { label: "Page", value: page.title }],
    responses: entries.map(([label, value]) => ({ label, value })),
  };
}

const COLS = "1.3fr 1.6fr 1.3fr 0.9fr 0.9fr 1.1fr";

export function PagePaymentsPanel({ pages }: { pages: PaymentPage[] }) {
  const [pageFilter, setPageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed" | "Refunded">("All");
  const [record, setRecord] = useState<DrawerRecord | null>(null);

  const rows = useMemo(() =>
    pages.flatMap(p => (PAGE_SUBMISSIONS[p.id] ?? []).map(s => ({ s, page: p })))
      .filter(r => pageFilter === "all" || r.page.id === pageFilter)
      .filter(r => statusFilter === "All" || r.s.status === statusFilter),
    [pages, pageFilter, statusFilter]);

  const collected = rows.filter(r => r.s.status === "Success").reduce((sum, r) => sum + amt(r.s.amount), 0);
  const pagesWithSubs = pages.filter(p => (PAGE_SUBMISSIONS[p.id] ?? []).length > 0);

  const selStyle: React.CSSProperties = {
    padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md,
    fontSize: 13.5, fontFamily: "inherit", color: C.text, background: C.white, outline: "none", cursor: "pointer",
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.55 }}>
        Every payment across your payment pages. The Source column shows which page each payment came through.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={pageFilter} onChange={e => setPageFilter(e.target.value)} style={{ ...selStyle, minWidth: 240 }} aria-label="Filter by page">
          <option value="all">All pages</option>
          {pagesWithSubs.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
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
        <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
          {["Payment ID", "Source", "Customer", "Amount", "Status", "Date"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Amount" ? "right" : "left" }}>{h}</span>
          ))}
        </div>

        {rows.length === 0 && (
          <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: 18 }}>No payments match these filters.</p>
        )}

        {rows.map((r, i) => (
          <div key={r.s.id} onClick={() => setRecord(submissionRecord(r.s, r.page))}
            style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, alignItems: "center", padding: "12px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.s.id}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span style={{ color: C.blue, display: "inline-flex", flexShrink: 0 }}><Icon name="page" size={13} /></span>
              <span style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.page.title}</span>
              <span style={{ fontSize: 10.5, fontFamily: "monospace", color: C.textFaint, flexShrink: 0 }}>{r.page.id}</span>
            </span>
            <span style={{ color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerName(r.s)}</span>
            <span style={{ fontWeight: 700, color: C.text, textAlign: "right" }}>{r.s.amount}</span>
            <span><StatusBadge status={r.s.status} /></span>
            <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{r.s.date}</span>
          </div>
        ))}
      </div>

      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
