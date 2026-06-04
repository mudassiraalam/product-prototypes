"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { StatusBadge, Btn, useClickOutside } from "./primitives";
import { INITIAL_PAGES, PaymentPage, PageStatus, PageType, DASHBOARD_METRICS } from "./mock-data";

// ──────────────────────────────────────────────────────────────────────────────
// Type-level colors (primary). Kind-level icons/colors come from getKindInfo().
// ──────────────────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<PageType, string> = {
  "Standard Page": C.blue,
  Invoice: "#0891b2",
};

// Derives the visual "kind" for the row icon. The sub-label is intentionally
// not shown in the Type column — that would imply the merchant selected it,
// when in fact it's inferred from amountType + isDonation + itemsAreTickets.
// The icon alone preserves visual scannability without misleading the merchant.
type KindInfo = { label: string; icon: string; color: string };

function getKindInfo(page: PaymentPage): KindInfo {
  if (page.type === "Invoice") return { label: "Invoice", icon: "📃", color: "#0891b2" };
  if (page.isDonation) return { label: "Donation", icon: "❤️", color: "#e11d48" };
  if (page.itemsAreTickets) return { label: "Event Tickets", icon: "🎟", color: "#7c3aed" };
  if (page.amountType === "multiple") return { label: "Multiple Items", icon: "🛍️", color: "#1c5af4" };
  if (page.amountType === "customer") return { label: "Customer Decides", icon: "💰", color: "#16a34a" };
  return { label: "Fixed Price", icon: "💳", color: "#1c5af4" };
}

// ──────────────────────────────────────────────────────────────────────────────
// Sparkline — straight line segments point-to-point (sharp peaks/valleys, like
// the production cards in image 2), with an area fill underneath. Used by the
// two "graph" stat cards (Total Revenue, Failed).
// ──────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, stroke, fill }: { data: readonly number[]; stroke: string; fill: string }) {
  const W = 240, H = 44, pad = 5;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (W - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, pad + (H - pad * 2) * (1 - (v - min) / span)] as [number, number]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block" }}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Delta chip — small "▲ 18% vs last 7d avg" pill. `positive` controls colour;
// for "bad" metrics (Failed) the caller flips it so a falling number reads green.
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

// Help "?" with a real hover tooltip explaining the metric. Renders BELOW the
// dot so the scroll container's top edge never clips it.
function HelpDot({ tip }: { tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", border: `1.2px solid ${C.textFaint}`, color: C.textFaint, fontSize: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help", lineHeight: 1 }}>?</span>
      {show && (
        <span style={{ position: "absolute", top: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)", width: 200, background: C.navy, color: C.white, fontSize: 11.5, fontWeight: 500, lineHeight: 1.5, padding: "8px 10px", borderRadius: radius.md, boxShadow: shadow.lg, zIndex: 60, textTransform: "none", letterSpacing: 0 }}>
          <span style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: `5px solid ${C.navy}` }} />
          {tip}
        </span>
      )}
    </span>
  );
}

