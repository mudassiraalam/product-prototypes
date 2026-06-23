"use client";
import { useMemo, useState } from "react";
import { C, radius } from "@/components/payment-pages/tokens";
import { Icon, EnkashLogo } from "@/components/payment-pages/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  UpiCheckout, MethodInput, BuyerField, hexAlpha,
} from "@/components/payment-pages/page-preview";
import { ALL_PAYMENT_METHODS, getSymbol, type PaymentMethod } from "@/components/payment-pages/wizard-steps";
import { OneTimeCollect } from "@/components/payment-qr/qr-preview";
import { DEFAULT_QR, type QrData } from "@/components/payment-qr/qr-wizard-steps";
import { PRIMARY_VPA, upiString, genQrRef } from "@/components/payment-qr/qr-mock-data";
import type { ButtonData } from "./button-wizard-steps";

// ──────────────────────────────────────────────────────────────────────────────
// Payment Button — the two CUSTOMER-facing surfaces.
//
//   EmbeddedButton  the branded button as it renders on the merchant's own site
//                   (label + colour + style come from the builder).
//   ButtonCheckout  the EnKash checkout that opens when the button is clicked.
//
// The checkout is composed from the SAME atoms the Payment Pages checkout uses
// (UpiCheckout, MethodInput, BuyerField, OneTimeCollect) so the payer sees one
// consistent EnKash checkout across every product — no parallel implementation.
//
// [VERIFY with Pallav / PG team: does EnKash's PG expose an embeddable in-page
//  checkout (modelled here as a modal), or only a hosted-redirect checkout? If
//  redirect-only, the click would open a hosted EnKash page instead of this
//  modal — the configuration captured here is identical either way.]
// ──────────────────────────────────────────────────────────────────────────────

const num = (s: string) => { const n = parseFloat((s || "").replace(/[^\d.]/g, "")); return isNaN(n) ? 0 : n; };
const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function onBrandColor(hex: string) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#0f172a" : "#ffffff";
}

// ── The button itself ─────────────────────────────────────────────────────────
export function EmbeddedButton({
  data, onClick, block, size = "md",
}: { data: ButtonData; onClick?: () => void; block?: boolean; size?: "sm" | "md" }) {
  const [hover, setHover] = useState(false);
  const label = data.buttonLabel || "Pay Now";
  const solid = data.buttonStyle === "solid";
  const onColor = onBrandColor(data.brandColor);
  const pad = size === "sm" ? "9px 18px" : "12px 26px";
  const fontSize = size === "sm" ? 13 : 15;

  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: pad, borderRadius: radius.md, fontSize, fontWeight: 700, fontFamily: "inherit",
    cursor: "pointer", transition: "all 0.15s", width: block ? "100%" : undefined, letterSpacing: "0.01em",
  };
  const style: React.CSSProperties = solid
    ? { ...base, background: data.brandColor, color: onColor, border: "none", boxShadow: hover ? `0 8px 20px ${hexAlpha(data.brandColor, 0.34)}` : `0 4px 12px ${hexAlpha(data.brandColor, 0.24)}` }
    : { ...base, background: hover ? hexAlpha(data.brandColor, 0.07) : "transparent", color: data.brandColor, border: `2px solid ${data.brandColor}` };

  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={style}>
      <Icon name="lock" size={size === "sm" ? 12 : 13} />
      {label}
    </button>
  );
}

// ── A faux merchant website, so the button is shown IN CONTEXT (not floating) ──
export function MerchantSiteMock({ data, onPay }: { data: ButtonData; onPay: () => void }) {
  return (
    <div style={{ width: 340, background: C.white, borderRadius: radius.lg, border: `1px solid ${C.border}`, boxShadow: "0 10px 30px rgba(15,23,42,0.10)", overflow: "hidden" }}>
      {/* fake browser chrome */}
      <div style={{ height: 34, background: "#f1f3f7", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, padding: "0 12px" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 10, flex: 1, height: 16, borderRadius: 5, background: C.white, border: `1px solid ${C.border}`, fontSize: 9.5, color: C.textFaint, display: "flex", alignItems: "center", padding: "0 8px" }}>your-website.com</span>
      </div>
      {/* fake page content */}
      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{ width: 96, height: 9, borderRadius: 4, background: "#e6e9f0", marginBottom: 12 }} />
        <div style={{ width: "100%", height: 7, borderRadius: 4, background: "#eef1f7", marginBottom: 7 }} />
        <div style={{ width: "82%", height: 7, borderRadius: 4, background: "#eef1f7", marginBottom: 7 }} />
        <div style={{ width: "68%", height: 7, borderRadius: 4, background: "#eef1f7", marginBottom: 20 }} />
        <EmbeddedButton data={data} onClick={onPay} />
        <p style={{ fontSize: 10.5, color: C.textFaint, margin: "12px 0 0" }}>This is your page — the EnKash button drops in anywhere you paste the snippet.</p>
      </div>
    </div>
  );
}

