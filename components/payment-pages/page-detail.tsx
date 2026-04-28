"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { Modal, StatusBadge, Btn, Inp, Textarea, Toggle, InfoBanner, SegmentedControl } from "./primitives";
import { PaymentPage } from "./mock-data";
import { TRANSACTIONS } from "./mock-data";
import { PagePreview } from "./page-preview";
import { WizardData, DEFAULT_WIZARD, PageType as WizardPageType } from "./wizard-steps";

function pageTypeToWizard(t: string): WizardPageType {
  const m = t.toLowerCase();
  if (m === "donation") return "donation";
  if (m === "event") return "event";
  if (m === "invoice") return "invoice";
  return "standard";
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

  const shareLinks = [
    { name: "WhatsApp", color: "#25d366", icon: "💬", url: `https://wa.me/?text=Hi, please make your payment here: ${url}` },
    { name: "Email", color: "#ea4335", icon: "📧", url: `mailto:?subject=Payment Request&body=Please complete your payment here: ${url}` },
    { name: "X (Twitter)", color: "#000000", icon: "𝕏", url: `https://twitter.com/intent/tweet?text=Make your payment here: ${url}` },
    { name: "Facebook", color: "#1877f2", icon: "f", url: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
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
                  <div style={{ width: 32, height: 32, borderRadius: radius.sm, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                    {s.icon}
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

// ── Transactions Modal ─────────────────────────────────────────────────────────
function TransactionsModal({ page, onClose }: { page: PaymentPage; onClose: () => void }) {
  return (
    <Modal title="Transactions" subtitle={`${page.title} · ${TRANSACTIONS.length} records`} onClose={onClose} width={680} noPad>
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: C.greenBg, color: C.green, borderRadius: radius.full, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>• Active</span>
          </div>
          <button style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: "none", borderRadius: radius.sm, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>⬇ Export CSV</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Transaction ID", "Customer", "Amount", "Status", "Date", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map(txn => (
              <tr key={txn.id} style={{ borderTop: `1px solid ${C.borderLight}` }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>{txn.id}</td>
                <td style={{ padding: "12px 16px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 2px" }}>{txn.customer}</p>
                  <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{txn.email}</p>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{txn.amount}</td>
                <td style={{ padding: "12px 16px" }}><StatusBadge status={txn.status} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: C.textFaint }}>{txn.date}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ── Edit Page Modal ────────────────────────────────────────────────────────────
function EditPageModal({ page, onClose, onSave }: { page: PaymentPage; onClose: () => void; onSave: (p: PaymentPage) => void }) {
  const [form, setForm] = useState({
    title: page.title,
    brandColor: page.brandColor,
    buttonLabel: page.buttonLabel,
    status: page.status,
    theme: page.theme,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      onSave({ ...page, ...form });
      onClose();
    }, 800);
  };

  return (
    <Modal title="Edit Payment Page" subtitle={page.id} onClose={onClose} width={580}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.lg, padding: "14px", marginBottom: 22 }}>
        <p style={{ fontSize: 11, color: C.textFaint, margin: "0 0 8px", textAlign: "center" }}>Live preview</p>
        <div style={{ maxHeight: 280, overflow: "hidden", borderRadius: radius.md, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 280 }}>
            <PagePreview
              device="mobile"
              data={{
                ...DEFAULT_WIZARD,
                title: form.title,
                description: page.description ?? "",
                brandColor: form.brandColor,
                buttonLabel: form.buttonLabel,
                theme: form.theme,
                layout: page.layout,
                amountType: page.amountType,
                fixedAmount: page.amountType === "fixed" ? page.amount.replace(/[^0-9.]/g, "") : "",
                pageType: pageTypeToWizard(page.type),
                merchantName: "EnKash Demo",
              }}
            />
          </div>
        </div>
      </div>

      <Inp label="Page Title" required value={form.title} onChange={v => setForm({ ...form, title: v })} />

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Brand Colour</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="color" value={form.brandColor} onChange={e => setForm({ ...form, brandColor: e.target.value })}
            style={{ width: 44, height: 38, border: `1.5px solid ${C.border}`, borderRadius: radius.md, cursor: "pointer", padding: 3 }} />
          <code style={{ fontSize: 12, color: C.textMuted, background: C.bg, padding: "5px 10px", borderRadius: radius.sm }}>{form.brandColor}</code>
          <button onClick={() => setForm({ ...form, brandColor: "#1c5af4" })}
            style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.sm, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>
            Reset to EnKash Blue
          </button>
        </div>
      </div>

      <Inp label="Button Label" value={form.buttonLabel} onChange={v => setForm({ ...form, buttonLabel: v })} placeholder="Pay Now" />

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Status</label>
        <div style={{ display: "flex", gap: 10 }}>
          {(["Active", "Inactive"] as const).map(s => (
            <button key={s} onClick={() => setForm({ ...form, status: s })}
              style={{
                flex: 1, padding: "9px", border: `2px solid ${form.status === s ? (s === "Active" ? C.green : C.red) : C.border}`,
                borderRadius: radius.md, background: form.status === s ? (s === "Active" ? C.greenBg : C.redBg) : C.white,
                color: form.status === s ? (s === "Active" ? C.green : C.red) : C.textMuted,
                fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.15s",
              }}>
              {s === "Active" ? "✓ Active" : "✕ Inactive"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} variant="primary">
          {saved ? "✓ Saved!" : "Save Changes"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Page Detail View ───────────────────────────────────────────────────────────
export function PageDetailView({ page: initialPage, onBack }: { page: PaymentPage; onBack: () => void }) {
  const [page, setPage] = useState(initialPage);
  const [activeModal, setActiveModal] = useState<"qr" | "share" | "transactions" | "edit" | null>(null);
  const stats = [
    { label: "Page Views", value: page.views.toLocaleString(), color: C.blue },
    { label: "Payments", value: page.payments.toLocaleString(), color: C.green },
    { label: "Conversion", value: `${((page.payments / Math.max(page.views, 1)) * 100).toFixed(1)}%`, color: "#7c3aed" },
    { label: "Revenue", value: page.revenue, color: C.amber },
  ];

  const previewData: WizardData = {
    ...DEFAULT_WIZARD,
    pageType: pageTypeToWizard(page.type),
    merchantName: "EnKash Demo",
    title: page.title,
    description: page.description ?? "",
    brandColor: page.brandColor,
    buttonLabel: page.buttonLabel,
    theme: page.theme,
    layout: page.layout,
    amountType: page.amountType,
    fixedAmount: page.amountType === "fixed" ? page.amount.replace(/[^0-9.]/g, "") : "",
  };

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
            <Btn variant="secondary" onClick={() => setActiveModal("edit")}>Edit Page</Btn>
            <Btn variant="primary" onClick={() => setActiveModal("transactions")}>View Transactions</Btn>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "24px 32px", display: "flex", gap: 24 }}>
        {/* Left: stats + transactions preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Recent Transactions</p>
              <button onClick={() => setActiveModal("transactions")}
                style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                View all →
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {["Customer", "Amount", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "9px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.slice(0, 3).map(txn => (
                  <tr key={txn.id} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: "11px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 1px" }}>{txn.customer}</p>
                      <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{txn.email}</p>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{txn.amount}</td>
                    <td style={{ padding: "11px 16px" }}><StatusBadge status={txn.status} /></td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: C.textFaint }}>{txn.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
            {[
              { icon: "📨", title: "Receipt Configuration", desc: "Configure automatic email receipts sent after payment", action: () => {} },
              { icon: "↪️", title: "Redirect & Webhook", desc: "Set post-payment redirect URL and webhook endpoint", action: () => {} },
            ].map(c => (
              <div key={c.title} onClick={c.action} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", display: "flex", gap: 14, alignItems: "flex-start" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.blue; (e.currentTarget as HTMLDivElement).style.boxShadow = shadow.md; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 3px" }}>{c.title}</p>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: live preview */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", position: "sticky", top: 20 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</p>
              <a href={`https://pay.enkash.in/${page.slug}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: C.blue, fontWeight: 600, textDecoration: "none" }}>
                Open ↗
              </a>
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
      {activeModal === "transactions" && <TransactionsModal page={page} onClose={() => setActiveModal(null)} />}
      {activeModal === "edit" && <EditPageModal page={page} onClose={() => setActiveModal(null)} onSave={updated => { setPage(updated); setActiveModal(null); }} />}
    </div>
  );
}
