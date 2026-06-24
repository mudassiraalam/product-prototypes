"use client";
import React, { useState, useMemo } from "react";
import { C, radius, shadow } from "./tokens";
import { Icon, EnkashLogo } from "./icons";
import { adaptBrandColor, rgbString } from "./color-utils";
import type { WizardData, PaymentMethod } from "./wizard-steps";
import { getSymbol, ALL_PAYMENT_METHODS } from "./wizard-steps";
import { qrMatrix } from "../payment-qr/qr-encoder";
import type { Plan } from "../subscriptions/types";
import { MandateSummary } from "../subscriptions/mandate-summary";
import { OneTimeCollect, PoweredByUpi } from "../payment-qr/qr-preview";
import { DEFAULT_QR, type QrData } from "../payment-qr/qr-wizard-steps";
import { upiString, genQrRef } from "../payment-qr/qr-mock-data";

const FONT_MAP = {
  default: "var(--font-inter), 'Inter', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

function isDark(hex: string) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

export function hexAlpha(hex: string, alpha: number) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY
// ──────────────────────────────────────────────────────────────────────────────
export function PagePreview({
  data, device = "desktop",
}: {
  data: WizardData; device?: "desktop" | "mobile";
}) {
  // Live, interactive item quantities (multiple-items / tickets). Start at 0.
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const setQty = (i: number, delta: number, min = 0, max = Infinity) =>
    setQuantities(prev => {
      const next = Math.max(min, Math.min(max, (prev[i] ?? min) + delta));
      return { ...prev, [i]: next };
    });
  // Customer-set amount (chips + custom typing)
  const [chosenAmount, setChosenAmount] = useState<string>("");

  const systemDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = data.theme === "dark" || (data.theme === "system" && systemDark);
  const pageBg = dark ? "#0b1220" : "#f4f6fb";
  const cardBg = dark ? "#151f33" : "#ffffff";
  const subtleBg = dark ? "#1f2c45" : "#eef1f7";
  const panelBg = dark ? "#1a2540" : "#f7f7f9";  // soft gray-white (between header tint and gray)
  const headerBg = dark ? "#101a2e" : "#fafbfc"; // faint cool tint, distinct from white body
  const text = dark ? "#f1f5f9" : "#111827";
  const textMuted = dark ? "#94a3b8" : "#6b7280";
  const textFaint = dark ? "#64748b" : "#9ca3af";
  const border = dark ? "#1e2a44" : "#e5e7eb";
  const font = FONT_MAP[data.fontStyle];
  const onBrand = isDark(data.brandColor) ? "#ffffff" : "#0f172a";
  const btnRadius = data.buttonStyle === "pill" ? 999 : data.buttonStyle === "sharp" ? 4 : 10;
  const total = computeTotalLive(data, quantities, chosenAmount);

  if (device === "mobile") {
    return (
      <MobilePreview
        data={data} pageBg={pageBg} cardBg={cardBg} subtleBg={subtleBg}
        text={text} textMuted={textMuted} textFaint={textFaint} border={border}
        font={font} onBrand={onBrand} btnRadius={btnRadius} total={total}
        panelBg={panelBg} headerBg={headerBg} dark={dark}
        quantities={quantities} setQty={setQty} chosenAmount={chosenAmount} setChosenAmount={setChosenAmount}
      />
    );
  }

  return (
    <DesktopPreview
      data={data} pageBg={pageBg} cardBg={cardBg} subtleBg={subtleBg}
      text={text} textMuted={textMuted} textFaint={textFaint} border={border}
      font={font} onBrand={onBrand} btnRadius={btnRadius} total={total}
      panelBg={panelBg} headerBg={headerBg} dark={dark}
      quantities={quantities} setQty={setQty} chosenAmount={chosenAmount} setChosenAmount={setChosenAmount}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// DESKTOP — full webpage layout
// ──────────────────────────────────────────────────────────────────────────────
function DesktopPreview(p: PreviewProps) {
  const { data, pageBg, cardBg, subtleBg, text, textMuted, textFaint, border, font, onBrand, btnRadius, total } = p;
  const panelBg = p.panelBg ?? subtleBg;
  const headerBg = p.headerBg ?? cardBg;
  const maxW = data.layout === "wide" ? 940 : 820;
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div style={{ background: "#f4f6fb", width: "100%", minHeight: "100%", fontFamily: font, padding: "20px 16px 32px" }}>
      <div style={{ maxWidth: maxW, margin: "0 auto", background: pageBg, borderRadius: radius.lg, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {/* ── Optional banner masthead (full-width, only when uploaded) ── */}
        {data.coverImage && (
          <div style={{
            width: "100%", aspectRatio: "4 / 1",
            backgroundImage: `url(${data.coverImage})`,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
            borderBottom: `1px solid ${border}`,
          }} />
        )}

        {/* ── Clean header: logo + merchant name · Secured by EnKash ────── */}
        <div style={{
          background: headerBg,
          borderRadius: data.coverImage ? 0 : `${radius.lg}px ${radius.lg}px 0 0`,
          borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
          borderTop: data.coverImage ? "none" : `1px solid ${border}`,
          padding: "18px 28px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {data.showLogo && (
              <div style={{ width: 38, height: 38, background: (data as any).logoImage ? "#ffffff" : data.brandColor, color: onBrand, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, fontWeight: 800, overflow: "hidden", border: (data as any).logoImage ? `1px solid ${border}` : "none" }}>
                {(data as any).logoImage
                  ? <img src={(data as any).logoImage} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
                  : (data.merchantName || "E").slice(0, 1).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.merchantName || "Your Brand"}</span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
            <Icon name="lock" size={12} />
            Secured by
            <span style={{ fontWeight: 700, color: C.blue }}>EnKash</span>
          </span>
        </div>

        {/* ── Two column body ──────────────────────────────────────── */}
        <div style={{
          background: cardBg, borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
          borderTop: `1px solid ${border}`,
          display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0,
        }}>
          {/* LEFT: offer heading, full description, contact, social, gallery */}
          <div style={{ padding: "24px 28px", minWidth: 0 }}>
            {/* ── Offer heading (title lives here, reference-style) ── */}
            <div style={{ marginBottom: 22, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {data.productImage && data.amountType === "fixed" && (
                <div style={{ width: 56, height: 56, borderRadius: radius.sm, background: `url(${data.productImage}) center/cover`, border: `1px solid ${border}`, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 19, fontWeight: 700, color: text, margin: 0, lineHeight: 1.3, overflowWrap: "break-word", wordBreak: "break-word" }}>
                  {data.title || (
                    (data.amountType === "customer" && data.isDonation) ? "Your Cause Title"
                      : (data.amountType === "multiple" && data.itemsAreTickets) ? "Your Event Name"
                      : "Your Page Title"
                  )}
                </p>
                <div style={{ width: 30, height: 3, background: data.brandColor, margin: "10px 0 0" }} />
                {data.amountType === "customer" && data.isDonation && (
                  <p style={{ fontSize: 11, color: textMuted, margin: "10px 0 0" }}>Every contribution counts</p>
                )}
                {data.description && (
                  <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, margin: "12px 0 0", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{data.description}</p>
                )}
              </div>
            </div>

            {data.longDescription && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>About</p>
                <p style={{ fontSize: 13, color: text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{data.longDescription}</p>
              </div>
            )}

            {(data.amountType === "multiple" && data.itemsAreTickets) && (data.eventDate || data.eventVenue) && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Event Info</p>
                {data.eventDate && <InfoLine icon={<Icon name="calendar" size={13} />} text={`${formatDate(data.eventDate)}${data.eventTime ? ` · ${data.eventTime}` : ""}`} color={text} />}
                {data.eventVenue && <InfoLine icon={<Icon name="mapPin" size={13} />} text={data.eventVenue} color={text} />}
              </div>
            )}

            {(data.contactEmail || data.contactPhone || data.contactWhatsapp || data.contactWebsite) && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Contact Us</p>
                {data.contactEmail && <ContactLine icon={<Icon name="mail" size={13} />} label={data.contactEmail} color={text} brand={data.brandColor} />}
                {data.contactPhone && <ContactLine icon={<Icon name="phone" size={13} />} label={data.contactPhone} color={text} brand={data.brandColor} />}
                {data.contactWhatsapp && <ContactLine icon={<Icon name="whatsapp" size={13} />} label={data.contactWhatsapp} color={text} brand={data.brandColor} />}
                {data.contactWebsite && <ContactLine icon={<Icon name="globe" size={13} />} label={data.contactWebsite} color={text} brand={data.brandColor} link />}
                {data.supportLink && <ContactLine icon="?" label="Support Center" color={text} brand={data.brandColor} link />}
              </div>
            )}

            {(data.socialTwitter || data.socialInstagram || data.socialFacebook || data.socialLinkedin) && (
              <div style={{ marginBottom: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Follow Us</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {data.socialTwitter && <SocialIcon label="X" brand={data.brandColor} />}
                  {data.socialInstagram && <SocialIcon label="IG" brand={data.brandColor} />}
                  {data.socialFacebook && <SocialIcon label="FB" brand={data.brandColor} />}
                  {data.socialLinkedin && <SocialIcon label="IN" brand={data.brandColor} />}
                </div>
              </div>
            )}

            {/* Gallery images */}
            {(data as any).galleryImages?.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Gallery</p>
                <div style={{ display: "grid", gridTemplateColumns: (data as any).galleryImages.length === 1 ? "1fr" : "1fr 1fr", gap: 6 }}>
                  {(data as any).galleryImages.map((img: string, i: number) => (
                    <div key={i} onClick={() => setLightbox(img)} style={{ aspectRatio: "4/3", borderRadius: radius.sm, background: `${subtleBg} url(${img}) center/contain no-repeat`, border: `1px solid ${border}`, cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            )}

            {/* Terms */}
            {(data as any).termsText && (
              <div style={{ marginBottom: 6, paddingTop: 10, borderTop: `1px solid ${border}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Terms & Conditions</p>
                <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, margin: 0 }}>{(data as any).termsText}</p>
              </div>
            )}

            {!data.longDescription && !data.contactEmail && !data.contactPhone && !data.socialTwitter && !data.socialInstagram && !data.socialFacebook && !data.socialLinkedin && !(data as any).galleryImages?.length && (
              <div style={{ background: subtleBg, border: `1px dashed ${border}`, borderRadius: radius.md, padding: "20px 16px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", color: textMuted, display: "flex", justifyContent: "center" }}>
                  <Icon name={(data.amountType === "customer" && data.isDonation) ? "donation" : (data.amountType === "multiple" && data.itemsAreTickets) ? "ticket" : "bag"} size={26} />
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: textMuted, margin: "0 0 4px" }}>
                  {(data.amountType === "customer" && data.isDonation) ? "Add details about your cause" : (data.amountType === "multiple" && data.itemsAreTickets) ? "Tell customers about your event" : "Add info about your product or service"}
                </p>
                <p style={{ fontSize: 11, color: textFaint, margin: 0, lineHeight: 1.5 }}>
                  Fill these in Step 1 under <strong>Page Info</strong> — they'll appear here.
                </p>
              </div>
            )}

          </div>

          {/* divider */}
          <div style={{ background: border }} />

          {/* RIGHT: billing form — sticky so it stays in view as left content scrolls */}
          <div style={{ background: p.dark ? panelBg : cardBg, minWidth: 0 }}>
            <div style={{ position: "sticky", top: 16, padding: "24px 28px" }}>
              <BillingPanel
                data={data} device="desktop" text={text} textMuted={textMuted} textFaint={textFaint}
                border={border} subtleBg={subtleBg} onBrand={onBrand} btnRadius={btnRadius}
                total={total} quantities={p.quantities} setQty={p.setQty} dark={p.dark} chosenAmount={p.chosenAmount} setChosenAmount={p.setChosenAmount}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: cardBg, borderTop: `1px solid ${border}`,
          borderRadius: `0 0 ${radius.lg}px ${radius.lg}px`,
          padding: "14px 28px", textAlign: "center",
          border: `1px solid ${border}`, borderTopColor: border,
        }}>
          <p style={{ fontSize: 11, color: textFaint, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
            Powered by
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: text }}>
              <span style={{ width: 16, height: 16, background: "#fff", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}`, overflow: "hidden" }}>
                <EnkashLogo variant="mark" height={11} />
              </span>
              EnKash
            </span>
          </p>
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <img src={lightbox} alt="" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", borderRadius: radius.md }} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MOBILE — stacked single column
// ──────────────────────────────────────────────────────────────────────────────
function MobilePreview(p: PreviewProps) {
  const { data, pageBg, cardBg, subtleBg, text, textMuted, textFaint, border, font, onBrand, btnRadius, total } = p;
  const [tab, setTab] = React.useState<"info" | "pay">("info");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 700, textAlign: "center",
    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
    color: active ? data.brandColor : textMuted,
    borderBottom: active ? `2px solid ${data.brandColor}` : `2px solid transparent`,
    transition: "all 0.15s",
  });

  return (
    <div style={{ background: pageBg, width: "100%", minHeight: "100%", fontFamily: font, padding: "12px 10px" }}>
      <div style={{ background: cardBg, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${border}` }}>
        {/* Optional banner masthead — fit whole image, never cropped on mobile */}
        {data.coverImage && (
          <div style={{ width: "100%", background: subtleBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={data.coverImage} style={{ width: "100%", height: "auto", display: "block" }} alt="banner" />
          </div>
        )}

        {/* Clean header: logo + merchant name (no "Paying to") */}
        <div style={{ background: cardBg, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          {data.showLogo && (
            <div style={{ width: 30, height: 30, background: (data as any).logoImage ? "#ffffff" : data.brandColor, color: onBrand, borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, overflow: "hidden", flexShrink: 0, border: (data as any).logoImage ? `1px solid ${border}` : "none" }}>
              {(data as any).logoImage
                ? <img src={(data as any).logoImage} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
                : (data.merchantName || "E").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{data.merchantName || "Your Brand"}</span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>
          <button style={tabStyle(tab === "info")} onClick={() => setTab("info")}><Icon name="page" size={13} style={{ marginRight: 5 }} />Info</button>
          <button style={tabStyle(tab === "pay")} onClick={() => setTab("pay")}><Icon name="card" size={13} style={{ marginRight: 5 }} />Pay</button>
        </div>

        {/* Info tab */}
        {tab === "info" && (
          <div style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: text, margin: "0 0 6px" }}>{data.title || "Page Title"}</p>

            {data.longDescription && (
              <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{data.longDescription}</p>
            )}

            {(data as any).galleryImages?.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
                {(data as any).galleryImages.map((img: string, i: number) => (
                  <div key={i} style={{ aspectRatio: "4/3", borderRadius: radius.sm, background: `${subtleBg} url(${img}) center/contain no-repeat`, border: `1px solid ${border}` }} />
                ))}
              </div>
            )}

            {/* Event-specific info */}
            {(data.amountType === "multiple" && data.itemsAreTickets) && (data.eventDate || data.eventVenue) && (
              <div style={{ background: subtleBg, borderRadius: radius.sm, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
                {data.eventDate && <p style={{ margin: "0 0 4px", color: text, display: "flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={12} /> {data.eventDate}{data.eventTime ? ` at ${data.eventTime}` : ""}</p>}
                {data.eventVenue && <p style={{ margin: 0, color: text, display: "flex", alignItems: "center", gap: 6 }}><Icon name="mapPin" size={12} /> {data.eventVenue}</p>}
              </div>
            )}

            {(data.contactEmail || data.contactPhone) && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Contact</p>
                {data.contactEmail && <p style={{ fontSize: 12, color: text, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="mail" size={12} /> {data.contactEmail}</p>}
                {data.contactPhone && <p style={{ fontSize: 12, color: text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={12} /> {data.contactPhone}</p>}
              </div>
            )}

            {data.termsText && (
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, marginTop: 4 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Terms & Conditions</p>
                <p style={{ fontSize: 11, color: textMuted, lineHeight: 1.5, margin: 0 }}>{data.termsText}</p>
              </div>
            )}

            {!data.longDescription && !(data as any).galleryImages?.length && !data.contactEmail && !data.contactPhone && (
              <div style={{ textAlign: "center", padding: "20px 0", color: textFaint, fontSize: 12 }}>
                <p style={{ margin: "0 0 4px", display: "flex", justifyContent: "center" }}><Icon name="bag" size={22} /></p>
                <p style={{ margin: 0 }}>Fill in Step 1 to see your page info here</p>
              </div>
            )}

            <button onClick={() => setTab("pay")} style={{ width: "100%", marginTop: 16, padding: "11px", background: data.brandColor, color: onBrand, border: "none", borderRadius: btnRadius, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Continue to Payment →
            </button>
          </div>
        )}

        {/* Pay tab */}
        {tab === "pay" && (
          <div style={{ padding: "16px" }}>
            <HeaderBlock data={data} cardBg={cardBg} subtleBg={subtleBg} text={text} textMuted={textMuted} border={border} total={total} compact />
            <div style={{ marginTop: 14 }}>
              <BillingPanel
                data={data} device="mobile" text={text} textMuted={textMuted} textFaint={textFaint}
                border={border} subtleBg={subtleBg} onBrand={onBrand} btnRadius={btnRadius}
                total={total} compact quantities={p.quantities} setQty={p.setQty} dark={p.dark} chosenAmount={p.chosenAmount} setChosenAmount={p.setChosenAmount}
              />
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${border}`, padding: "10px", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: textFaint, margin: 0 }}>Powered by <strong style={{ color: data.brandColor }}>EnKash</strong></p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Header (product / cause / event)
// ──────────────────────────────────────────────────────────────────────────────
function HeaderBlock({
  data, cardBg, subtleBg, text, textMuted, textFaint, border, total, compact, brandColor,
}: { data: WizardData; cardBg: string; subtleBg: string; text: string; textMuted: string; textFaint?: string; border: string; total: string; compact?: boolean; brandColor?: string }) {
  return (
    <div style={{
      background: cardBg, borderTop: "none", borderBottom: `1px solid ${border}`,
      borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
      padding: compact ? "0 16px 12px" : "0 28px 18px", display: "flex", alignItems: "flex-start", gap: compact ? 12 : 16,
    }}>
      {data.productImage && data.amountType === "fixed" && (
        <div style={{ width: compact ? 44 : 56, height: compact ? 44 : 56, borderRadius: radius.sm, background: `url(${data.productImage}) center/cover`, border: `1px solid ${border}`, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Brand accent rule */}
        <div style={{ width: 30, height: 3, background: brandColor || data.brandColor, marginBottom: 8 }} />
        <p style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: text, margin: 0, overflowWrap: "break-word", wordBreak: "break-word" }}>
          {data.title || (
            (data.amountType === "customer" && data.isDonation) ? "Your Cause Title"
              : (data.amountType === "multiple" && data.itemsAreTickets) ? "Your Event Name"
              : "Your Page Title"
          )}
        </p>
        {data.amountType === "customer" && data.isDonation && (
          <p style={{ fontSize: 11, color: textMuted, margin: "2px 0 0" }}>Every contribution counts</p>
        )}
        {data.description && (
          <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, margin: "6px 0 0", whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>{data.description}</p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Billing panel — type-aware
// ──────────────────────────────────────────────────────────────────────────────
function BillingPanel({
  data, device, text, textMuted, textFaint, border, subtleBg, onBrand, btnRadius, total, compact, quantities, setQty, dark, chosenAmount, setChosenAmount,
}: {
  data: WizardData; device: "desktop" | "mobile"; text: string; textMuted: string; textFaint: string; border: string;
  subtleBg: string; onBrand: string; btnRadius: number; total: string; compact?: boolean;
  quantities?: Record<number, number>; setQty?: (i: number, delta: number, min?: number, max?: number) => void;
  dark?: boolean; chosenAmount?: string; setChosenAmount?: (v: string) => void;
}) {
  const qty = quantities ?? {};
  const bump = setQty ?? (() => {});
  const symbol = getSymbol(data.currency);
  const fieldSurface = dark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const fieldBorder = dark ? "rgba(255,255,255,0.14)" : "#d6dbe5";

  // Total box now carries the brand: a faint wash of the brand colour, with the
  // amount in the brand colour itself — auto-lightened/darkened just enough to
  // stay legible on the chosen theme (no-op for colours that already read well).
  const brandSurface = dark ? "#1a2540" : "#f7f7f9";
  const amountColor = adaptBrandColor(data.brandColor, brandSurface, !!dark);
  const brandRgb = rgbString(data.brandColor);
  const totalBoxBg = `rgba(${brandRgb}, ${dark ? 0.14 : 0.07})`;
  const totalBoxBorder = `rgba(${brandRgb}, ${dark ? 0.42 : 0.30})`;

  // Enabled payment methods (merchant-configurable); fall back to all four.
  const methods = (data.paymentMethods && data.paymentMethods.length ? data.paymentMethods : ALL_PAYMENT_METHODS.map(m => m.key));
  const [payMethod, setPayMethod] = useState<PaymentMethod>(methods[0]);
  // Keep selection valid if the merchant toggles the active method off in the wizard.
  const activeMethod = methods.includes(payMethod) ? payMethod : methods[0];

  // Computed states — defensive against any data combo where flags don't match amountType.
  const isCustomerDecides = data.amountType === "customer";
  const isDonationFlow = isCustomerDecides && data.isDonation;
  const isMultipleItems = data.amountType === "multiple";
  const isTicketsFlow = isMultipleItems && data.itemsAreTickets;
  const isFixed = data.amountType === "fixed";

  // Label above the pricing panel
  const amountLabel = isDonationFlow
    ? "Donation Amount"
    : isCustomerDecides
      ? "Choose an amount"
      : isTicketsFlow
        ? "Select Tickets"
        : isMultipleItems
          ? "Choose items"
          : "Final Amount";

  // ── UPI checkout state ─────────────────────────────────────────────────────
  // Desktop: clicking Pay (or the QR teaser) opens a focused modal that mints a
  // per-order dynamic QR. The QR itself is rendered by the QR product's
  // collect-screen component (OneTimeCollect), so both surfaces share one
  // NPCI-aligned rendering — the modal owns the QR lifecycle (fresh ref + 15-min
  // countdown on every open; OneTimeCollect handles expiry/regenerate itself).
  // Mobile: the customer picks a UPI app and Pay fires the upi:// intent link.
  const isDesktop = device === "desktop";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mandateOpen, setMandateOpen] = useState(false);
  const [upiApp, setUpiApp] = useState("gpay");
  const [redirecting, setRedirecting] = useState(false);

  // For recurring pages: build a Plan from the WizardData fields so MandateSummary
  // can display the right amount / frequency without importing the subscriptions
  // plans list (this page is payer-facing and doesn't know which plan seed applies).
  const isRecurring = !!data.isRecurring;
  const syntheticPlan: Plan | null = isRecurring && data.recurringFrequency
    ? {
        id: data.pageSlug || "page-plan",
        name: data.title || "Subscription",
        amount: parseFloat(total.replace(/[^0-9.]/g, "")) || 0,
        frequency: data.recurringFrequency,
        durationType: data.durationType ?? "until_cancelled",
        endDate: data.endDate ?? "",
      }
    : null;

  const upiAmount = (total.match(/[\d.,]+/)?.[0] || "").replace(/,/g, "");
  const canPayUpi = parseFloat(upiAmount || "0") > 0;
  // Mobile intent link — built through upiString so it pays the same verified
  // profile VPA as the desktop modal QR and carries a per-attempt `tr`
  // reference (re-minted in handlePay), keeping attribution intact on both
  // surfaces. Previously hardcoded to a stray VPA with no reference.
  const [intentRef, setIntentRef] = useState(() => genQrRef());
  const upiLink = upiString({
    vpa: DEFAULT_QR.vpa,
    name: data.merchantName || "EnKash Demo",
    amount: upiAmount,
    note: data.title || "Payment",
    ref: intentRef,
  });

  // Per-order QR fed to the shared collect-screen renderer. Amount and theme
  // track the live page state; validity fixed at 15 minutes for checkout.
  const checkoutQr: QrData = {
    ...DEFAULT_QR,
    usage: "onetime",
    label: data.title || "Payment",
    merchantName: data.merchantName || "EnKash Demo",
    oneTimeAmount: upiAmount,
    brandColor: data.brandColor,
    screenTheme: dark ? "dark" : "light",
    showMerchantLogo: data.showLogo,
    expiryEnabled: true,
    validityPreset: "15",
  };

  // Recurring pages gate through MandateSummary first; one-time pages go directly.
  const handlePay = () => (isRecurring && syntheticPlan) ? setMandateOpen(true) : setCheckoutOpen(true);
  // Mobile UPI inside the checkout fires the upi:// intent (fresh ref each time).
  const fireMobileIntent = () => {
    setIntentRef(genQrRef());
    setRedirecting(true);
    setTimeout(() => setRedirecting(false), 3200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* ── Total card (gradient elevation surface) ── */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Total</p>
        <div style={{ background: totalBoxBg, border: `1px solid ${totalBoxBorder}`, borderRadius: radius.md, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
            <span style={{ fontSize: 12, color: textMuted, paddingBottom: 3 }}>
              {isDonationFlow ? "Your donation" : "Total payable"}
            </span>
            <span style={{ fontSize: 26, fontWeight: 800, color: amountColor, lineHeight: 1 }}>{total}</span>
          </div>
        </div>
      </div>

      {/* ── Recurring commitment strip (recurring pages only) ── */}
      {isRecurring && syntheticPlan && syntheticPlan.amount > 0 && (
        <div style={{
          background: hexAlpha(data.brandColor, 0.07),
          border: `1px solid ${hexAlpha(data.brandColor, 0.22)}`,
          borderRadius: radius.sm,
          padding: "9px 12px",
          fontSize: 12,
          color: textMuted,
          lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 700, color: text }}>
            ₹{syntheticPlan.amount.toLocaleString("en-IN")}
          </span>
          {" "}every{" "}
          {syntheticPlan.frequency === "monthly" ? "month" : syntheticPlan.frequency === "quarterly" ? "3 months" : "year"}
          <span style={{ color: textFaint }}>
            {" · "}
            {(syntheticPlan.durationType === "until_date" && syntheticPlan.endDate)
              ? `until ${new Date(syntheticPlan.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
              : "until you cancel"}
          </span>
        </div>
      )}

      {/* Amount selector label — skipped for fixed (the Total card already states it) */}
      {!isFixed && (
        <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          {amountLabel}
        </p>
      )}

      {/* CUSTOMER DECIDES (donation OR not) — suggested chips + custom input */}
      {isCustomerDecides && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {(data.suggestedAmounts.filter(a => a).length === 0 ? ["100", "500", "1000", "2500"] : data.suggestedAmounts.filter(a => a)).slice(0, 4).map((amt, i) => {
              const selected = chosenAmount === amt;
              return (
                <button key={i} onClick={() => setChosenAmount?.(amt)} style={{
                  padding: "10px", border: `1.5px solid ${selected ? data.brandColor : fieldBorder}`,
                  background: selected ? hexAlpha(data.brandColor, 0.08) : fieldSurface,
                  color: selected ? data.brandColor : text, borderRadius: radius.sm, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {symbol}{amt || "—"}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, overflow: "hidden", marginTop: 4, background: fieldSurface }}>
            <span style={{ padding: "10px 12px", background: subtleBg, fontSize: 13, color: textMuted, fontWeight: 600 }}>{symbol}</span>
            <input
              type="number"
              value={chosenAmount}
              onChange={e => setChosenAmount?.(e.target.value)}
              placeholder={isDonationFlow ? "Or enter any amount" : "Or enter a custom amount"}
              style={{ flex: 1, padding: "10px 12px", fontSize: 13, color: text, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", minWidth: 0 }}
            />
          </div>
          {(data.minAmount || data.maxAmount) && (
            <p style={{ fontSize: 11, color: textFaint, margin: "2px 0 0" }}>
              {data.minAmount && data.maxAmount
                ? `Range: ${symbol}${data.minAmount} – ${symbol}${data.maxAmount}`
                : data.minAmount
                  ? `Minimum: ${symbol}${data.minAmount}`
                  : `Maximum: ${symbol}${data.maxAmount}`}
            </p>
          )}
        </>
      )}

      {/* TICKETS — tier cards with capacity */}
      {isTicketsFlow && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(data.items.filter(t => t.label || t.amount).length === 0 ? [{ label: "General Admission", amount: "0", capacity: "", description: "" }] : data.items).map((t, i) => {
            const cap = parseInt(t.capacity || "") || Infinity;
            const cur = qty[i] ?? 0;
            return (
            <div key={i} style={{ border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, background: fieldSurface }}>
              {t.image && (
                <div style={{ width: 40, height: 40, borderRadius: radius.sm, background: `${subtleBg} url(${t.image}) center/contain no-repeat`, border: `1px solid ${fieldBorder}`, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>{t.label || `Ticket ${i + 1}`}</p>
                <p style={{ fontSize: 11, color: textMuted, margin: "2px 0 0" }}>{symbol}{t.amount || "0"}{t.capacity ? ` · ${t.capacity} available` : ""}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: subtleBg, borderRadius: radius.sm, padding: "2px 4px" }}>
                <button onClick={() => bump(i, -1, 0, cap)} style={{ fontSize: 15, color: textMuted, padding: "0 6px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: text, minWidth: 14, textAlign: "center" }}>{cur}</span>
                <button onClick={() => bump(i, 1, 0, cap)} disabled={cur >= cap} style={{ fontSize: 15, color: cur >= cap ? textFaint : data.brandColor, padding: "0 6px", background: "none", border: "none", cursor: cur >= cap ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1, opacity: cur >= cap ? 0.4 : 1 }}>+</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* MULTIPLE ITEMS (non-tickets) — item rows with qty stepper */}
      {isMultipleItems && !isTicketsFlow && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(data.items.filter(it => it.label || it.amount).length === 0
            ? [{ label: "Item 1", amount: "0", description: "Add items in the editor to see them here" }]
            : data.items
          ).map((it, i) => {
            const minQ = parseInt((it as any).minQty || "") || 0;
            const maxQ = parseInt((it as any).maxQty || "") || Infinity;
            const cur = qty[i] ?? minQ;
            return (
            <div key={i} style={{ border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, background: fieldSurface }}>
              {it.image && (
                <div style={{ width: 40, height: 40, borderRadius: radius.sm, background: `${subtleBg} url(${it.image}) center/contain no-repeat`, border: `1px solid ${fieldBorder}`, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>{it.label || `Item ${i + 1}`}</p>
                <p style={{ fontSize: 11, color: textMuted, margin: "2px 0 0" }}>
                  {symbol}{it.amount || "0"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: subtleBg, borderRadius: radius.sm, padding: "2px 4px" }}>
                <button onClick={() => bump(i, -1, minQ, maxQ)} disabled={cur <= minQ} style={{ fontSize: 15, color: textMuted, padding: "0 6px", background: "none", border: "none", cursor: cur <= minQ ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1, opacity: cur <= minQ ? 0.4 : 1 }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: text, minWidth: 14, textAlign: "center" }}>{cur}</span>
                <button onClick={() => bump(i, 1, minQ, maxQ)} disabled={cur >= maxQ} style={{ fontSize: 15, color: cur >= maxQ ? textFaint : data.brandColor, padding: "0 6px", background: "none", border: "none", cursor: cur >= maxQ ? "default" : "pointer", fontFamily: "inherit", lineHeight: 1, opacity: cur >= maxQ ? 0.4 : 1 }}>+</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* FIXED AMOUNT — no separate box; the Total card above already shows it */}

      {/* Buyer details — real, type-aware inputs */}
      {data.customerFields.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {data.customerFields.slice(0, compact ? 4 : 7).map((f, i) => (
            <BuyerField
              key={i} field={f} symbol={symbol}
              text={text} textMuted={textMuted} textFaint={textFaint}
              fieldSurface={fieldSurface} fieldBorder={fieldBorder} subtleBg={subtleBg} compact={compact}
            />
          ))}
          {data.customerFields.length > (compact ? 4 : 7) && (
            <p style={{ fontSize: 11, color: textFaint, margin: 0 }}>+{data.customerFields.length - (compact ? 4 : 7)} more fields</p>
          )}
        </div>
      )}

      {isDonationFlow && data.is80G && (
        <div style={{ background: hexAlpha("#16a34a", 0.08), border: `1px solid ${hexAlpha("#16a34a", 0.25)}`, borderRadius: radius.sm, padding: "8px 10px", fontSize: 11, color: dark ? "#4ade80" : "#15803d", display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 12 }}>✓</span>
          <span>80G receipt available · Tax exemption eligible</span>
        </div>
      )}

      {/* Payment-method selection moved into the checkout modal below
          (temp PG-checkout stand-in), opened by the Pay button. */}

      {/* Pay button — opens the checkout (temp PG-checkout stand-in) */}
      <button onClick={handlePay} style={{
        width: "100%", padding: compact ? "12px" : "14px", background: data.brandColor, color: onBrand,
        border: "none", borderRadius: btnRadius, fontSize: compact ? 14 : 15, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.01em",
        boxShadow: `0 6px 18px ${hexAlpha(data.brandColor, 0.32)}`,
        marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Icon name="lock" size={13} />
        {data.buttonLabel || "Pay Securely"} {total}
        <span style={{ fontSize: 14 }}>›</span>
      </button>

      {/* Trust badges */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {["256-bit SSL", "PCI DSS", "RBI-authorised Payment Aggregator"].map(b => (
          <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: textFaint, fontWeight: 600, letterSpacing: "0.01em" }}>
            <span style={{ color: "#16a34a", fontSize: 11 }}>✓</span>{b}
          </span>
        ))}
      </div>

      {/* ── Mandate confirmation (recurring pages only) ──
          Shown before the checkout so the payer sees what they're authorising.
          MandateSummary owns no payment logic — its onApprove opens the
          existing checkout below (the TEMP PG stand-in) unchanged. */}
      {mandateOpen && syntheticPlan && (
        <div
          onClick={() => setMandateOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", marginTop: "auto", marginBottom: "auto" }}>
            <MandateSummary
              plan={syntheticPlan}
              onApprove={() => { setMandateOpen(false); setCheckoutOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* ── TEMP PG checkout (stand-in) ──
          Opened by the Pay button (one-time) or MandateSummary.onApprove
          (recurring). Stands in for EnKash's real PG hosted checkout. */}
      {checkoutOpen && (
        <div onClick={() => setCheckoutOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: 420, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", background: "#ffffff", borderRadius: 18, boxShadow: "0 24px 60px rgba(15,23,42,0.32)", padding: 20 }}>
            <button onClick={() => setCheckoutOpen(false)} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "#f1f3f7", border: "none", cursor: "pointer", fontSize: 13, color: C.textSecondary, lineHeight: 1, fontFamily: "inherit" }}>✕</button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: data.brandColor, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{(data.merchantName || "E").charAt(0)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13.5, fontWeight: 800, color: C.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.merchantName || "EnKash Demo"}</p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.title || "Payment"}</p>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.text, flexShrink: 0 }}>{total}</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 14px" }}>
              {ALL_PAYMENT_METHODS.filter(m => methods.includes(m.key)).map(m => {
                const selected = activeMethod === m.key;
                return (
                  <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    border: `1.5px solid ${selected ? data.brandColor : "#e3e7ee"}`,
                    background: selected ? hexAlpha(data.brandColor, 0.08) : "#f7f8fa",
                    color: selected ? data.brandColor : C.text, borderRadius: 999,
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                    {selected && <span style={{ width: 14, height: 14, borderRadius: "50%", background: data.brandColor, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>✓</span>}
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
                  <UpiCheckout
                    isDesktop={false} canPay={canPayUpi} onOpen={() => {}}
                    upiApp={upiApp} setUpiApp={setUpiApp} redirecting={redirecting}
                    upiLink={upiLink} qrPreviewValue={upiLink}
                    brand={data.brandColor} text={C.text} textMuted={C.textMuted} textFaint={C.textMuted}
                    fieldSurface="#ffffff" fieldBorder="#e3e7ee" subtleBg="#f1f3f7" compact={false} dark={false}
                  />
                  {!redirecting && (
                    <button onClick={fireMobileIntent} style={{ width: "100%", marginTop: 12, padding: "13px", background: data.brandColor, color: onBrand, border: "none", borderRadius: btnRadius, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Pay {total}</button>
                  )}
                </>
              )
            ) : (
              <MethodInput
                method={activeMethod} brand={data.brandColor}
                banks={data.netbankingBanks} wallets={data.wallets}
                text={C.text} textMuted={C.textMuted} textFaint={C.textMuted}
                fieldSurface="#ffffff" fieldBorder="#e3e7ee" subtleBg="#f1f3f7" compact={false}
              />
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
              {["256-bit SSL", "PCI DSS", "RBI-authorised Payment Aggregator"].map(b => (
                <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: C.textMuted, fontWeight: 600 }}>
                  <span style={{ color: "#16a34a", fontSize: 11 }}>✓</span>{b}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Buyer field — renders a real, type-aware input with a label above it
// ──────────────────────────────────────────────────────────────────────────────
export function BuyerField({
  field, symbol, text, textMuted, textFaint, fieldSurface, fieldBorder, subtleBg, compact,
}: {
  field: { type: string; label: string; optional: boolean };
  symbol: string; text: string; textMuted: string; textFaint: string;
  fieldSurface: string; fieldBorder: string; subtleBg: string; compact?: boolean;
}) {
  const pad = compact ? "10px 12px" : "12px 13px";
  const base: React.CSSProperties = {
    width: "100%", padding: pad, border: `1px solid ${fieldBorder}`, borderRadius: radius.sm,
    fontSize: 13, color: text, background: fieldSurface, boxSizing: "border-box",
    fontFamily: "inherit", outline: "none",
  };
  const placeholderColor = textFaint;

  const label = (
    <label style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
      {field.label}{!field.optional && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
    </label>
  );

  let control: React.ReactNode;
  switch (field.type) {
    case "phone":
      control = (
        <div style={{ display: "flex", alignItems: "stretch", border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, overflow: "hidden", background: fieldSurface }}>
          <span style={{ padding: pad, background: subtleBg, fontSize: 13, color: textMuted, fontWeight: 600, borderRight: `1px solid ${fieldBorder}`, whiteSpace: "nowrap" }}>+91</span>
          <input inputMode="tel" placeholder="98765 43210" style={{ ...base, border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
        </div>
      );
      break;
    case "email":
      control = <input type="email" placeholder="you@example.com" style={base} />;
      break;
    case "address":
    case "textarea":
      control = <textarea rows={2} placeholder={field.type === "address" ? "Flat, street, city, PIN" : "Type here…"} style={{ ...base, resize: "none" }} />;
      break;
    case "dropdown":
      control = (
        <select defaultValue="" style={{ ...base, color: textMuted, appearance: "none", backgroundImage: "none" }}>
          <option value="" disabled>Select an option…</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      );
      break;
    case "date":
      control = <input type="date" style={{ ...base, color: textMuted }} />;
      break;
    case "number":
      control = <input type="number" placeholder="0" style={base} />;
      break;
    case "pan":
      control = <input maxLength={10} placeholder="ABCDE1234F" style={{ ...base, textTransform: "uppercase", letterSpacing: "0.05em" }} />;
      break;
    case "gstin":
      control = <input maxLength={15} placeholder="22AAAAA0000A1Z5" style={{ ...base, textTransform: "uppercase", letterSpacing: "0.03em" }} />;
      break;
    case "name":
      control = <input placeholder="Your full name" style={base} />;
      break;
    case "company":
      control = <input placeholder="Company name" style={base} />;
      break;
    default:
      control = <input placeholder={field.label} style={base} />;
  }

  // Hint browsers/CSS to render placeholder color consistently is non-trivial inline;
  // the muted base color above keeps typed text readable while placeholders stay faint via the browser default.
  return (
    <div>
      {label}
      {control}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Method-specific input shown under the PAY VIA selector
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// UPI checkout — device-aware.
// Desktop: dynamic per-order QR (encodes the live upi:// intent with the payable
// amount). Blurred until Pay generates it; valid for 15 minutes, then expires
// and must be regenerated. Mobile: customer picks a UPI app; Pay deep-links via
// the same upi:// intent string.
// ──────────────────────────────────────────────────────────────────────────────
const UPI_APPS = [
  { key: "gpay", label: "GPay", logo: "/logos/gpay.svg" },
  { key: "phonepe", label: "PhonePe", logo: "/logos/phonepe.svg" },
  { key: "paytm", label: "Paytm", logo: "/logos/paytm.svg" },
  { key: "bhim", label: "BHIM", logo: "/logos/bhim.svg" },
];

function UpiQr({ value, size }: { value: string; size: number }) {
  const matrix = useMemo(() => { try { return qrMatrix(value); } catch { return null; } }, [value]);
  if (!matrix) return <div style={{ width: size, height: size, background: "#fff", borderRadius: 6 }} />;
  const n = matrix.length, quiet = 2, dim = n + quiet * 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (matrix[y][x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} shapeRendering="crispEdges" style={{ display: "block", borderRadius: 6 }}>
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={d} fill="#111111" />
    </svg>
  );
}

function VpaInput({ brand, base, pad, fieldBorder, fieldSurface }: {
  brand: string; base: React.CSSProperties; pad: string; fieldBorder: string; fieldSurface: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, overflow: "hidden", background: fieldSurface }}>
      <input placeholder="yourname@upi" style={{ ...base, border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
      <span style={{ padding: pad, fontSize: 12, fontWeight: 800, color: brand, borderLeft: `1px solid ${fieldBorder}`, display: "flex", alignItems: "center" }}>UPI</span>
    </div>
  );
}

export function UpiCheckout({
  isDesktop, canPay, onOpen, upiApp, setUpiApp, redirecting, upiLink, qrPreviewValue,
  brand, text, textMuted, textFaint, fieldSurface, fieldBorder, subtleBg, compact, dark,
}: {
  isDesktop: boolean; canPay: boolean; onOpen: () => void;
  upiApp: string; setUpiApp: (k: string) => void; redirecting: boolean; upiLink: string; qrPreviewValue: string;
  brand: string; text: string; textMuted: string; textFaint: string;
  fieldSurface: string; fieldBorder: string; subtleBg: string; compact?: boolean; dark?: boolean;
}) {
  const pad = compact ? "10px 12px" : "12px 13px";
  const base: React.CSSProperties = {
    width: "100%", padding: pad, border: `1px solid ${fieldBorder}`, borderRadius: radius.sm,
    fontSize: 13, color: text, background: fieldSurface, boxSizing: "border-box", fontFamily: "inherit", outline: "none",
  };

  const divider = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
      <div style={{ flex: 1, height: 1, background: fieldBorder }} />
      <span style={{ fontSize: 11, color: textFaint, fontWeight: 600 }}>or enter UPI ID</span>
      <div style={{ flex: 1, height: 1, background: fieldBorder }} />
    </div>
  );

  // OC-190 requires the literal 'Pay by any UPI App' displayed prominently for
  // online merchants — the canonical string, not a paraphrase.
  const heading = (
    <p style={{ fontSize: 12.5, fontWeight: 800, color: text, margin: "0 0 8px" }}>Pay by any UPI app</p>
  );

  // ── Desktop: blurred teaser → focused QR modal ──
  if (isDesktop) {
    return (
      <div>
        {heading}
        <div
          onClick={canPay ? onOpen : undefined}
          role={canPay ? "button" : undefined}
          style={{ border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, background: fieldSurface, padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", cursor: canPay ? "pointer" : "default" }}
        >
          <div style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ filter: "blur(7px)", opacity: 0.45 }}>
              <UpiQr value={qrPreviewValue} size={140} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={canPay ? "lock" : "coins"} size={15} /></span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: text, textAlign: "center", maxWidth: 150 }}>
                {canPay ? "Click Pay to scan & pay" : "Choose an amount to pay by QR"}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, color: textFaint }}>Scan with any UPI app</span>
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 7 }}>
            {UPI_APPS.map(a => (
              <span key={a.key} style={{ height: 16, display: "inline-flex", alignItems: "center", background: "#fff", borderRadius: 3, padding: "1px 4px", border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#e5e7eb"}` }}>
                <img src={a.logo} alt={a.label} style={{ height: 11, width: "auto", display: "block" }} />
              </span>
            ))}
          </div>
        </div>
        {divider}
        <VpaInput brand={brand} base={base} pad={pad} fieldBorder={fieldBorder} fieldSurface={fieldSurface} />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <PoweredByUpi reverse={dark} height={12} />
        </div>
      </div>
    );
  }

  // ── Mobile: app intent flow ──
  if (redirecting) {
    const app = UPI_APPS.find(a => a.key === upiApp) ?? UPI_APPS[0];
    return (
      <div style={{ border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, background: fieldSurface, padding: "18px 14px", textAlign: "center" }}>
        <span style={{ height: 26, display: "inline-flex", alignItems: "center", background: "#fff", borderRadius: 4, padding: "3px 8px", border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#e5e7eb"}` }}>
          <img src={app.logo} alt={app.label} style={{ height: 16, width: "auto", display: "block" }} />
        </span>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: text, margin: "10px 0 2px" }}>Opening {app.label}…</p>
        <p style={{ fontSize: 10.5, color: textFaint, margin: 0 }}>Approve the payment in the app</p>
        <p style={{ fontSize: 9.5, color: textFaint, margin: "8px 0 0", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5, opacity: 0.8 }}>{upiLink}</p>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <PoweredByUpi reverse={dark} height={12} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {heading}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {UPI_APPS.map(a => {
          const selected = upiApp === a.key;
          return (
            <button key={a.key} onClick={() => setUpiApp(a.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              padding: "9px 4px 7px", border: `1.5px solid ${selected ? brand : fieldBorder}`,
              background: selected ? hexAlpha(brand, 0.07) : fieldSurface,
              borderRadius: radius.sm, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
              <span style={{ height: 20, display: "inline-flex", alignItems: "center", background: "#fff", borderRadius: 3, padding: "2px 5px", border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#eceef2"}` }}>
                <img src={a.logo} alt={a.label} style={{ height: 13, width: "auto", display: "block" }} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: selected ? brand : textMuted }}>{a.label}</span>
            </button>
          );
        })}
      </div>
      {/* Mobile is intent-only: tapping an app fires the UPI Intent. No
          VPA-entry field here — a UPI ID box is the Collect pattern, which
          OC-190 moves app/mobile-web merchants away from. Desktop keeps the
          QR + UPI ID pair the master guideline prescribes for web. */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
        <PoweredByUpi reverse={dark} height={12} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export function MethodInput({
  method, brand, banks, wallets, text, textMuted, textFaint, fieldSurface, fieldBorder, subtleBg, compact,
}: {
  method: PaymentMethod; brand: string; banks?: string[]; wallets?: string[];
  text: string; textMuted: string; textFaint: string;
  fieldSurface: string; fieldBorder: string; subtleBg: string; compact?: boolean;
}) {
  const pad = compact ? "10px 12px" : "12px 13px";
  const base: React.CSSProperties = {
    width: "100%", padding: pad, border: `1px solid ${fieldBorder}`, borderRadius: radius.sm,
    fontSize: 13, color: text, background: fieldSurface, boxSizing: "border-box", fontFamily: "inherit", outline: "none",
  };

  if (method === "cards") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Card number" inputMode="numeric" style={base} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input placeholder="MM / YY" inputMode="numeric" style={base} />
          <input placeholder="CVV" inputMode="numeric" maxLength={4} style={base} />
        </div>
      </div>
    );
  }
  if (method === "netbanking") {
    const bankList = banks && banks.length ? banks : ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"];
    return (
      <select defaultValue="" style={{ ...base, color: textMuted, appearance: "none" }}>
        <option value="" disabled>Select your bank…</option>
        {bankList.map(b => <option key={b}>{b}</option>)}
      </select>
    );
  }
  // wallets
  const walletList = wallets && wallets.length ? wallets : ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik"];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {walletList.map(w => (
        <span key={w} style={{ padding: compact ? "8px 12px" : "10px 14px", border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, fontSize: 12.5, fontWeight: 600, color: text, background: fieldSurface, cursor: "default" }}>{w}</span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ──────────────────────────────────────────────────────────────────────────────
function InfoLine({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color, marginBottom: 4 }}>
      <span style={{ fontSize: 12, opacity: 0.7, display: "inline-flex", alignItems: "center" }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ContactLine({ icon, label, color, brand, link, small }: { icon: React.ReactNode; label: string; color: string; brand: string; link?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: small ? 11 : 12, color: link ? brand : color, marginBottom: 4, textDecoration: link ? "underline" : "none" }}>
      <span style={{ fontSize: 12, opacity: 0.7, color, display: "inline-flex", alignItems: "center" }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{label}</span>
    </div>
  );
}

function SocialIcon({ label, brand }: { label: string; brand: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: radius.sm, background: hexAlpha(brand, 0.1),
      color: brand, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, border: `1px solid ${hexAlpha(brand, 0.2)}`,
    }}>
      {label}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  data: WizardData;
  pageBg: string; cardBg: string; subtleBg: string;
  text: string; textMuted: string; textFaint: string; border: string;
  font: string; onBrand: string; btnRadius: number; total: string;
  panelBg?: string; headerBg?: string; dark?: boolean;
  quantities?: Record<number, number>;
  setQty?: (i: number, delta: number, min?: number, max?: number) => void;
  chosenAmount?: string;
  setChosenAmount?: (v: string) => void;
}

// Live total that respects buyer-selected quantities (multiple-items / tickets).
function computeTotalLive(data: WizardData, quantities: Record<number, number>, chosenAmount?: string): string {
  const sym = getSymbol(data.currency);
  if (data.amountType === "customer") {
    const n = parseFloat(chosenAmount || "");
    return !isNaN(n) && n > 0 ? `${sym}${n.toFixed(2)}` : `${sym}—`;
  }
  if (data.amountType === "multiple") {
    const items = data.items.filter(it => it.label || it.amount);
    const list = items.length ? items : data.items;
    const sum = list.reduce((acc, it, i) => acc + parseFloat(it.amount || "0") * (quantities[i] ?? 0), 0);
    return sum > 0 ? `${sym}${sum.toFixed(2)}` : `${sym}0.00`;
  }
  return computeTotal(data);
}

function computeTotal(data: WizardData): string {
  const sym = getSymbol(data.currency);

  // Branch on amountType (the source of truth)
  if (data.amountType === "fixed") return `${sym}${data.fixedAmount || "0"}`;
  if (data.amountType === "customer") return `${sym}—`;
  if (data.amountType === "multiple") {
    if (data.itemsAreTickets) {
      const first = data.items.find(t => t.amount);
      return first ? `${sym}${first.amount}` : `${sym}—`;
    }
    const sum = data.items.reduce((acc, it) => acc + parseFloat(it.amount || "0"), 0);
    return sum > 0 ? `${sym}${sum.toFixed(2)}` : `${sym}—`;
  }
  return `${sym}0`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

// Re-export legacy alias for any caller still using PreviewData (for compatibility)
export type PreviewData = WizardData;
