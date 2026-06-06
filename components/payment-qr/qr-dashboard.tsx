"use client";
import { useState, useEffect, useRef } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, QR_DASHBOARD_METRICS, QR_TRANSACTIONS } from "./qr-mock-data";

function Sparkline({ data, color }: { data: readonly number[]; color: string }) {
  const w = 96, h = 30, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - ((v - min) / (max - min || 1)) * h).toFixed(1)}`).join(" ");
  return <svg width={w} height={h} style={{ display: "block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Delta({ up, text }: { up: boolean; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 5 }}>
      <span style={{ background: up ? C.greenBg : C.redBg, color: up ? C.green : C.red, fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 5 }}>{up ? "▲" : "▼"} {text}</span>
      <span style={{ fontSize: 10.5, color: C.textFaint }}>vs last 7d avg</span>
    </span>
  );
}

function Card({ accent, label, children }: { accent: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, borderRadius: 11, padding: "13px 15px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textMuted, letterSpacing: ".05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>{label} <Icon name="help" size={12} color={C.textFaint} /></div>
      {children}
    </div>
  );
}

function Kebab({ qr, onView, onEdit, onToggleStatus, onDownload, onCopy, onDelete }: {
  qr: QrCode; onView: (q: QrCode) => void; onEdit: (q: QrCode) => void; onToggleStatus: (q: QrCode) => void;
  onDownload: (q: QrCode) => void; onCopy: (q: QrCode) => void; onDelete: (q: QrCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const item = (icon: any, label: string, fn: () => void, danger?: boolean) => (
    <div onClick={() => { setOpen(false); fn(); }}
      style={{ padding: "8px 11px", borderRadius: 6, display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: danger ? C.red : C.textSecondary, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? C.redBg : C.bg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Icon name={icon} size={15} color={danger ? C.red : C.textFaint} />{label}
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative", textAlign: "center" }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Actions"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4, lineHeight: 1 }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", top: 26, right: 0, zIndex: 20, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 10px 30px -8px rgba(20,30,60,.25)", width: 184, padding: 5, textAlign: "left" }}>
          {item("page", "View", () => onView(qr))}
          {item("edit", "Edit", () => onEdit(qr))}
          {qr.status !== "Draft" && qr.status !== "Expired" && item(qr.status === "Active" ? "pause" : "play", qr.status === "Active" ? "Deactivate" : "Activate", () => onToggleStatus(qr))}
          {item("download", "Download QR (PNG)", () => onDownload(qr))}
          {item("copy", "Copy UPI link", () => onCopy(qr))}
          <div style={{ height: 1, background: C.borderLight, margin: "4px 6px" }} />
          {item("trash", "Delete", () => onDelete(qr), true)}
        </div>
      )}
    </div>
  );
}

const COLS = "1.7fr 1.2fr .85fr .6fr .95fr .85fr .75fr 34px";

export function QrDashboard({ codes, onCreate, onView, onEdit, onToggleStatus, onDownload, onCopy, onDelete }: {
  codes: QrCode[]; onCreate: () => void;
  onView: (q: QrCode) => void; onEdit: (q: QrCode) => void; onToggleStatus: (q: QrCode) => void;
  onDownload: (q: QrCode) => void; onCopy: (q: QrCode) => void; onDelete: (q: QrCode) => void;
}) {
  const m = QR_DASHBOARD_METRICS;
  const [tab, setTab] = useState<"All" | "Active" | "Inactive" | "Draft" | "Expired">("All");
  const [q, setQ] = useState("");
  const count = (s: string) => codes.filter(c => c.status === s).length;
  const shown = codes.filter(c => (tab === "All" || c.status === tab) &&
    (q.trim() === "" || `${c.label} ${c.location} ${c.vpa}`.toLowerCase().includes(q.toLowerCase())));

  const tabs: ("All" | "Active" | "Inactive" | "Draft" | "Expired")[] = ["All", "Active", "Inactive", "Draft", "Expired"];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px", background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>Payment QR</h1>
          <p style={{ fontSize: 13.5, color: C.textMuted, margin: "4px 0 0" }}>Create scan-to-pay UPI codes for your counters, events and stalls.</p>
        </div>
        <Btn variant="primary" size="lg" onClick={onCreate}><Icon name="qr" size={16} color="#fff" /> Create QR</Btn>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <Card accent={C.blue} label="Total QR codes">
          <div style={{ fontSize: 27, fontWeight: 800, margin: "3px 0 8px", color: C.text }}>{m.totalCodes}</div>
          <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.7 }}>
            {([["Active", m.statusCounts.active, "#16a34a"], ["Draft", m.statusCounts.draft, "#d97706"], ["Inactive", m.statusCounts.inactive, "#9aa0ad"], ["Expired", m.statusCounts.expired, "#6b7280"]] as const).map(([k, v, col]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span><span style={{ color: col }}>●</span> {k}</span><b>{v}</b></div>
            ))}
          </div>
        </Card>
        <Card accent={C.blue} label="Total collected">
          <div style={{ fontSize: 27, fontWeight: 800, margin: "3px 0 6px", color: C.text }}>{m.totalCollected}</div>
          <Sparkline data={m.collectedTrend} color={C.blue} />
          <Delta up text="18%" />
        </Card>
        <Card accent={C.green} label="Successful payments">
          <div style={{ fontSize: 27, fontWeight: 800, margin: "3px 0 6px", color: C.text }}>{m.successfulPayments.toLocaleString("en-IN")}</div>
          <Sparkline data={m.collectedTrend} color={C.green} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ background: C.greenBg, color: C.green, fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 5 }}>{m.successRate}% success</span>
            <span style={{ fontSize: 10.5, color: C.textFaint }}>of all attempts</span>
          </span>
        </Card>
        <Card accent={C.red} label="Failed attempts">
          <div style={{ fontSize: 27, fontWeight: 800, margin: "3px 0 6px", color: C.text }}>{m.failedAttempts}</div>
          <Sparkline data={m.failedTrend} color={C.red} />
          <Delta up={false} text="4%" />
        </Card>
      </div>

      <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${C.border}`, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
        {tabs.map(t => {
          const n = t === "All" ? codes.length : count(t);
          const active = tab === t;
          return (
            <span key={t} onClick={() => setTab(t)} style={{ paddingBottom: 9, cursor: "pointer", borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent", color: active ? C.blue : C.textMuted }}>
              {t} <b style={{ color: active ? C.blue : C.textSecondary }}>{n}</b>
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px" }}>
          <Icon name="search" size={14} color={C.textFaint} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, location or UPI ID..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: "inherit", color: C.text, background: "none" }} />
        </div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 13px", fontSize: 12.5, color: C.textSecondary, display: "flex", alignItems: "center", gap: 6 }}><Icon name="download" size={14} /> Export</div>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 11, boxShadow: shadow.sm }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "11px 16px", background: C.bg, borderBottom: `1px solid ${C.border}`, borderRadius: "11px 11px 0 0", fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: ".04em" }}>
          <span>QR / LOCATION</span><span>UPI ID</span><span>AMOUNT</span><span>PAID</span><span>COLLECTED</span><span>STATUS</span><span>CREATED</span><span></span>
        </div>
        {shown.map((c, idx) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "12px 16px", borderBottom: idx < shown.length - 1 ? `1px solid ${C.borderLight}` : "none", alignItems: "center", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <span style={{ width: 30, height: 30, borderRadius: 7, background: c.brandColor, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="qr" size={15} color="#fff" /></span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.text }}>{c.label}</b>
                <span style={{ fontSize: 10.5, color: C.textFaint }}>{c.location}</span>
              </span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10.5, color: C.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.vpa}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{c.amount}</span>
            <span style={{ color: C.textSecondary }}>{c.payments.toLocaleString("en-IN")}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{c.revenue}</span>
            <span><StatusBadge status={c.status} /></span>
            <span style={{ fontSize: 10.5, color: C.textFaint }}>{c.created.split(",")[0]}</span>
            <Kebab qr={c} onView={onView} onEdit={onEdit} onToggleStatus={onToggleStatus} onDownload={onDownload} onCopy={onCopy} onDelete={onDelete} />
          </div>
        ))}
        {shown.length === 0 && <div style={{ padding: "40px 16px", textAlign: "center", color: C.textFaint, fontSize: 13.5 }}>No QR codes here yet.</div>}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "26px 0 10px" }}>Recent payments</p>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 11, overflow: "hidden" }}>
        {QR_TRANSACTIONS.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < QR_TRANSACTIONS.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary }}>{t.payerVpa}</span>
              <span style={{ fontSize: 11, color: C.textFaint }}>UTR {t.utr}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontWeight: 700, color: C.text }}>{t.amount}</span>
              <StatusBadge status={t.status} />
              <span style={{ fontSize: 12, color: C.textFaint }}>{t.time}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
