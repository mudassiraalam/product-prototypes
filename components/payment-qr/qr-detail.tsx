"use client";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge } from "@/components/payment-pages/primitives";
import { QrCode, QR_TRANSACTIONS } from "./qr-mock-data";
import { qrToWizardData } from "./qr-mappers";
import { Standee } from "./qr-preview";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "14px 16px", flex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{value}</p>
    </div>
  );
}

export function QrDetailView({ qr, onBack, onEdit }: {
  qr: QrCode; onBack: () => void; onEdit: (qr: QrCode) => void;
}) {
  const data = qrToWizardData(qr);
  const conv = qr.scans > 0 ? Math.round((qr.collections / qr.scans) * 100) : 0;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 30px", background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <button onClick={onBack} style={{ fontSize: 13, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to all QR</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{qr.label}</h1>
            <StatusBadge status={qr.status} />
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "5px 0 0" }}>{qr.location} · created {qr.created}</p>
        </div>
        <Btn variant="secondary" onClick={() => onEdit(qr)}>Edit QR</Btn>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* left: standee */}
        <div style={{ background: "#e9ecf3", borderRadius: radius.xl, padding: "30px 26px", flexShrink: 0 }}>
          <Standee data={data} />
          <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center" }}>
            <Btn variant="secondary" size="sm"><Icon name="download" size={14} /> PNG</Btn>
            <Btn variant="ghost" size="sm"><Icon name="copy" size={14} /> Copy UPI link</Btn>
          </div>
        </div>

        {/* right: stats + txns */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <Stat label="Scans" value={qr.scans.toLocaleString("en-IN")} />
            <Stat label="Collected" value={qr.collections.toLocaleString("en-IN")} />
            <Stat label="Scan → Pay" value={`${conv}%`} />
            <Stat label="Revenue" value={qr.revenue} />
          </div>

          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>Payments at this QR</p>
            {QR_TRANSACTIONS.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < QR_TRANSACTIONS.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: C.textFaint, background: C.bg, padding: "2px 8px", borderRadius: radius.sm }}>{t.app}</span>
                  <span style={{ color: C.textSecondary }}>{t.customer}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontWeight: 700, color: C.text }}>{t.amount}</span>
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
