"use client";
import { useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, txnsForQr, successRateForQr, upiString, downloadQrPng } from "./qr-mock-data";
import { qrToWizardData } from "./qr-mappers";
import { QrPreview, CollectMode } from "./qr-preview";
import { RecordDrawer, DrawerRecord } from "@/components/payment-pages/record-drawer";
import { FieldRow, EmptyTab } from "@/components/payment-pages/page-detail";

export function QrDetailView({ qr, onBack, onEdit }: { qr: QrCode; onBack: () => void; onEdit: (qr: QrCode) => void }) {
  const data = qrToWizardData(qr);
  const device = qr.usage === "onetime" ? ("collect" as const) : ("standee" as const);
  const viaApi = qr.origin === "api";
  // A one-time QR's card is history once it closes: collected (it was paid,
  // then closed) or expired (timer ran out unpaid). Only Active ones tick.
  const collectMode: CollectMode = qr.status === "Active" ? "live" : qr.payments > 0 ? "collected" : "expired";
  const immutable = viaApi || qr.usage === "onetime"; // published one-time QRs can't be edited
  // The link carries the SHARED settlement VPA plus THIS QR's unique reference —
  // the reference is what attributes every payment back to this specific code.
  const link = upiString({
    vpa: qr.vpa, name: qr.merchantName, ref: qr.reference,
    amount: qr.amountValue ? String(qr.amountValue) : undefined,
  });
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } };
  const usageLabel = qr.usage === "onetime" ? (viaApi ? "One-time · via API" : "One-time collect") : qr.amountMode === "fixed" ? "Reusable · fixed" : "Reusable · any amount";

  const txns = txnsForQr(qr.id);
  const rate = successRateForQr(qr.id);
  const [record, setRecord] = useState<DrawerRecord | null>(null);

  const txnRecord = (t: (typeof txns)[number]): DrawerRecord => ({
    id: t.utr,
    amount: t.amount,
    status: t.status,
    date: t.time,
    source: { kind: "qr", name: qr.label, ref: qr.reference },
    party: [{ label: "Payer VPA", value: t.payerVpa }],
    details: [{ label: "UTR", value: t.utr }, { label: "Time", value: t.time }],
  });

  const statusColor = qr.status === "Active" ? C.green : qr.status === "Draft" ? C.amber : qr.status === "Expired" ? C.red : C.textMuted;
  const amountDisplay = qr.amountValue ? `₹${qr.amountValue.toLocaleString("en-IN")}` : "Any amount";
  const [idCopied, setIdCopied] = useState(false);
  const copyId = () => { try { navigator.clipboard.writeText(qr.id); setIdCopied(true); setTimeout(() => setIdCopied(false), 1500); } catch { /* */ } };
  const [tab, setTab] = useState<"details" | "payments" | "refunds" | "settlements">("details");
  const TABS = [
    { key: "details", label: "QR details" },
    { key: "payments", label: "Payments" },
    { key: "refunds", label: "Refunds" },
    { key: "settlements", label: "Settlements" },
  ] as const;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
      {/* Header — back, detail card (status panel + QR ID + amount + field grid + actions), tabs */}
      <div style={{ padding: "22px 30px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ fontSize: 13, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to all QR</button>

        <div style={{ display: "flex", gap: 18, alignItems: "stretch", paddingBottom: 18 }}>
          <div style={{ width: 132, flexShrink: 0, background: statusColor + "14", borderRadius: radius.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "18px 10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{qr.status}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{qr.label}</h1>
                  <StatusBadge status={qr.status} />
                  {viaApi && <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.full, padding: "3px 10px", whiteSpace: "nowrap" }}>via API</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>QR ID</span>
                  <span style={{ fontSize: 12.5, fontFamily: "monospace", color: C.blue }}>{qr.id}</span>
                  <button onClick={copyId} title="Copy QR ID" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, display: "inline-flex", alignItems: "center" }}>
                    {idCopied ? <span style={{ color: C.green, fontSize: 13 }}>✓</span> : <Icon name="copy" size={13} />}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>Created on {qr.created}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 2 }}>Amount</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{amountDisplay}</div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.borderLight}`, margin: "14px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px 18px" }}>
              <FieldRow label="Reference" value={<span style={{ fontFamily: "monospace", color: C.text }}>{qr.reference}</span>} />
              <FieldRow label="Settles to" value={<span style={{ fontFamily: "monospace", color: C.text }}>{qr.vpa}</span>} />
              <FieldRow label="Type" value={usageLabel} />
              <FieldRow label="Location" value={qr.location} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
              {qr.usage === "reusable" && <Btn variant="ghost" size="sm" onClick={() => downloadQrPng(link, qr.label)}><Icon name="download" size={14} /> Download PNG</Btn>}
              {qr.usage === "reusable" && <Btn variant="ghost" size="sm" onClick={copy}><Icon name="copy" size={14} /> {copied ? "Copied!" : "Copy UPI link"}</Btn>}
              {immutable
                ? <span style={{ fontSize: 12, color: C.textFaint, maxWidth: 420, lineHeight: 1.5 }}>{viaApi ? "Minted via the QR APIs — not editable here." : "One-time QR — locked once generated."}</span>
                : <Btn variant="secondary" size="sm" onClick={() => onEdit(qr)}><Icon name="edit" size={14} /> Edit QR</Btn>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ background: "none", border: "none", padding: "0 2px 11px", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? C.blue : C.textMuted, borderBottom: `2px solid ${active ? C.blue : "transparent"}`, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t.label}
                {t.key === "payments" && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: active ? C.blueLight : C.bg, color: active ? C.blueDark : C.textMuted, borderRadius: radius.full, padding: "1px 8px" }}>
                    {qr.payments.toLocaleString("en-IN")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: "24px 30px" }}>
        {tab === "details" && (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ background: "#e9ecf3", borderRadius: radius.xl, padding: "30px 26px", flexShrink: 0 }}>
              <QrPreview data={data} device={device} collectMode={collectMode} surface="monitor" />
            </div>
            <div style={{ flex: 1, minWidth: 300, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>QR details</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 18 }}>
                <FieldRow label="Type" value={usageLabel} />
                <FieldRow label="Amount" value={amountDisplay} />
                <FieldRow label="Settles to" value={<span style={{ fontFamily: "monospace" }}>{qr.vpa}</span>} />
                <FieldRow label="Reference" value={<span style={{ fontFamily: "monospace" }}>{qr.reference}</span>} />
                <FieldRow label="Location" value={qr.location} />
                <FieldRow label="Payments" value={qr.payments.toLocaleString("en-IN")} />
                <FieldRow label="Collected" value={qr.revenue} />
                <FieldRow label="Success rate" value={rate === null ? "—" : `${rate}%`} />
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm, maxWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Payments at this QR</p>
              <span style={{ fontSize: 11.5, color: C.textFaint }}>matched by ref {qr.reference}</span>
            </div>
            {txns.length === 0 && (
              <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: "18px" }}>No payments at this QR yet.</p>
            )}
            {txns.map((t, i) => (
              <div key={t.id} onClick={() => setRecord(txnRecord(t))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderBottom: i < txns.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600 }}>{t.utr}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}>{t.payerVpa}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 11.5, color: C.textMuted, whiteSpace: "nowrap" }}>{t.time}</span>
                  <span style={{ fontWeight: 700, color: C.text, minWidth: 56, textAlign: "right" }}>{t.amount}</span>
                  <StatusBadge status={t.status} />
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "refunds" && <EmptyTab icon="refresh" title="No refunds yet" body="Refunds raised against payments at this QR will appear here." />}
        {tab === "settlements" && <EmptyTab icon="receipt" title="No settlements yet" body="Once payments are settled to your account, settlement records show up here." />}
      </div>

      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
