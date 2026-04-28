"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { StatusBadge, Btn } from "./primitives";
import { INITIAL_PAGES, PaymentPage, PageStatus, PageType } from "./mock-data";

const TYPE_ICONS: Record<PageType, string> = {
  Standard: "💳",
  Donation: "❤️",
  Event: "🎟",
  Invoice: "📃",
};

const TYPE_COLORS: Record<PageType, string> = {
  Standard: C.blue,
  Donation: "#e11d48",
  Event: "#7c3aed",
  Invoice: "#0891b2",
};

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: string;
}) {
  return (
    <div style={{ background: C.white, borderRadius: radius.lg, padding: "18px 20px", border: `1.5px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: radius.md, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{sub}</p>}
      </div>
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
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filtered = pages.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchType = typeFilter === "All" || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

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

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Pages" value={pages.length.toString()} sub="All time" color={C.blue} icon="📄" />
        <StatCard label="Active Pages" value={pages.filter(p => p.status === "Active").length.toString()} sub="Accepting payments" color={C.green} icon="✅" />
        <StatCard label="Total Payments" value={pages.reduce((a, p) => a + p.payments, 0).toString()} sub="Across all pages" color="#7c3aed" icon="💰" />
        <StatCard label="Total Revenue" value={formatRevenue(totalRevenue)} sub="Via payment pages" color={C.amber} icon="📈" />
      </div>

      {/* Table card */}
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "visible", boxShadow: shadow.sm }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textFaint }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, slug or ID..."
                style={{ ...baseInp, width: "100%", paddingLeft: 32 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...baseInp }}>
              <option value="All">All Status</option>
              {["Active", "Inactive", "Draft", "Expired"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...baseInp }}>
              <option value="All">All Types</option>
              {["Standard", "Donation", "Event", "Invoice"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: radius.md, padding: 3 }}>
              {([["table", "☰"], ["grid", "⊞"]] as const).map(([k, icon]) => (
                <button key={k} onClick={() => setView(k)}
                  style={{ width: 32, height: 28, border: "none", borderRadius: radius.sm, cursor: "pointer", background: view === k ? C.white : "transparent", color: view === k ? C.text : C.textMuted, boxShadow: view === k ? shadow.sm : "none", fontFamily: "inherit", fontSize: 14 }}>
                  {icon}
                </button>
              ))}
            </div>
            <button style={{ ...baseInp, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.textSecondary }}>
              ⬇ Export
            </button>
          </div>
        </div>

        {/* Table view */}
        {view === "table" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Page", "Type", "Amount", "Views", "Payments", "Revenue", "Status", "Created", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px", textAlign: "center" }}>
                      <p style={{ fontSize: 15, color: C.textMuted, margin: "0 0 6px" }}>No payment pages match your filters</p>
                      <p style={{ fontSize: 13, color: C.textFaint, margin: 0 }}>Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : filtered.map(page => (
                  <tr key={page.id}
                    style={{ borderTop: `1px solid ${C.borderLight}`, transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: radius.md, background: (TYPE_COLORS[page.type] ?? C.blue) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                          {TYPE_ICONS[page.type]}
                        </div>
                        <div>
                          <p onClick={() => onView(page)} style={{ fontSize: 14, color: C.blue, fontWeight: 600, cursor: "pointer", margin: "0 0 2px", lineHeight: 1.3 }}>{page.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <p style={{ fontSize: 11, color: C.textFaint, margin: 0, fontFamily: "monospace" }}>pay.enkash.in/{page.slug}</p>
                            <button onClick={() => navigator.clipboard.writeText(`pay.enkash.in/${page.slug}`)}
                              style={{ fontSize: 10, background: "none", border: "none", color: C.textFaint, cursor: "pointer", padding: 0 }}>
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ fontSize: 12, background: (TYPE_COLORS[page.type] ?? C.blue) + "18", color: TYPE_COLORS[page.type] ?? C.blue, borderRadius: radius.full, padding: "3px 9px", fontWeight: 600 }}>
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
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setActiveMenu(activeMenu === page.id ? null : page.id)}
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 16, color: C.textMuted, fontFamily: "inherit" }}>
                            ⋮
                          </button>
                          {activeMenu === page.id && (
                            <div style={{ position: "absolute", right: 0, top: "110%", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, boxShadow: shadow.lg, zIndex: 50, minWidth: 180, padding: 6 }}>
                              {[
                                { label: "📋 Copy Link", action: () => { navigator.clipboard.writeText(`pay.enkash.in/${page.slug}`); setActiveMenu(null); } },
                                { label: "📝 Edit Page", action: () => { onView(page); setActiveMenu(null); } },
                                { label: "⧉ Duplicate", action: () => setActiveMenu(null) },
                                { label: "📊 View Transactions", action: () => { onView(page); setActiveMenu(null); } },
                              ].map(item => (
                                <div key={item.label} onClick={item.action}
                                  style={{ padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, color: C.textSecondary }}
                                  onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  {item.label}
                                </div>
                              ))}
                              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                              <div onClick={() => toggleStatus(page.id)}
                                style={{ padding: "8px 12px", cursor: "pointer", borderRadius: radius.sm, fontSize: 13, color: page.status === "Active" ? C.red : C.green }}
                                onMouseEnter={e => (e.currentTarget.style.background = page.status === "Active" ? C.redBg : C.greenBg)}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                {page.status === "Active" ? "⛔ Deactivate" : "✅ Activate"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid view */}
        {view === "grid" && (
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(page => (
              <div key={page.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", background: C.white, transition: "box-shadow 0.15s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = shadow.md)}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}>
                {/* Mini header preview */}
                <div style={{ height: 8, background: page.brandColor }} />
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: radius.md, background: (TYPE_COLORS[page.type] ?? C.blue) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {TYPE_ICONS[page.type]}
                    </div>
                    <StatusBadge status={page.status} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px", lineHeight: 1.3 }}>{page.title}</p>
                  <p style={{ fontSize: 11, color: C.textFaint, margin: "0 0 12px", fontFamily: "monospace" }}>/{page.slug}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[["Views", page.views.toLocaleString()], ["Payments", page.payments.toString()], ["Revenue", page.revenue]].map(([l, v]) => (
                      <div key={l} style={{ background: C.bg, borderRadius: radius.sm, padding: "6px 8px", textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: C.textFaint, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onView(page)} style={{ flex: 1, padding: "7px", background: C.blueLight, color: C.blue, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>View</button>
                    <button onClick={() => navigator.clipboard.writeText(`pay.enkash.in/${page.slug}`)} style={{ padding: "7px 10px", background: C.bg, border: "none", borderRadius: radius.sm, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>📋</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.textFaint }}>
            Showing <strong style={{ color: C.textSecondary }}>{filtered.length}</strong> of <strong style={{ color: C.textSecondary }}>{pages.length}</strong> pages
          </span>
          <span style={{ fontSize: 12, color: C.blue, cursor: "pointer", fontWeight: 600 }}>View archived pages →</span>
        </div>
      </div>
    </div>
  );
}
