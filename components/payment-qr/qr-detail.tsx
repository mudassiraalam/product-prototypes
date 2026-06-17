"use client";
import { useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, txnsForQr, successRateForQr, upiString, downloadQrPng } from "./qr-mock-data";
import { qrToWizardData } from "./qr-mappers";
import { QrPreview, CollectMode } from "./qr-preview";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, padding: "14px 16px", flex: 1, minWidth: 120 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{value}</p>
    </div>
  );
}

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

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px", background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <button onClick={onBack} style={{ fontSize: 13, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to all QR</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{qr.label}</h1>
            <StatusBadge status={qr.status} />
            {viaApi && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.full, padding: "3px 10px", whiteSpace: "nowrap" }}>via API</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "5px 0 0" }}>
            {qr.location} · created {qr.created} · ref <span style={{ fontFamily: "monospace" }}>{qr.reference}</span>
          </p>
        </div>
        {immutable ? (
          <p style={{ fontSize: 12.5, color: C.textMuted, margin: 0, maxWidth: 280, textAlign: "right", lineHeight: 1.5 }}>
            {viaApi
              ? "Minted by your system via the QR APIs — its collect screen inherits your account branding defaults. Not editable here."
              : "A one-time QR is locked once generated — its amount and validity can't change after it's been shown or shared."}
          </p>
        ) : (
          <Btn variant="secondary" onClick={() => onEdit(qr)}><Icon name="edit" size={14} /> Edit QR</Btn>
        )}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ background: "#e9ecf3", borderRadius: radius.xl, padding: "30px 26px", flexShrink: 0 }}>
          <QrPreview data={data} device={device} collectMode={collectMode} surface="monitor" />
          {qr.usage === "reusable" && (
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center" }}>
              <Btn variant="secondary" size="sm" onClick={() => downloadQrPng(link, qr.label)}><Icon name="download" size={14} /> PNG</Btn>
              <Btn variant="ghost" size="sm" onClick={copy}><Icon name="copy" size={14} /> {copied ? "Copied!" : "Copy UPI link"}</Btn>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <Stat label="Payments" value={qr.payments.toLocaleString("en-IN")} />
            <Stat label="Collected" value={qr.revenue} />
            <Stat label="Success rate" value={rate === null ? "—" : `${rate}%`} />
            <Stat label="Type" value={usageLabel} />
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Payments at this QR</p>
              <span style={{ fontSize: 11.5, color: C.textFaint }}>matched by ref {qr.reference}</span>
            </div>
            {txns.length === 0 && (
              <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: "18px" }}>No payments at this QR yet.</p>
            )}
            {txns.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderBottom: i < txns.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13 }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary }}>{t.payerVpa}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}>UTR {t.utr}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 11.5, color: C.textMuted, whiteSpace: "nowrap" }}>{t.time}</span>
                  <span style={{ fontWeight: 700, color: C.text, minWidth: 56, textAlign: "right" }}>{t.amount}</span>
                  <StatusBadge status={t.status} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