// Unified stat card. Shared chrome: a deep, fully-saturated left accent bar, an
// uppercase label with a working help tooltip, and a large value. The body is:
//   • variant="graph"     → sparkline + delta chip   (Total Revenue, Failed)
//   • variant="breakdown" → list of label/value rows (Total Pages, Successful Payments)
// All cards share one compact min-height so the 2-graph / 2-breakdown mix reads
// as intentional rhythm.
type BreakdownRow = { label: string; value: string; dot?: string };
function StatCard(props: {
  label: string;
  value: string;
  accent: string;
  tip: string;
  variant: "graph" | "breakdown";
  trend?: readonly number[];
  trendStroke?: string;
  trendFill?: string;
  deltaPct?: number;
  deltaPositive?: boolean;
  rows?: BreakdownRow[];
}) {
  const { label, value, accent, variant, tip } = props;
  return (
    <div style={{
      background: C.white, borderRadius: radius.lg, overflow: "hidden",
      border: `1px solid ${C.border}`, boxShadow: shadow.sm,
      minHeight: 138, display: "flex",
    }}>
      {/* Deep, saturated left accent bar */}
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
              <DeltaChip deltaPct={props.deltaPct!} positive={props.deltaPositive!} />
            </div>
          </div>
        )}

        {variant === "breakdown" && (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {props.rows!.map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {r.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.dot, flexShrink: 0 }} />}
                  {r.label}
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

// Row action kebab — trimmed menu (Copy Link / Archive / Deactivate). Closes on
// outside click via useClickOutside. View / Edit / View-Transactions were removed
// because the "View" button beside it opens the same detail page.
function RowKebab({ page, open, onToggle, onClose, onCopy, onArchive, onToggleStatus }: {
  page: PaymentPage;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCopy: () => void;
  onArchive: () => void;
  onToggleStatus: () => void;
}) {
  const ref = useClickOutside(onClose);
  const itemStyle: React.CSSProperties = { padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, display: "flex", alignItems: "center", gap: 8 };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: open ? C.blueLight : C.bg, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 16, color: open ? C.blue : C.textMuted, fontFamily: "inherit" }}>
        ⋮
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, boxShadow: shadow.lg, zIndex: 50, minWidth: 176, padding: 6 }}>
          <div onClick={() => { onCopy(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            📋 Copy Link
          </div>
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <div onClick={() => { onArchive(); onClose(); }} style={{ ...itemStyle, color: C.textSecondary }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {page.status === "Archived" ? "↩ Unarchive" : "🗄 Archive"}
          </div>
          {page.status !== "Archived" && (
            <div onClick={() => { onToggleStatus(); onClose(); }}
              style={{ ...itemStyle, color: page.status === "Active" ? C.red : C.green }}
              onMouseEnter={e => (e.currentTarget.style.background = page.status === "Active" ? C.redBg : C.greenBg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {page.status === "Active" ? "⛔ Deactivate" : "✅ Activate"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const baseInp: React.CSSProperties = {
  padding: "8px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md,
  fontSize: 13, color: C.text, outline: "none", background: C.white, fontFamily: "inherit",
};

export function Dashboard({ onCreate, onView }: {
  onCreate: () => void;
  onView: (page: PaymentPage) => void;
}) {
  const [pages, setPages] = useState<PaymentPage[]>(INITIAL_PAGES);
  const [search, setSearch] = useState("");
  // Single source of truth for the status tab row. "Archived" is now one of the
  // tabs (it replaces the old footer toggle), so the dashboard never needs a
  // separate showArchived flag — selecting the Archived tab shows only archived
  // pages, any other tab hides them.
  const [statusTab, setStatusTab] = useState<"All" | PageStatus>("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Copies the page's hosted URL and shows a brief "Copied!" confirmation.
  const copyLink = (page: PaymentPage) => {
    const url = `pay.enkash.in/${page.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(c => (c === page.id ? null : c)), 1500);
  };
  // Sort state for click-to-sort columns (Created / Views / Payments / Revenue).
  const [sort, setSort] = useState<{ key: "created" | "views" | "payments" | "revenue"; dir: "asc" | "desc" }>({ key: "created", dir: "desc" });

  const showArchived = statusTab === "Archived";

  // A page is parsed for its numeric revenue for both the total and sorting.
  const revenueOf = (p: PaymentPage) => parseFloat(p.revenue.replace(/[₹,]/g, "")) || 0;
  // Created strings look like "15 Nov 2024, 10:30" — Date.parse handles them
  // well enough for prototype sorting.
  const createdOf = (p: PaymentPage) => Date.parse(p.created.replace(",", "")) || 0;

  const filtered = pages.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || p.type === typeFilter;
    // The Archived tab shows ONLY archived pages; every other tab hides them.
    // "All" shows everything except archived. A specific status tab matches it.
    const matchTab =
      statusTab === "Archived" ? p.status === "Archived"
      : statusTab === "All" ? p.status !== "Archived"
      : p.status === statusTab;
    return matchSearch && matchType && matchTab;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    let av: number, bv: number;
    if (sort.key === "created") { av = createdOf(a); bv = createdOf(b); }
    else if (sort.key === "revenue") { av = revenueOf(a); bv = revenueOf(b); }
    else { av = a[sort.key]; bv = b[sort.key]; }
    return (av - bv) * dir;
  });

  // Counts per tab — shown as the little number beside each tab label. Computed
  // off the search+type filtered set (minus the status dimension) so the counts
  // reflect what the user would actually see when they click each tab.
  const tabBase = pages.filter(p =>
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
    && (typeFilter === "All" || p.type === typeFilter)
  );
  const tabCounts: Record<string, number> = {
    All: tabBase.filter(p => p.status !== "Archived").length,
    Active: tabBase.filter(p => p.status === "Active").length,
    Inactive: tabBase.filter(p => p.status === "Inactive").length,
    Draft: tabBase.filter(p => p.status === "Draft").length,
    Expired: tabBase.filter(p => p.status === "Expired").length,
    Archived: tabBase.filter(p => p.status === "Archived").length,
  };
  const STATUS_TABS: ("All" | PageStatus)[] = ["All", "Active", "Inactive", "Draft", "Expired", "Archived"];

  const toggleSort = (key: "created" | "views" | "payments" | "revenue") => {
    setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  // CSV export — downloads the currently filtered view. Matches the pattern
  // used by Stripe (Export current view) and Razorpay (Download as CSV).
  const exportCsv = () => {
    const headers = ["ID", "Title", "Slug", "Type", "Amount", "Views", "Payments", "Revenue", "Status", "Created"];
    const rows = sorted.map(p => [p.id, p.title, p.slug, p.type, p.amount, p.views, p.payments, p.revenue, p.status, p.created]);
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `payment-pages-${showArchived ? "archived-" : ""}${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const totalRevenue = pages.reduce((acc, p) => {
    const n = parseFloat(p.revenue.replace(/[₹,]/g, "")) || 0;
    return acc + n;
  }, 0);

  const formatRevenue = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const toggleStatus = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" as PageStatus } : p));
    setActiveMenu(null);
  };

  const toggleArchive = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "Archived" ? "Active" : "Archived" as PageStatus } : p));
    setActiveMenu(null);
  };

  return (
    <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Payment Pages</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
            Create hosted payment pages and share them via link, QR code, or social media — no website needed.
          </p>
        </div>
        <Btn onClick={onCreate} size="lg">
          + Create Payment Page
        </Btn>
      </div>

      {/* Stats row — 2 graph cards (Revenue, Failed) + 2 breakdown cards
          (Total Pages, Successful Payments). Order matches the production
          reference: inventory → money in → volume → money at risk. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Pages"
          value={pages.length.toString()}
          accent={C.blue}
          tip="All payment pages you've created, broken down by their current status."
          variant="breakdown"
          rows={[
            { label: "Active", value: pages.filter(p => p.status === "Active").length.toString(), dot: C.green },
            { label: "Draft", value: pages.filter(p => p.status === "Draft").length.toString(), dot: C.amber },
            { label: "Inactive", value: pages.filter(p => p.status === "Inactive").length.toString(), dot: C.textMuted },
          ]}
        />
        <StatCard
          label="Total Revenue"
          value={formatRevenue(totalRevenue)}
          accent={C.blue}
          tip="Total money successfully collected across all your payment pages."
          variant="graph"
          trend={DASHBOARD_METRICS.revenueTrend}
          trendStroke={C.blue}
          trendFill={C.blueLight}
          deltaPct={DASHBOARD_METRICS.revenueDeltaPct}
          deltaPositive={DASHBOARD_METRICS.revenueDeltaPct >= 0}
        />
        <StatCard
          label="Successful Payments"
          value={DASHBOARD_METRICS.successfulPayments.toLocaleString()}
          accent={C.green}
          tip="Count of payments that went through, split by the method customers used."
          variant="breakdown"
          rows={DASHBOARD_METRICS.methodSplit.map(m => ({ label: m.method, value: `${m.pct}%` }))}
        />
        <StatCard
          label="Failed"
          value={DASHBOARD_METRICS.failed.toLocaleString()}
          accent={C.red}
          tip="Payment attempts that didn't complete. A falling trend is good — shown in green."
          variant="graph"
          trend={DASHBOARD_METRICS.failedTrend}
          trendStroke={C.red}
          trendFill={C.redBg}
          deltaPct={DASHBOARD_METRICS.failedDeltaPct}
          /* colour-flip: failures FALLING is GOOD → render green */
          deltaPositive={DASHBOARD_METRICS.failedDeltaPct <= 0}
        />
      </div>

      {/* Table card */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "visible", boxShadow: shadow.sm }}>
        {/* Status tabs — count-pills, the primary status filter. Archived is
            included here as the rightmost tab (it replaces the old footer
            toggle). The active tab gets a blue underline + blue text. */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", borderBottom: `1px solid ${C.borderLight}`, flexWrap: "wrap" }}>
          {STATUS_TABS.map(tab => {
            const isActive = statusTab === tab;
            return (
              <button key={tab} onClick={() => setStatusTab(tab)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "13px 12px", background: "none", border: "none",
                  borderBottom: `2px solid ${isActive ? C.blue : "transparent"}`, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? C.blue : C.textMuted, whiteSpace: "nowrap",
                  marginBottom: -1,
                }}>
                {tab}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: radius.full,
                  background: isActive ? C.blueLight : C.bg, color: isActive ? C.blue : C.textMuted,
                }}>
                  {tabCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar — search + type filter + export. (Status moved to the tabs
            above; the list/grid view toggle was removed to match production.) */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textFaint }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, slug or ID..."
                style={{ ...baseInp, width: "100%", paddingLeft: 32 }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...baseInp }}>
              <option value="All">All Types</option>
              <option value="Standard Page">Standard Page</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Export — downloads the current filtered view as CSV */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setExportOpen(o => !o)}
                style={{ ...baseInp, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.textSecondary }}>
                ⬇ Export
              </button>
              {exportOpen && (
                <div style={{ position: "absolute", right: 0, top: "110%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, boxShadow: shadow.lg, zIndex: 50, minWidth: 200, padding: 6 }}>
                  <div onClick={exportCsv}
                    style={{ padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, color: C.textSecondary }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    📄 Download as CSV
                  </div>
                  <p style={{ fontSize: 11, color: C.textFaint, margin: "4px 8px 2px", lineHeight: 1.4 }}>
                    Exports {sorted.length} page{sorted.length === 1 ? "" : "s"} matching your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {(
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {([
                    { label: "Page", key: null },
                    { label: "Type", key: null },
                    { label: "Amount", key: null },
                    { label: "Views", key: "views" as const },
                    { label: "Payments", key: "payments" as const },
                    { label: "Revenue", key: "revenue" as const },
                    { label: "Status", key: null },
                    { label: "Created", key: "created" as const },
                    { label: "Actions", key: null },
                  ]).map(col => {
                    const sortable = col.key !== null;
                    const isSorted = sortable && sort.key === col.key;
                    return (
                      <th key={col.label}
                        onClick={sortable ? () => toggleSort(col.key!) : undefined}
                        style={{
                          padding: "10px 16px", fontSize: 11, fontWeight: 700, color: isSorted ? C.text : C.textMuted,
                          textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                          cursor: sortable ? "pointer" : "default", userSelect: "none",
                        }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          {sortable && (
                            <span style={{ fontSize: 9, color: isSorted ? C.blue : C.textFaint }}>
                              {isSorted ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px", textAlign: "center" }}>
                      <p style={{ fontSize: 15, color: C.textMuted, margin: "0 0 6px" }}>
                        {showArchived ? "No archived pages" : "No payment pages match your filters"}
                      </p>
                      <p style={{ fontSize: 13, color: C.textFaint, margin: 0 }}>
                        {showArchived ? "Archive a page to see it here" : "Try adjusting your search or filters"}
                      </p>
                    </td>
                  </tr>
                ) : sorted.map(page => {
                  const kind = getKindInfo(page);
                  const typeColor = TYPE_COLORS[page.type];
                  return (
                  <tr key={page.id}
                    style={{ borderTop: `1px solid ${C.borderLight}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: radius.md, background: kind.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                          {kind.icon}
                        </div>
                        <div>
                          <p onClick={() => onView(page)} style={{ fontSize: 14, color: C.blue, fontWeight: 600, cursor: "pointer", margin: "0 0 2px", lineHeight: 1.3 }}>{page.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <p style={{ fontSize: 11, color: C.textFaint, margin: 0, fontFamily: "monospace" }}>pay.enkash.in/{page.slug}</p>
                            <button onClick={() => copyLink(page)}
                              style={{ fontSize: 10, background: "none", border: "none", color: copiedId === page.id ? C.green : C.textFaint, cursor: "pointer", padding: 0 }}>
                              {copiedId === page.id ? "✓ Copied" : "📋"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: 12, background: typeColor + "18", color: typeColor, borderRadius: radius.full, padding: "3px 9px", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {page.type}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: C.textSecondary, whiteSpace: "nowrap" }}>{page.amount}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted }}>{page.views.toLocaleString()}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted }}>{page.payments.toLocaleString()}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{page.revenue}</td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={page.status} /></td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{page.created}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button onClick={() => onView(page)}
                          style={{ fontSize: 12, color: C.blue, fontWeight: 600, background: C.blueLight, border: "none", cursor: "pointer", borderRadius: radius.sm, padding: "5px 10px", fontFamily: "inherit" }}>
                          View
                        </button>
                        <RowKebab
                          page={page}
                          open={activeMenu === page.id}
                          onToggle={() => setActiveMenu(activeMenu === page.id ? null : page.id)}
                          onClose={() => setActiveMenu(null)}
                          onCopy={() => copyLink(page)}
                          onArchive={() => toggleArchive(page.id)}
                          onToggleStatus={() => toggleStatus(page.id)}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — simple count. The archived view is now reached via the
            Archived status tab above, so the old footer toggle was removed. */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textFaint }}>
            Showing <strong style={{ color: C.textSecondary }}>{sorted.length}</strong>{" "}
            {showArchived ? "archived " : ""}page{sorted.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
