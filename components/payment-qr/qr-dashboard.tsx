"use client";
import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { StatusBadge, Btn, useClickOutside } from "@/components/payment-pages/primitives";
import { Icon } from "@/components/payment-pages/icons";
import { QrCode, QrStatus, QR_DASHBOARD_METRICS } from "./qr-mock-data";
import { QrPaymentsPanel } from "./qr-payments";

// ── Sparkline — identical to the Pages card: point-to-point line with a soft
//    area fill, kept in a gentle centred band so it never stretches harshly. ──
function Sparkline({ data, stroke, fill }: { data: readonly number[]; stroke: string; fill: string }) {
  const W = 240, H = 44, pad = 5;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (W - pad * 2) / (data.length - 1);
  const amp = 0.5;
  const usable = (H - pad * 2) * amp;
  const top = pad + ((H - pad * 2) - usable) / 2;
  const pts = data.map((v, i) => [pad + i * stepX, top + usable * (1 - (v - min) / span)] as [number, number]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block" }}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Delta chip — `positive` controls colour; bad metrics flip it so a falling
//    number reads green (identical to Pages). ──
function DeltaChip({ deltaPct, positive }: { deltaPct: number; positive: boolean }) {
  const up = deltaPct >= 0;
  const c = positive ? C.green : C.red;
  const bg = positive ? C.greenBg : C.redBg;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: bg, color: c, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: radius.sm }}>
        {up ? "▲" : "▼"} {Math.abs(deltaPct)}%
      </span>
      <span style={{ fontSize: 10.5, color: C.textFaint }}>vs last 7d avg</span>
    </div>
  );
}

// ── Working "?" tooltip — portal on <body>, viewport-clamped (same as Pages). ──
function HelpDot({ tip }: { tip: string }) {
  const [show, setShow] = useState(false);
  const dotRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number }>({ left: 0, top: 0, arrow: 0 });
  const W = 200, GAP = 8, MARGIN = 8;
  useLayoutEffect(() => {
    if (!show || !dotRef.current) return;
    const r = dotRef.current.getBoundingClientRect();
    const center = r.left + r.width / 2;
    let left = center - W / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - W - MARGIN));
    setPos({ left, top: r.bottom + GAP, arrow: center - left });
  }, [show]);
  return (
    <span ref={dotRef} style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", border: `1.2px solid ${C.textFaint}`, color: C.textFaint, fontSize: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help", lineHeight: 1 }}>?</span>
      {show && typeof document !== "undefined" && createPortal(
        <span style={{ position: "fixed", left: pos.left, top: pos.top, width: W, background: C.navy, color: C.white, fontSize: 11.5, fontWeight: 500, lineHeight: 1.5, padding: "8px 10px", borderRadius: radius.md, boxShadow: shadow.lg, zIndex: 1000, textTransform: "none", letterSpacing: 0, pointerEvents: "none" }}>
          <span style={{ position: "absolute", bottom: "100%", left: pos.arrow, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: `5px solid ${C.navy}` }} />
          {tip}
        </span>, document.body
      )}
    </span>
  );
}

