"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { Modal, StatusBadge, Btn, SegmentedControl } from "./primitives";
import { Icon, IconName } from "./icons";
import { PaymentPage, Submission, PAGE_SUBMISSIONS } from "./mock-data";
import { PagePreview } from "./page-preview";
import { WizardData } from "./wizard-steps";
import { pageToWizardData } from "./page-mappers";
import { RecordDrawer, DrawerRecord } from "./record-drawer";

// Build the drawer payload for one page submission. The blue source pill on the
// drawer links this payment back to its page (the payment-linked tag).
function submissionToRecord(sub: Submission, page: PaymentPage, fieldLabels: string[]): DrawerRecord {
  const r = sub.responses;
  const phone = r["Phone Number"] || r["Phone"] || r["Mobile"] || "";
  return {
    id: sub.id,
    amount: sub.amount,
    status: sub.status,
    date: sub.date,
    source: { kind: "page", name: page.title, ref: page.id },
    party: [
      { label: "Name", value: r["Full Name"] || r[fieldLabels[0]] || "—" },
      { label: "Email", value: r["Email Address"] || "—" },
      ...(phone ? [{ label: "Phone", value: phone }] : []),
    ],
    details: [
      { label: "Date", value: sub.date },
      { label: "Page", value: `pay.enkash.in/${page.slug}` },
    ],
    responses: fieldLabels.map(l => ({ label: l, value: r[l] || "—" })),
  };
}

