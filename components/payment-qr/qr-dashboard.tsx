"use client";
import { useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, QR_DASHBOARD_METRICS, QR_TRANSACTIONS } from "./qr-mock-data";

function Sparkline({ data, color }: { data: readonly number[]; color: string }) {
  const w = 90, h = 28, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Metric({ label, value, sub, children }: { label: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "16px 18px", flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11.5, fontWeight: 600, color: C.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0" }}>{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function QrDashboard({ codes, onCreate, onView }: {
  codes: QrCode[]; onCreate: () => void; onView: (qr: QrCode) => void;
}) {
  const m = QR_DASHBOARD_METRICS;
  const [filter, setFilter] = useState<"All" | "Active" | "Draft">("All");
  const shown = codes.filter(c => filter === "All" ? true : c.status === filter);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px", background: C.bg }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>Payment QR</h1>
          <p style={{ fontSize: 13.5, color: C.textMuted, margin: "4px 0 0" }}>Create scan-to-pay UPI codes for your counters, events and stalls.</p>
        </div>
        <Btn variant="primary" size="lg" onClick={onCreate}><Icon name="qr" size={16} color="#fff" /> Create QR</Btn>
      </div>

      {/* metrics */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <Metric label="Total scans" value={m.totalScans.toLocaleString("en-IN")} sub="last 7 days trending up">
          <Sparkline data={m.scansTrend} color={C.blue} />
        </Metric>
        <Metric label="Collections" value={m.totalCollections.toLocaleString("en-IN")} sub="successful payments" />
        <Metric label="Scan → Pay" value={`${m.conversionPct}%`} sub="conversion" />
        <Metric label="Method" value="100% UPI" sub="by design" />
      </div>

      {/* filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["All", "Active", "Draft"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: radius.full, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: `1.5px solid ${filter === f ? C.blue : C.border}`, background: filter === f ? C.blueLight : C.white, color: filter === f ? C.blue : C.textMuted }}>
            {f}
          </button>
        ))}
      </div>

      {/* table */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 0.9fr 0.9fr 1fr 0.7fr", gap: 12, padding: "12px 18px", background: C.bg, borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>QR / Location</span><span>UPI ID</span><span>Amount</span><span>Scans</span><span>Paid</span><span>Status</span><span></span>
        </div>
        {shown.map(c => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 0.9fr 0.9fr 1fr 0.7fr", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`, alignItems: "center", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: c.brandColor, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="qr" size={17} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</p>
                <p style={{ fontSize: 11.5, color: C.textFaint, margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.location}</p>
              </div>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.vpa}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{c.amount}</span>
            <span style={{ color: C.textSecondary }}>{c.scans.toLocaleString("en-IN")}</span>
            <span style={{ color: C.textSecondary }}>{c.collections.toLocaleString("en-IN")}</span>
            <span><StatusBadge status={c.status} /></span>
            <span style={{ textAlign: "right" }}>
              <button onClick={() => onView(c)} style={{ fontSize: 12.5, fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {c.status === "Draft" ? "Resume" : "View"}
              </button>
            </span>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{ padding: "40px 18px", textAlign: "center", color: C.textFaint, fontSize: 13.5 }}>No QR codes here yet.</div>
        )}
      </div>

      {/* recent payments preview */}
      <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "26px 0 10px" }}>Recent payments</p>
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
        {QR_TRANSACTIONS.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < QR_TRANSACTIONS.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: C.textFaint, background: C.bg, padding: "2px 8px", borderRadius: radius.sm }}>{t.app}</span>
              <span style={{ color: C.textSecondary }}>{t.customer}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontWeight: 700, color: C.text }}>{t.amount}</span>
              <StatusBadge status={t.status} />
              <span style={{ fontSize: 12, color: C.textFaint }}>{t.date}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