// ── Unified stat card (graph | breakdown) — same chrome as Pages. ──
type BreakdownRow = { label: string; value: string; dot?: string };
function StatCard(props: {
  label: string; value: string; accent: string; tip: string; variant: "graph" | "breakdown";
  trend?: readonly number[]; trendStroke?: string; trendFill?: string;
  deltaPct?: number; deltaPositive?: boolean; rows?: BreakdownRow[]; footer?: React.ReactNode;
}) {
  const { label, value, accent, variant, tip } = props;
  return (
    <div style={{ background: C.white, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: shadow.sm, minHeight: 138, display: "flex" }}>
      <div style={{ width: 4, background: accent, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{label}</span>
          <HelpDot tip={tip} />
        </div>
        <p style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1 }}>{value}</p>
        {variant === "graph" && (
          <div style={{ marginTop: "auto" }}>
            <Sparkline data={props.trend!} stroke={props.trendStroke!} fill={props.trendFill!} />
            <div style={{ marginTop: 8 }}>
              {props.footer ?? <DeltaChip deltaPct={props.deltaPct!} positive={props.deltaPositive!} />}
            </div>
          </div>
        )}
        {variant === "breakdown" && (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {props.rows!.map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {r.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.dot, flexShrink: 0 }} />}{r.label}
                </span>
                <span style={{ color: C.text, fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row action kebab — View lives in the Actions button beside it, so the menu
//    holds Edit / Activate-Deactivate / Download / Copy / Delete (same shape as
//    the Pages kebab). Closes on outside click. ──
function RowKebab({ qr, open, onToggle, onClose, onEdit, onToggleStatus, onDownload, onCopy, onDelete }: {
  qr: QrCode; open: boolean; onToggle: () => void; onClose: () => void;
  onEdit: () => void; onToggleStatus: () => void; onDownload: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const ref = useClickOutside(onClose);
  const itemStyle: React.CSSProperties = { padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, display: "flex", alignItems: "center", gap: 8 };
  const hov = (on: boolean, bg: string = C.bg) => (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = on ? bg : "transparent");
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={onToggle}
        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: open ? C.blueLight : C.bg, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 16, color: open ? C.blue : C.textMuted, fontFamily: "inherit" }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, boxShadow: shadow.lg, zIndex: 50, minWidth: 184, padding: 6 }}>
          {qr.origin !== "api" && !(qr.usage === "onetime" && qr.status !== "Draft") && (
            <div onClick={() => { onEdit(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="edit" size={15} /> Edit</div>
          )}
          {qr.status !== "Draft" && qr.status !== "Expired" && (
            <div onClick={() => { onToggleStatus(); onClose(); }} style={{ ...itemStyle, color: qr.status === "Active" ? C.red : C.green }}
              onMouseEnter={hov(true, qr.status === "Active" ? C.redBg : C.greenBg)} onMouseLeave={hov(false)}>
              {qr.status === "Active" ? <><Icon name="pause" size={15} /> Deactivate</> : <><Icon name="play" size={15} /> Activate</>}
            </div>
          )}
          <div onClick={() => { onDownload(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="download" size={15} /> Download QR (PNG)</div>
          <div onClick={() => { onCopy(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="copy" size={15} /> Copy UPI link</div>
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <div onClick={() => { onDelete(); onClose(); }} style={{ ...itemStyle, color: C.red }} onMouseEnter={hov(true, C.redBg)} onMouseLeave={hov(false)}><Icon name="trash" size={15} /> Delete</div>
        </div>
      )}
    </div>
  );
}

const baseInp: React.CSSProperties = { padding: "8px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 13, color: C.text, outline: "none", background: C.white, fontFamily: "inherit" };

type SortKey = "payments" | "revenue" | "created";

export function QrDashboard({ codes, onCreate, onView, onEdit, onToggleStatus, onDownload, onCopy, onDelete }: {
  codes: QrCode[]; onCreate: () => void;
  onView: (q: QrCode) => void; onEdit: (q: QrCode) => void; onToggleStatus: (q: QrCode) => void;
  onDownload: (q: QrCode) => void; onCopy: (q: QrCode) => void; onDelete: (q: QrCode) => void;
}) {
  const m = QR_DASHBOARD_METRICS;
  const [view, setView] = useState<"codes" | "payments">("codes");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | QrStatus>("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "created", dir: "desc" });

  const matchesType = (c: QrCode) =>
    typeFilter === "All" ? true
    : typeFilter === "any" ? (c.usage === "reusable" && c.amountMode === "any")
    : typeFilter === "fixed" ? (c.usage === "reusable" && c.amountMode === "fixed")
    : c.usage === "onetime";
  const matchesSearch = (c: QrCode) => `${c.label} ${c.location} ${c.vpa}`.toLowerCase().includes(search.toLowerCase());

  const tabBase = codes.filter(c => matchesSearch(c) && matchesType(c));
  const tabCounts: Record<string, number> = {
    All: tabBase.length,
    Active: tabBase.filter(c => c.status === "Active").length,
    Inactive: tabBase.filter(c => c.status === "Inactive").length,
    Draft: tabBase.filter(c => c.status === "Draft").length,
    Expired: tabBase.filter(c => c.status === "Expired").length,
  };
  const STATUS_TABS: ("All" | QrStatus)[] = ["All", "Active", "Inactive", "Draft", "Expired"];

  const filtered = tabBase.filter(c => statusTab === "All" || c.status === statusTab);
  const revenueOf = (c: QrCode) => parseFloat(c.revenue.replace(/[₹,]/g, "")) || 0;
  const createdOf = (c: QrCode) => Date.parse(c.created.replace(",", "")) || 0;
  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const av = sort.key === "created" ? createdOf(a) : sort.key === "revenue" ? revenueOf(a) : a.payments;
    const bv = sort.key === "created" ? createdOf(b) : sort.key === "revenue" ? revenueOf(b) : b.payments;
    return (av - bv) * dir;
  });
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const copyRow = (c: QrCode) => { onCopy(c); setCopiedId(c.id); setTimeout(() => setCopiedId(x => (x === c.id ? null : x)), 1500); };

  return (
    <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Payment QR</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>Create scan-to-pay UPI codes for your counters and collections — API-minted transaction QRs appear here too.</p>
        </div>
        <Btn onClick={onCreate} size="lg"><Icon name="qr" size={16} color="#fff" /> Create QR</Btn>
      </div>

      {/* QR codes | Payments — top-level views of the same product */}
      <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
        {([["codes", "QR codes"], ["payments", "Payments"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 2px 11px",
              fontSize: 14, fontWeight: view === key ? 700 : 600, color: view === key ? C.text : C.textMuted,
              borderBottom: view === key ? `2px solid ${C.blue}` : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {view === "payments" ? <QrPaymentsPanel codes={codes} /> : (<>

      {/* Stats — 2 breakdown + 2 graph, same order/treatment as Payment Pages */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total QR codes" value={m.totalCodes.toString()} accent={C.blue} variant="breakdown"
          tip="All QR codes you've created, broken down by their current status."
          rows={[
            { label: "Active", value: m.statusCounts.active.toString(), dot: C.green },
            { label: "Draft", value: m.statusCounts.draft.toString(), dot: C.amber },
            { label: "Inactive", value: m.statusCounts.inactive.toString(), dot: C.textMuted },
            { label: "Expired", value: m.statusCounts.expired.toString(), dot: C.textFaint },
          ]} />
        <StatCard label="Total Collected" value={m.totalCollected} accent={C.blue} variant="graph"
          tip="Total money successfully collected across all your QR codes."
          trend={m.collectedTrend} trendStroke={C.blue} trendFill={C.blueLight}
          deltaPct={m.collectedDeltaPct} deltaPositive={m.collectedDeltaPct >= 0} />
        <StatCard label="Successful Payments" value={m.successfulPayments.toLocaleString("en-IN")} accent={C.green} variant="graph"
          tip="Payments that went through across all your QR codes."
          trend={m.successTrend} trendStroke={C.green} trendFill={C.greenBg}
          footer={
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ display: "inline-flex", alignItems: "center", background: C.greenBg, color: C.green, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: radius.sm }}>{m.successRate}% success</span>
              <span style={{ fontSize: 10.5, color: C.textFaint }}>of all attempts</span>
            </div>
          } />
        <StatCard label="Failed" value={m.failedAttempts.toLocaleString("en-IN")} accent={C.red} variant="graph"
          tip="Payment attempts that didn't complete. A falling trend is good — shown in green."
          trend={m.failedTrend} trendStroke={C.red} trendFill={C.redBg}
          deltaPct={m.failedDeltaPct} deltaPositive={m.failedDeltaPct <= 0} />
      </div>

      {/* Table card */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "visible", boxShadow: shadow.sm }}>
        {/* Status tabs — count pills, blue underline on the active tab */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", borderBottom: `1px solid ${C.borderLight}`, flexWrap: "wrap" }}>
          {STATUS_TABS.map(tab => {
            const isActive = statusTab === tab;
            return (
              <button key={tab} onClick={() => setStatusTab(tab)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 12px", background: "none", border: "none", borderBottom: `2px solid ${isActive ? C.blue : "transparent"}`, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.blue : C.textMuted, whiteSpace: "nowrap", marginBottom: -1 }}>
                {tab}
                <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: radius.full, background: isActive ? C.blueLight : C.bg, color: isActive ? C.blue : C.textMuted }}>{tabCounts[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar — search + type filter + export */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textFaint, display: "inline-flex" }}><Icon name="search" size={15} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, location or UPI ID..." style={{ ...baseInp, width: "100%", paddingLeft: 32 }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...baseInp }}>
              <option value="All">All Types</option>
              <option value="any">Any amount</option>
              <option value="fixed">Fixed price</option>
              <option value="onetime">One-time</option>
            </select>
          </div>
          <button style={{ ...baseInp, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.textSecondary }}><Icon name="download" size={15} /> Export</button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {([
                  { label: "QR / Location", key: null }, { label: "UPI ID", key: null }, { label: "Amount", key: null },
                  { label: "Paid", key: "payments" as const }, { label: "Collected", key: "revenue" as const },
                  { label: "Status", key: null }, { label: "Created", key: "created" as const }, { label: "Actions", key: null },
                ]).map(col => {
                  const sortable = col.key !== null;
                  const isSorted = sortable && sort.key === col.key;
                  return (
                    <th key={col.label} onClick={sortable ? () => toggleSort(col.key!) : undefined}
                      style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: isSorted ? C.text : C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {col.label}
                        {sortable && <span style={{ fontSize: 9, color: isSorted ? C.blue : C.textFaint }}>{isSorted ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}</span>}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, color: C.textMuted, margin: "0 0 6px" }}>No QR codes match your filters</p>
                  <p style={{ fontSize: 13, color: C.textFaint, margin: 0 }}>Try adjusting your search or filters</p>
                </td></tr>
              ) : sorted.map(c => (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.borderLight}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: radius.md, background: c.brandColor + "18", display: "flex", alignItems: "center", justifyContent: "center", color: c.brandColor, flexShrink: 0 }}><Icon name="qr" size={18} /></div>
                      <div>
                        <p onClick={() => onView(c)} style={{ fontSize: 14, color: C.blue, fontWeight: 600, cursor: "pointer", margin: "0 0 2px", lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
                          {c.label}
                          {c.origin === "api" && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.full, padding: "1px 7px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>via API</span>}
                        </p>
                        <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{c.location}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: "monospace", whiteSpace: "nowrap" }}>{c.vpa}</span>
                      <button onClick={() => copyRow(c)} style={{ fontSize: 10, background: "none", border: "none", color: copiedId === c.id ? C.green : C.textFaint, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {copiedId === c.id ? "✓" : <Icon name="copy" size={13} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: C.textSecondary, whiteSpace: "nowrap" }}>{c.amount}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted }}>{c.payments.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{c.revenue}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{c.created.split(",")[0]}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => onView(c)} style={{ fontSize: 12, color: C.blue, fontWeight: 600, background: C.blueLight, border: "none", cursor: "pointer", borderRadius: radius.sm, padding: "5px 10px", fontFamily: "inherit" }}>View</button>
                      <RowKebab qr={c} open={activeMenu === c.id} onToggle={() => setActiveMenu(activeMenu === c.id ? null : c.id)} onClose={() => setActiveMenu(null)}
                        onEdit={() => onEdit(c)} onToggleStatus={() => onToggleStatus(c)} onDownload={() => onDownload(c)} onCopy={() => copyRow(c)} onDelete={() => onDelete(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textFaint }}>Showing <strong style={{ color: C.textSecondary }}>{sorted.length}</strong> QR code{sorted.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      </>)}
    </div>
  );
}
