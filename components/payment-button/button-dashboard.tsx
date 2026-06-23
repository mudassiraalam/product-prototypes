"use client";
import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { StatusBadge, Btn, useClickOutside } from "@/components/payment-pages/primitives";
import { Icon } from "@/components/payment-pages/icons";
import { PaymentButton, ButtonStatus, BUTTON_DASHBOARD_METRICS, embedSnippet } from "./button-mock-data";
import { ButtonPaymentsPanel } from "./button-payments";

// ── Sparkline / DeltaChip / HelpDot / StatCard — same chrome as Payment QR &
//    Payment Pages, re-declared here so the surface is self-contained. ──
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

type BreakdownRow = { label: string; value: string; dot?: string };
function StatCard(props: {
  label: string; value: string; accent: string; tip: string; variant: "graph" | "breakdown";
  trend?: readonly number[]; trendStroke?: string; trendFill?: string;
  deltaPct?: number; deltaPositive?: boolean; rows?: BreakdownRow[]; footer?: React.ReactNode;
}) {
  const { label, value, variant, tip } = props;
  return (
    <div style={{ background: C.white, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: shadow.sm, minHeight: 138, display: "flex" }}>
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{label}</span>
          <HelpDot tip={tip} />
        </div>
        <p style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1 }}>{value}</p>
        {variant === "graph" && (
          <div style={{ marginTop: "auto" }}>
            <Sparkline data={props.trend!} stroke={props.trendStroke!} fill={props.trendFill!} />
            <div style={{ marginTop: 8 }}>{props.footer ?? <DeltaChip deltaPct={props.deltaPct!} positive={props.deltaPositive!} />}</div>
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

// ── Row action kebab — Edit / Activate-Deactivate / Get code / Copy ID / Delete.
//    "Get code" copies the embed snippet (the button's shareable artifact, the
//    way Copy-UPI-link works for a QR). API-created buttons aren't editable. ──
function RowKebab({ b, open, onToggle, onClose, onEdit, onToggleStatus, onGetCode, onCopyId, onDelete }: {
  b: PaymentButton; open: boolean; onToggle: () => void; onClose: () => void;
  onEdit: () => void; onToggleStatus: () => void; onGetCode: () => void; onCopyId: () => void; onDelete: () => void;
}) {
  const ref = useClickOutside(onClose);
  const itemStyle: React.CSSProperties = { padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, display: "flex", alignItems: "center", gap: 8 };
  const hov = (on: boolean, bg: string = C.bg) => (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = on ? bg : "transparent");
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={onToggle}
        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: open ? C.blueLight : C.bg, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 16, color: open ? C.blue : C.textMuted, fontFamily: "inherit" }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, boxShadow: shadow.lg, zIndex: 50, minWidth: 190, padding: 6 }}>
          {b.origin !== "api" && (
            <div onClick={() => { onEdit(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="edit" size={15} /> Edit</div>
          )}
          {b.status !== "Draft" && (
            <div onClick={() => { onToggleStatus(); onClose(); }} style={{ ...itemStyle, color: b.status === "Active" ? C.red : C.green }}
              onMouseEnter={hov(true, b.status === "Active" ? C.redBg : C.greenBg)} onMouseLeave={hov(false)}>
              {b.status === "Active" ? <><Icon name="pause" size={15} /> Deactivate</> : <><Icon name="play" size={15} /> Activate</>}
            </div>
          )}
          <div onClick={() => { onGetCode(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="redirect" size={15} /> Get code</div>
          <div onClick={() => { onCopyId(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }} onMouseEnter={hov(true)} onMouseLeave={hov(false)}><Icon name="copy" size={15} /> Copy button ID</div>
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <div onClick={() => { onDelete(); onClose(); }} style={{ ...itemStyle, color: C.red }} onMouseEnter={hov(true, C.redBg)} onMouseLeave={hov(false)}><Icon name="trash" size={15} /> Delete</div>
        </div>
      )}
    </div>
  );
}

const baseInp: React.CSSProperties = { padding: "8px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 13, color: C.text, outline: "none", background: C.white, fontFamily: "inherit" };
type SortKey = "payments" | "revenue" | "created";

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span style={{ fontSize: 12, color: C.blueDark, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.full, padding: "3px 9px", display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label}
      <button onClick={onClear} aria-label={`Clear ${label}`} style={{ background: "none", border: "none", color: C.blueDark, cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1, display: "inline-flex" }}>✕</button>
    </span>
  );
}

const typeLabel = (m: string) => (m === "fixed" ? "Fixed amount" : "Customer decides");

export function ButtonDashboard({ buttons, onCreate, onView, onEdit, onToggleStatus, onDelete }: {
  buttons: PaymentButton[]; onCreate: () => void;
  onView: (b: PaymentButton) => void; onEdit: (b: PaymentButton) => void;
  onToggleStatus: (b: PaymentButton) => void; onDelete: (b: PaymentButton) => void;
}) {
  const m = BUTTON_DASHBOARD_METRICS;
  const [view, setView] = useState<"buttons" | "payments">("buttons");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | ButtonStatus>("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "created", dir: "desc" });
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all");

  const matchesType = (b: PaymentButton) => typeFilter === "All" ? true : b.amountMode === typeFilter;
  const matchesSearch = (b: PaymentButton) => `${b.title} ${b.buttonLabel} ${b.id}`.toLowerCase().includes(search.toLowerCase());

  const createdMs = (b: PaymentButton) => Date.parse(b.created.replace(",", "")) || 0;
  const newestCreated = buttons.reduce((mx, b) => Math.max(mx, createdMs(b)), 0);
  const matchesDate = (b: PaymentButton) => {
    if (dateRange === "all") return true;
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return createdMs(b) >= newestCreated - days * 86400000;
  };

  const tabBase = buttons.filter(b => matchesSearch(b) && matchesType(b) && matchesDate(b));
  const tabCounts: Record<string, number> = {
    All: tabBase.length,
    Active: tabBase.filter(b => b.status === "Active").length,
    Inactive: tabBase.filter(b => b.status === "Inactive").length,
    Draft: tabBase.filter(b => b.status === "Draft").length,
  };
  const STATUS_TABS: ("All" | ButtonStatus)[] = ["All", "Active", "Inactive", "Draft"];

  const filtered = tabBase.filter(b => statusTab === "All" || b.status === statusTab);
  const revenueOf = (b: PaymentButton) => parseFloat(b.revenue.replace(/[₹,]/g, "")) || 0;
  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const av = sort.key === "created" ? createdMs(a) : sort.key === "revenue" ? revenueOf(a) : a.payments;
    const bv = sort.key === "created" ? createdMs(b) : sort.key === "revenue" ? revenueOf(b) : b.payments;
    return (av - bv) * dir;
  });
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const flash = (id: string) => { setCopiedId(id); setTimeout(() => setCopiedId(x => (x === id ? null : x)), 1500); };
  const copyEmbed = (b: PaymentButton) => { try { navigator.clipboard.writeText(embedSnippet(b.id)); flash(b.id); } catch { /* */ } };
  const copyId = (b: PaymentButton) => { try { navigator.clipboard.writeText(b.id); flash(b.id); } catch { /* */ } };

  return (
    <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Payment Button</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>Embed a Pay button on your own site or app — paste one snippet, collect through the EnKash checkout. API-created buttons appear here too.</p>
        </div>
        <Btn onClick={onCreate} size="lg"><Icon name="button" size={16} color="#fff" /> Create Payment Button</Btn>
      </div>

      {/* Buttons | Payments */}
      <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.border}`, marginBottom: 22 }}>
        {([["buttons", "Buttons"], ["payments", "Payments"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 2px 11px",
              fontSize: 14, fontWeight: view === key ? 700 : 600, color: view === key ? C.text : C.textMuted,
              borderBottom: view === key ? `2px solid ${C.blue}` : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {view === "payments" ? <ButtonPaymentsPanel buttons={buttons} /> : (<>

      {/* Stats — 1 breakdown + 3 graph, same treatment as QR / Pages */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total buttons" value={m.totalButtons.toString()} accent={C.blue} variant="breakdown"
          tip="Every payment button you've created, by current status."
          rows={[
            { label: "Active", value: m.statusCounts.active.toString(), dot: C.green },
            { label: "Draft", value: m.statusCounts.draft.toString(), dot: C.amber },
            { label: "Inactive", value: m.statusCounts.inactive.toString(), dot: C.textMuted },
          ]} />
        <StatCard label="Total Collected" value={m.totalCollected} accent={C.blue} variant="graph"
          tip="Total money successfully collected across all your buttons."
          trend={m.collectedTrend} trendStroke={C.blue} trendFill={C.blueLight}
          deltaPct={m.collectedDeltaPct} deltaPositive={m.collectedDeltaPct >= 0} />
        <StatCard label="Successful Payments" value={m.successfulPayments.toLocaleString("en-IN")} accent={C.green} variant="graph"
          tip="Payments that went through across all your buttons."
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
        {/* Status tabs */}
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

        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textFaint, display: "inline-flex" }}><Icon name="search" size={15} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, label or button ID..." style={{ ...baseInp, width: "100%", paddingLeft: 32 }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...baseInp }}>
              <option value="All">All Types</option>
              <option value="fixed">Fixed amount</option>
              <option value="customer">Customer decides</option>
            </select>
            <select value={dateRange} onChange={e => setDateRange(e.target.value as typeof dateRange)} aria-label="Date range" style={{ ...baseInp, cursor: "pointer", color: C.textSecondary, fontWeight: 600 }}>
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <button style={{ ...baseInp, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.textSecondary }}><Icon name="download" size={15} /> Download</button>
        </div>

        {/* Applied filters */}
        {(statusTab !== "All" || dateRange !== "all" || typeFilter !== "All" || !!search.trim()) && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${C.borderLight}`, background: C.bg, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.textFaint }}>Applied filters</span>
            {statusTab !== "All" && <FilterChip label={`Status: ${statusTab}`} onClear={() => setStatusTab("All")} />}
            {!!search.trim() && <FilterChip label={`Search: ${search}`} onClear={() => setSearch("")} />}
            {typeFilter !== "All" && <FilterChip label={`Type: ${typeLabel(typeFilter)}`} onClear={() => setTypeFilter("All")} />}
            {dateRange !== "all" && <FilterChip label={`Date: ${dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : "Last 90 days"}`} onClear={() => setDateRange("all")} />}
            <button onClick={() => { setStatusTab("All"); setSearch(""); setTypeFilter("All"); setDateRange("all"); }}
              style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginLeft: "auto", fontWeight: 600 }}>Clear all</button>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {([
                  { label: "Button", key: null }, { label: "Button ID", key: null }, { label: "Type", key: null }, { label: "Amount", key: null },
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
                <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center" }}>
                  <p style={{ fontSize: 15, color: C.textMuted, margin: "0 0 6px" }}>No payment buttons match your filters</p>
                  <p style={{ fontSize: 13, color: C.textFaint, margin: 0 }}>Try adjusting your search or filters</p>
                </td></tr>
              ) : sorted.map(b => (
                <tr key={b.id} style={{ borderTop: `1px solid ${C.borderLight}`, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: radius.md, background: b.brandColor + "18", display: "flex", alignItems: "center", justifyContent: "center", color: b.brandColor, flexShrink: 0 }}><Icon name="button" size={18} /></div>
                      <div>
                        <p onClick={() => onView(b)} style={{ fontSize: 14, color: C.blue, fontWeight: 600, cursor: "pointer", margin: "0 0 2px", lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
                          {b.title}
                          {b.origin === "api" && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.full, padding: "1px 7px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>via API</span>}
                        </p>
                        <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>“{b.buttonLabel}”</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: C.textMuted, whiteSpace: "nowrap" }}>{b.id}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.textSecondary, whiteSpace: "nowrap" }}>{typeLabel(b.amountMode)}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: C.textSecondary, whiteSpace: "nowrap" }}>{b.amount}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted }}>{b.payments.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{b.revenue}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{b.created.split(",")[0]}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => onView(b)} style={{ fontSize: 12, color: C.blue, fontWeight: 600, background: C.blueLight, border: "none", cursor: "pointer", borderRadius: radius.sm, padding: "5px 10px", fontFamily: "inherit" }}>{copiedId === b.id ? "Copied!" : "View"}</button>
                      <RowKebab b={b} open={activeMenu === b.id} onToggle={() => setActiveMenu(activeMenu === b.id ? null : b.id)} onClose={() => setActiveMenu(null)}
                        onEdit={() => onEdit(b)} onToggleStatus={() => onToggleStatus(b)} onGetCode={() => copyEmbed(b)} onCopyId={() => copyId(b)} onDelete={() => onDelete(b)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textFaint }}>Showing <strong style={{ color: C.textSecondary }}>{sorted.length}</strong> button{sorted.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      </>)}
    </div>
  );
}