// ── QR Code Modal ──────────────────────────────────────────────────────────────
function QRModal({ page, onClose }: { page: PaymentPage; onClose: () => void }) {
  const url = `pay.enkash.in/${page.slug}`;
  const [copied, setCopied] = useState(false);

  // Generate a simple SVG QR-like visual (decorative)
  const qrCells = Array.from({ length: 15 }, (_, r) =>
    Array.from({ length: 15 }, (_, c) => {
      const hash = (r * 31 + c * 17 + r * c) % 100;
      const isCorner = (r < 4 && c < 4) || (r < 4 && c > 10) || (r > 10 && c < 4);
      return isCorner ? true : hash < 45;
    })
  );

  return (
    <Modal title="QR Code" subtitle={`Scan to pay — ${page.title}`} onClose={onClose} width={420}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.white, border: `2px solid ${C.border}`, borderRadius: radius.lg, padding: 16, marginBottom: 16 }}>
          {/* QR decoration */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 16px)", gap: 1 }}>
            {qrCells.flat().map((filled, i) => (
              <div key={i} style={{ width: 16, height: 16, background: filled ? page.brandColor : C.white, borderRadius: 2 }} />
            ))}
          </div>
          <p style={{ fontSize: 10, color: C.textFaint, margin: "10px 0 0" }}>pay.enkash.in/{page.slug}</p>
        </div>

        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
          Share this QR code with your customers. When scanned, it opens your payment page directly.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="primary" onClick={() => { navigator.clipboard.writeText(`https://${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? "✓ Copied URL!" : "Copy Link"}
          </Btn>
          <Btn variant="ghost">Download PNG</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────────────
function ShareModal({ page, onClose }: { page: PaymentPage; onClose: () => void }) {
  const url = `https://pay.enkash.in/${page.slug}`;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "embed" | "email">("link");

  const embedCode = `<!-- EnKash Payment Page Button -->
<a href="${url}" 
   target="_blank"
   style="display:inline-block;background:${page.brandColor};color:#fff;
          padding:12px 24px;border-radius:8px;text-decoration:none;
          font-weight:700;font-family:sans-serif;">
  ${page.buttonLabel}
</a>`;

  const shareLinks: { name: string; color: string; icon: IconName; url: string }[] = [
    { name: "WhatsApp", color: "#25d366", icon: "whatsapp", url: `https://wa.me/?text=Hi, please make your payment here: ${url}` },
    { name: "Email", color: "#ea4335", icon: "mail", url: `mailto:?subject=Payment Request&body=Please complete your payment here: ${url}` },
    { name: "X (Twitter)", color: "#000000", icon: "x", url: `https://twitter.com/intent/tweet?text=Make your payment here: ${url}` },
    { name: "Facebook", color: "#1877f2", icon: "facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
  ];

  return (
    <Modal title="Share Payment Page" subtitle={page.title} onClose={onClose} width={520}>
      <SegmentedControl
        options={[{ key: "link", label: "Copy Link" }, { key: "embed", label: "Embed Code" }, { key: "email", label: "Social Share" }]}
        value={activeTab}
        onChange={v => setActiveTab(v as typeof activeTab)}
      />
      <div style={{ marginTop: 20 }}>
        {activeTab === "link" && (
          <div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>Share this link directly with your customers.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "10px 12px" }}>
                <span style={{ fontSize: 13, color: C.blue }}>{url}</span>
              </div>
              <Btn onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? "✓ Copied!" : "Copy"}
              </Btn>
            </div>
            <p style={{ fontSize: 12, color: C.textFaint, margin: "10px 0 0" }}>
              Links expire based on your page settings (currently: {page.expires ? `expires ${page.expires}` : "no expiry set"}).
            </p>
          </div>
        )}
        {activeTab === "embed" && (
          <div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 14px" }}>Embed a payment button on any website that links to your page.</p>
            <div style={{ position: "relative" }}>
              <pre style={{ background: C.navy, color: "#e2e8f0", borderRadius: radius.md, padding: 16, fontSize: 12, overflowX: "auto", margin: "0 0 10px", fontFamily: "monospace", lineHeight: 1.7 }}>
                {embedCode}
              </pre>
              <button
                onClick={() => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ position: "absolute", top: 10, right: 10, background: copied ? C.green : "rgba(255,255,255,0.15)", border: "none", color: C.white, borderRadius: radius.sm, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>Preview: <button style={{ background: page.brandColor, color: C.white, border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginLeft: 8, fontFamily: "inherit" }}>{page.buttonLabel}</button></p>
          </div>
        )}
        {activeTab === "email" && (
          <div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px" }}>Share your payment page through social platforms.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {shareLinks.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, textDecoration: "none", transition: "border-color 0.15s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = s.color)}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = C.border)}>
                  <div style={{ width: 32, height: 32, borderRadius: radius.sm, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, flexShrink: 0 }}>
                    <Icon name={s.icon} size={16} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Submissions tab ─────────────────────────────────────────────────────────────
// One row per payment attempt. The first four columns are fixed; everything
// after is generated from the page's customerFields (the form the merchant
// built in wizard Step 2), so the form builder and this view stay connected.
// Records are payment-linked only — abandoned forms are not captured.
function SubmissionsTab({ page, fieldLabels, submissions, onOpen }: {
  page: PaymentPage; fieldLabels: string[]; submissions: Submission[]; onOpen: (sub: Submission) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = submissions.filter(sub => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || sub.id.toLowerCase().includes(q)
      || Object.values(sub.responses).some(v => v.toLowerCase().includes(q));
    const matchStatus = statusFilter === "All" || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const allIds = filtered.map(t => t.id);
  const allSelected = selected.length > 0 && allIds.every(id => selected.includes(id));
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  // Refunds only apply to captured/successful payments.
  const refundableSelected = filtered.filter(t => selected.includes(t.id) && t.status === "Success").length;

  // Total on record can exceed the seeded rows (the stats card counts all-time).
  const totalCount = Math.max(page.payments, submissions.length);

  if (submissions.length === 0) {
    return (
      <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "56px 24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 10px", color: C.textFaint, display: "flex", justifyContent: "center" }}><Icon name="receipt" size={30} /></p>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>No submissions yet</p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
          When customers pay through this page, their payment and form responses appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
      {/* Toolbar — turns into a bulk-action bar once rows are selected */}
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: selected.length ? C.blueLight : "transparent", minHeight: 56, flexWrap: "wrap" }}>
        {selected.length > 0 ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.blueDark }}>{selected.length} selected</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ fontSize: 12.5, color: C.blueDark, background: C.white, border: `1px solid ${C.blueMid}`, borderRadius: radius.sm, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="download" size={14} /> Export selected</button>
              <button
                disabled={refundableSelected === 0}
                title={refundableSelected === 0 ? "Only successful payments can be refunded" : undefined}
                style={{ fontSize: 12.5, color: refundableSelected ? C.white : C.textFaint, background: refundableSelected ? C.red : C.redBg, border: "none", borderRadius: radius.sm, padding: "6px 12px", cursor: refundableSelected ? "pointer" : "not-allowed", fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="refresh" size={14} /> Initiate refund{refundableSelected ? ` (${refundableSelected})` : ""}
              </button>
              <button onClick={() => setSelected([])} style={{ fontSize: 12.5, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Clear</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textFaint, display: "inline-flex" }}><Icon name="search" size={14} /></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search payment ID or responses..."
                  style={{ width: "100%", padding: "8px 12px 8px 30px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: C.white }} />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "8px 10px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 13, fontFamily: "inherit", outline: "none", background: C.white, color: C.textSecondary, cursor: "pointer" }}>
                <option value="All">All statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <button style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: "none", borderRadius: radius.sm, padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}><Icon name="download" size={14} /> Export CSV</button>
          </>
        )}
      </div>

      {/* Table — horizontal scroll absorbs however many form-field columns exist */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 + fieldLabels.length * 150 }}>
          <thead>
            {/* Column-group header — payment columns vs form-response columns */}
            <tr>
              <th colSpan={5} style={{ padding: "6px 16px", fontSize: 10, fontWeight: 700, color: C.textFaint, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.07em", background: C.bg, borderBottom: `1px solid ${C.border}` }}>Payment</th>
              <th colSpan={fieldLabels.length} style={{ padding: "6px 16px", fontSize: 10, fontWeight: 700, color: C.blueDark, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.07em", background: C.blueLight, borderBottom: `1px solid ${C.border}` }}>Form responses</th>
            </tr>
            <tr style={{ background: C.bg }}>
              <th style={{ padding: "10px 16px", width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer", width: 15, height: 15 }} />
              </th>
              {["Payment ID", "Date", "Amount", "Status", ...fieldLabels].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5 + fieldLabels.length} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: C.textMuted }}>
                  No submissions match your filters
                </td>
              </tr>
            ) : filtered.map(sub => {
              const on = selected.includes(sub.id);
              return (
                <tr key={sub.id} style={{ borderTop: `1px solid ${C.borderLight}`, background: on ? C.blueLight : "transparent" }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#fafbfd"; }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "12px 16px" }}>
                    <input type="checkbox" checked={on} onChange={() => toggle(sub.id)} style={{ cursor: "pointer", width: 15, height: 15 }} />
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}><button onClick={() => onOpen(sub)} style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer" }}>{sub.id}</button></td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{sub.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{sub.amount}</td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge status={sub.status} /></td>
                  {fieldLabels.map(label => (
                    <td key={label} style={{ padding: "12px 16px", fontSize: 13, color: sub.responses[label] ? C.textSecondary : C.textFaint, whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sub.responses[label] || "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 18px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.textFaint }}>Showing {filtered.length} of {totalCount.toLocaleString()} submissions</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>‹ 1 ›</span>
      </div>
    </div>
  );
}

// ── Preview Modal (desktop / mobile toggle, full width) ─────────────────────────
function PreviewModal({ page, data, onClose }: { page: PaymentPage; data: WizardData; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <Modal title={`Preview — ${page.title}`} subtitle={`pay.enkash.in/${page.slug}`} onClose={onClose} width={1000} noPad>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 240 }}>
          <SegmentedControl
            options={[{ key: "desktop", label: "Desktop" }, { key: "mobile", label: "Mobile" }]}
            value={device}
            onChange={v => setDevice(v as "desktop" | "mobile")}
          />
        </div>
        <a href={`https://pay.enkash.in/${page.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: C.blue, fontWeight: 700, textDecoration: "none" }}>Open ↗</a>
      </div>
      <div style={{ background: "#eef1f7", padding: device === "desktop" ? 24 : "24px 0", maxHeight: 640, overflow: "auto" }}>
        <div style={{ maxWidth: device === "desktop" ? 880 : 380, margin: "0 auto" }}>
          <PagePreview data={data} device={device} />
        </div>
      </div>
    </Modal>
  );
}

// ── Page Detail View ───────────────────────────────────────────────────────────
export function PageDetailView({ page: initialPage, onBack, onEdit }: { page: PaymentPage; onBack: () => void; onEdit: (page: PaymentPage) => void }) {
  const [page] = useState(initialPage);
  const [tab, setTab] = useState<"overview" | "submissions">("overview");
  const [activeModal, setActiveModal] = useState<"qr" | "share" | "preview" | null>(null);
  const [record, setRecord] = useState<DrawerRecord | null>(null);
  const stats = [
    { label: "Page Views", value: page.views.toLocaleString(), color: C.blue },
    { label: "Payments", value: page.payments.toLocaleString(), color: C.green },
    { label: "Conversion", value: `${((page.payments / Math.max(page.views, 1)) * 100).toFixed(1)}%`, color: "#7c3aed" },
    { label: "Revenue", value: page.revenue, color: C.amber },
  ];

  // Full builder state for this page — drives both the rail preview and the modal.
  const previewData: WizardData = pageToWizardData(page);

  // Submissions for this page, with table columns generated from the page's
  // own form fields. Pages created in-session have no records yet.
  const submissions: Submission[] = PAGE_SUBMISSIONS[page.id] ?? [];
  const fieldLabels = previewData.customerFields.map(f => f.label);
  const openSubmission = (sub: Submission) => setRecord(submissionToRecord(sub, page, fieldLabels));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "20px 32px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Payment Pages
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{page.title}</h1>
              <StatusBadge status={page.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href={`https://pay.enkash.in/${page.slug}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: C.blue, textDecoration: "none", fontWeight: 500 }}>
                pay.enkash.in/{page.slug} ↗
              </a>
              <span style={{ width: 1, height: 14, background: C.border }} />
              <span style={{ fontSize: 12, color: C.textFaint, fontFamily: "monospace" }}>{page.id}</span>
              {page.expires && <span style={{ fontSize: 12, color: C.amber }}>Expires {page.expires}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setActiveModal("qr")}>QR Code</Btn>
            <Btn variant="ghost" onClick={() => setActiveModal("share")}>Share</Btn>
            <Btn variant="secondary" onClick={() => onEdit(page)}>Edit Page</Btn>
            <Btn variant="primary" onClick={() => setTab("submissions")}>View Submissions</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 22 }}>
          {([
            { key: "overview" as const, label: "Overview" },
            { key: "submissions" as const, label: "Submissions" },
          ]).map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: "none", border: "none", padding: "0 2px 11px", cursor: "pointer", fontFamily: "inherit",
                fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? C.blue : C.textMuted,
                borderBottom: `2px solid ${active ? C.blue : "transparent"}`, display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                {t.key === "submissions" && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: active ? C.blueLight : C.bg, color: active ? C.blueDark : C.textMuted, borderRadius: radius.full, padding: "1px 8px" }}>
                    {Math.max(page.payments, submissions.length).toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: "24px 32px", display: "flex", gap: 24 }}>
        {/* Left: per-tab content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "submissions" ? (
            <SubmissionsTab page={page} fieldLabels={fieldLabels} submissions={submissions} onOpen={openSubmission} />
          ) : (
          <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Recent submissions */}
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Recent Submissions</p>
              <button onClick={() => setTab("submissions")}
                style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                View all →
              </button>
            </div>
            {submissions.length === 0 ? (
              <p style={{ padding: "22px 18px", fontSize: 13, color: C.textMuted, margin: 0, textAlign: "center" }}>
                No submissions yet — they appear here once customers start paying.
              </p>
            ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Customer", "Amount", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "9px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 3).map(sub => (
                  <tr key={sub.id} onClick={() => openSubmission(sub)} style={{ borderTop: `1px solid ${C.borderLight}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "11px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 1px" }}>{sub.responses["Full Name"] || sub.responses[fieldLabels[0]] || "—"}</p>
                      <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{sub.responses["Email Address"] || sub.id}</p>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{sub.amount}</td>
                    <td style={{ padding: "11px 16px" }}><StatusBadge status={sub.status} /></td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: C.textFaint }}>{sub.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          </>
          )}
        </div>

        {/* Right: live preview */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", position: "sticky", top: 20 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <button onClick={() => setActiveModal("preview")}
                style={{ fontSize: 11, color: C.blue, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Open <Icon name="expand" size={12} />
              </button>
            </div>
            <div style={{ maxHeight: 520, overflow: "auto", background: "#e9ecf3", padding: "12px" }}>
              <PagePreview data={previewData} device="mobile" />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "qr" && <QRModal page={page} onClose={() => setActiveModal(null)} />}
      {activeModal === "share" && <ShareModal page={page} onClose={() => setActiveModal(null)} />}
      {activeModal === "preview" && <PreviewModal page={page} data={previewData} onClose={() => setActiveModal(null)} />}
      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
