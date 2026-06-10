"use client";
import { useMemo, useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, QR_TRANSACTIONS } from "./qr-mock-data";

// ──────────────────────────────────────────────────────────────────────────────
// Global Payments view — every payment across every QR, filterable by QR.
// All codes share one settlement VPA; the QR column works because each payment
// carries the scanned QR's unique reference back through UPI.
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

export function QrPaymentsPanel({ codes }: { codes: QrCode[] }) {
  const [qrFilter, setQrFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed">("All");

  const byId = useMemo(() => new Map(codes.map(c => [c.id, c])), [codes]);
  const sharedVpa = codes[0]?.vpa ?? "";

  const rows = QR_TRANSACTIONS
    .filter(t => qrFilter === "all" || t.qrId === qrFilter)
    .filter(t => statusFilter === "All" || t.status === statusFilter);

  const okRows = rows.filter(t => t.status === "Success");
  const collected = okRows.reduce((s, t) => s + amt(t.amount), 0);

  const selStyle: React.CSSProperties = {
    padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md,
    fontSize: 13.5, fontFamily: "inherit", color: C.text, background: C.white, outline: "none", cursor: "pointer",
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.55 }}>
        All payments across your QR codes. Every code settles to{" "}
        <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{sharedVpa}</span> — the QR column shows which code each
        payment came through, matched by that QR's unique reference.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={qrFilter} onChange={e => setQrFilter(e.target.value)} style={{ ...selStyle, minWidth: 220 }} aria-label="Filter by QR">
          <option value="all">All QRs</option>
          {codes.map(c => (
            <option key={c.id} value={c.id}>
              {c.label} · {c.usage === "onetime" ? "dynamic" : "static"}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={selStyle} aria-label="Filter by status">
          <option value="All">All statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <SummaryChip label="Payments shown" value={rows.length.toString()} />
        <SummaryChip label="Collected (successful)" value={inr(collected)} />
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.4fr 1.2fr 0.8fr 0.8fr 1.1fr", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
          {["UTR", "QR", "Payer", "Amount", "Status", "Date"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Amount" ? "right" : "left" }}>{h}</span>
          ))}
        </div>

        {rows.length === 0 && (
          <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: 18 }}>No payments match these filters.</p>
        )}

        {rows.map((t, i) => {
          const qr = byId.get(t.qrId);
          const dynamic = qr?.usage === "onetime";
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.4fr 1.2fr 0.8fr 0.8fr 1.1fr", gap: 12, alignItems: "center", padding: "12px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.utr}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{qr?.label ?? t.qrId}</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: dynamic ? C.blue : C.textMuted, border: `1px solid ${dynamic ? C.blueMid : C.border}`, borderRadius: 5, padding: "1px 6px", flexShrink: 0 }}>
                  {dynamic ? "dynamic" : "static"}
                </span>
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.payerVpa}</span>
              <span style={{ fontWeight: 700, color: C.text, textAlign: "right" }}>{t.amount}</span>
              <span><StatusBadge status={t.status} /></span>
              <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>{t.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
