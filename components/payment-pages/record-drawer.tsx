"use client";
import { useState } from "react";
import { C, radius } from "./tokens";
import { Drawer, StatusBadge } from "./primitives";
import { Icon } from "./icons";

// ──────────────────────────────────────────────────────────────────────────────
// Single-payment / single-submission detail, shown as a right slide-over.
// Shared by Payment Pages (a form submission) and Payment QR (a UPI payment) so
// the record view looks identical across products. The blue "source" pill is the
// linkage tag — it names the page/QR the payment came through and its reference.
// ──────────────────────────────────────────────────────────────────────────────
export type DrawerRecord = {
  id: string;                                   // payment id / UTR
  amount: string;
  status: string;                               // Success / Failed / Refunded
  date: string;
  source: { kind: "page" | "qr" | "button"; name: string; ref: string };
  party: { label: string; value: string }[];   // customer / payer details
  details: { label: string; value: string }[]; // method / date / settlement …
  responses?: { label: string; value: string }[]; // page form responses (pages only)
};

function SourcePill({ source }: { source: DrawerRecord["source"] }) {
  const iconName = source.kind === "page" ? "page" : source.kind === "qr" ? "qr" : "button";
  const label = source.kind === "page" ? "Payment page" : source.kind === "qr" ? "Payment QR" : "Payment button";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.md, padding: "6px 11px", maxWidth: "100%" }}>
      <span style={{ color: C.blue, display: "inline-flex", flexShrink: 0 }}><Icon name={iconName} size={15} /></span>
      <span style={{ fontSize: 12, color: C.blueDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label} · {source.name}
      </span>
      <span style={{ fontSize: 11, color: C.blueDark, fontFamily: "monospace", opacity: 0.7, flexShrink: 0 }}>{source.ref}</span>
    </div>
  );
}

function FieldGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {rows.map(r => (
        <div key={r.label}>
          <p style={{ fontSize: 11, color: C.textFaint, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.label}</p>
          <p style={{ fontSize: 13, color: C.text, margin: 0, wordBreak: "break-word" }}>{r.value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

export function RecordDrawer({ record, onClose }: { record: DrawerRecord; onClose: () => void }) {
  const tabs = [
    { key: "payment", label: "Payment" },
    ...(record.responses && record.responses.length ? [{ key: "responses", label: "Form responses" }] : []),
    { key: "refunds", label: "Refunds" },
  ];
  const [tab, setTab] = useState("payment");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(record.id); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  };

  return (
    <Drawer title="Payment details" subtitle={record.date} onClose={onClose} width={460}>
      {/* Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: "monospace", fontSize: 13, color: C.textSecondary }}>{record.id}</span>
        <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.textFaint, padding: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontFamily: "inherit" }}>
          {copied ? "✓ Copied" : <Icon name="copy" size={14} />}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{record.amount}</span>
        <StatusBadge status={record.status} />
      </div>

      {/* Linkage tag */}
      <div style={{ marginBottom: 18 }}><SourcePill source={record.source} /></div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 0 10px", fontSize: 13, fontWeight: active ? 700 : 600, color: active ? C.blue : C.textMuted, borderBottom: `2px solid ${active ? C.blue : "transparent"}`, marginBottom: -1 }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "payment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {record.party.length > 0 && <FieldGrid rows={record.party} />}
          {record.details.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 16 }}>
              <FieldGrid rows={record.details} />
            </div>
          )}
        </div>
      )}

      {tab === "responses" && record.responses && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: radius.md, overflow: "hidden" }}>
          {record.responses.map((r, i) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "10px 14px", borderTop: i ? `1px solid ${C.borderLight}` : "none" }}>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>{r.label}</span>
              <span style={{ fontSize: 13, color: C.text, textAlign: "right", wordBreak: "break-word" }}>{r.value || "—"}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "refunds" && (
        <div style={{ textAlign: "center", padding: "30px 16px", color: C.textMuted }}>
          <p style={{ fontSize: 13, margin: 0 }}>
            {record.status === "Refunded" ? "This payment was refunded in full." : "No refunds on this payment."}
          </p>
        </div>
      )}
    </Drawer>
  );
}