// ── The checkout that opens on click ────────────────────────────────────────
type Phase = "details" | "pay" | "done";

function CheckoutHeader({ data, total }: { data: ButtonData; total: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: C.blue, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{(data.merchantName || "E").charAt(0)}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.merchantName || "EnKash Demo"}</p>
        <p style={{ fontSize: 11, color: C.textMuted, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.title || "Payment"}</p>
      </div>
      <span style={{ fontSize: 20, fontWeight: 800, color: C.text, flexShrink: 0 }}>{total}</span>
    </div>
  );
}

function TrustRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
      {["256-bit SSL", "PCI DSS", "RBI-authorised Payment Aggregator"].map(b => (
        <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: C.textMuted, fontWeight: 600 }}>
          <span style={{ color: C.green, fontSize: 11 }}>✓</span>{b}
        </span>
      ))}
    </div>
  );
}

export function ButtonCheckout({ data, onClose }: { data: ButtonData; onClose: () => void }) {
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  const sym = getSymbol();

  const methods = ALL_PAYMENT_METHODS.filter(m => data.paymentMethods.includes(m.key)).map(m => m.key);
  const presets = data.presetAmounts.filter(p => num(p) > 0);

  const [chosenAmount, setChosenAmount] = useState<string>(data.amountMode === "fixed" ? data.fixedAmount : "");
  const amountValue = data.amountMode === "fixed" ? num(data.fixedAmount) : num(chosenAmount);
  const total = amountValue > 0 ? inr(amountValue) : `${sym}—`;

  const needsAmount = data.amountMode === "customer";
  const hasDetails = needsAmount || data.fields.length > 0;
  const [phase, setPhase] = useState<Phase>(hasDetails ? "details" : "pay");

  const [activeMethod, setActiveMethod] = useState<PaymentMethod>(methods[0] ?? "upi");
  const [upiApp, setUpiApp] = useState("gpay");
  const [redirecting, setRedirecting] = useState(false);
  const [intentRef] = useState(() => genQrRef());

  const canContinue = !needsAmount || amountValue > 0;
  const canPayUpi = amountValue > 0;

  const checkoutQr: QrData = {
    ...DEFAULT_QR,
    merchantName: data.merchantName,
    vpa: PRIMARY_VPA,
    label: data.title,
    usage: "onetime",
    oneTimeAmountMode: "fixed",
    oneTimeAmount: amountValue > 0 ? String(amountValue) : "",
    screenTheme: "light",
  };
  const upiLink = upiString({ vpa: PRIMARY_VPA, name: data.merchantName, amount: amountValue > 0 ? String(amountValue) : undefined, ref: intentRef });

  const fireMobileIntent = () => { setRedirecting(true); try { window.location.href = upiLink; } catch { /* */ } };

  const fieldDefs = data.fields.map(f => ({ type: f.type, label: f.label || "Field", optional: f.optional }));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: 420, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", background: "#ffffff", borderRadius: 18, boxShadow: "0 24px 60px rgba(15,23,42,0.32)", padding: 20 }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "#f1f3f7", border: "none", cursor: "pointer", fontSize: 13, color: C.textSecondary, lineHeight: 1, fontFamily: "inherit" }}>✕</button>

        {phase !== "done" && <CheckoutHeader data={data} total={total} />}

        {/* ── Phase 1: customer details (amount + configured fields) ── */}
        {phase === "details" && (
          <div style={{ marginTop: 16 }}>
            {needsAmount && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Amount<span style={{ color: C.red, marginLeft: 3 }}>*</span>
                </label>
                <div style={{ display: "flex", alignItems: "stretch", border: `1px solid #e3e7ee`, borderRadius: radius.sm, overflow: "hidden", background: "#fff", marginBottom: presets.length ? 10 : 0 }}>
                  <span style={{ padding: "12px 13px", background: "#f1f3f7", fontSize: 13, fontWeight: 700, color: C.textMuted, borderRight: `1px solid #e3e7ee` }}>{sym}</span>
                  <input inputMode="decimal" value={chosenAmount} onChange={e => setChosenAmount(e.target.value)} placeholder="Enter amount" style={{ flex: 1, border: "none", outline: "none", padding: "12px 13px", fontSize: 14, fontFamily: "inherit", minWidth: 0 }} />
                </div>
                {presets.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {presets.map((p, i) => {
                      const on = num(chosenAmount) === num(p);
                      return (
                        <button key={i} onClick={() => setChosenAmount(String(num(p)))} style={{ padding: "7px 14px", borderRadius: radius.full, border: `1.5px solid ${on ? C.blue : "#e3e7ee"}`, background: on ? C.blueLight : "#fff", color: on ? C.blueDark : C.textSecondary, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          {inr(num(p))}
                        </button>
                      );
                    })}
                  </div>
                )}
                {(num(data.minAmount) > 0 || num(data.maxAmount) > 0) && (
                  <p style={{ fontSize: 11, color: C.textFaint, margin: "8px 0 0" }}>
                    {num(data.minAmount) > 0 && `Min ${inr(num(data.minAmount))}`}
                    {num(data.minAmount) > 0 && num(data.maxAmount) > 0 && " · "}
                    {num(data.maxAmount) > 0 && `Max ${inr(num(data.maxAmount))}`}
                  </p>
                )}
              </div>
            )}

            {fieldDefs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
                {fieldDefs.map((f, i) => (
                  <BuyerField key={i} field={f} symbol={sym}
                    text={C.text} textMuted={C.textMuted} textFaint={C.textFaint}
                    fieldSurface="#ffffff" fieldBorder="#e3e7ee" subtleBg="#f1f3f7" />
                ))}
              </div>
            )}

            <button onClick={() => canContinue && setPhase("pay")} disabled={!canContinue}
              style={{ width: "100%", marginTop: 16, padding: "13px", background: canContinue ? C.blue : C.blueLight, color: canContinue ? "#fff" : C.textFaint, border: "none", borderRadius: radius.md, fontSize: 15, fontWeight: 700, cursor: canContinue ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              Continue {total !== `${sym}—` ? `· ${total}` : ""}
            </button>
            <TrustRow />
          </div>
        )}

        {/* ── Phase 2: payment methods ── */}
        {phase === "pay" && (
          <div style={{ marginTop: 16 }}>
            {hasDetails && (
              <button onClick={() => setPhase("details")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: 0, marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>‹ Edit details</button>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {ALL_PAYMENT_METHODS.filter(m => methods.includes(m.key)).map(m => {
                const selected = activeMethod === m.key;
                return (
                  <button key={m.key} onClick={() => { setActiveMethod(m.key); setRedirecting(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: `1.5px solid ${selected ? C.blue : "#e3e7ee"}`, background: selected ? C.blueLight : "#f7f8fa", color: selected ? C.blue : C.text, borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {selected && <span style={{ width: 14, height: 14, borderRadius: "50%", background: C.blue, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>✓</span>}
                    {m.label}
                  </button>
                );
              })}
            </div>

            {activeMethod === "upi" ? (
              isDesktop ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <OneTimeCollect data={{ ...checkoutQr, screenTheme: "light" }} mode="live" showCaption={false} surface="payer" />
                </div>
              ) : (
                <>
                  <UpiCheckout isDesktop={false} canPay={canPayUpi} onOpen={() => {}}
                    upiApp={upiApp} setUpiApp={setUpiApp} redirecting={redirecting}
                    upiLink={upiLink} qrPreviewValue={upiLink}
                    brand={C.blue} text={C.text} textMuted={C.textMuted} textFaint={C.textMuted}
                    fieldSurface="#ffffff" fieldBorder="#e3e7ee" subtleBg="#f1f3f7" compact={false} dark={false} />
                  {!redirecting && (
                    <button onClick={fireMobileIntent} style={{ width: "100%", marginTop: 12, padding: "13px", background: C.blue, color: "#fff", border: "none", borderRadius: radius.md, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Pay {total}</button>
                  )}
                </>
              )
            ) : (
              <>
                <MethodInput method={activeMethod} brand={C.blue}
                  text={C.text} textMuted={C.textMuted} textFaint={C.textMuted}
                  fieldSurface="#ffffff" fieldBorder="#e3e7ee" subtleBg="#f1f3f7" compact={false} />
                <button onClick={() => setPhase("done")} style={{ width: "100%", marginTop: 16, padding: "13px", background: C.blue, color: "#fff", border: "none", borderRadius: radius.md, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Pay {total}</button>
              </>
            )}
            <TrustRow />
          </div>
        )}

        {/* ── Phase 3: success ── */}
        {phase === "done" && (
          <div style={{ padding: "16px 4px 8px", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.greenBg, display: "grid", placeItems: "center", margin: "8px auto 16px" }}>
              <Icon name="checkCircle" size={34} color={C.green} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Payment successful</h3>
            <p style={{ fontSize: 13.5, color: C.textMuted, margin: "0 0 6px", lineHeight: 1.6 }}>
              {data.successMessage?.trim() || `Your payment of ${total} to ${data.merchantName} is confirmed.`}
            </p>
            <p style={{ fontSize: 11.5, color: C.textFaint, margin: "10px 0 18px" }}>This is a demo — no real payment was made.</p>
            <button onClick={onClose} style={{ padding: "11px 26px", background: C.blue, color: "#fff", border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center", opacity: 0.8 }}><EnkashLogo variant="wordmark" height={16} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
