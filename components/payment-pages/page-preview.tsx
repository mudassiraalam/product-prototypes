"use client";
import React, { useState } from "react";
import { C, radius, shadow } from "./tokens";
import type { WizardData, PaymentMethod } from "./wizard-steps";
import { getSymbol, ALL_PAYMENT_METHODS } from "./wizard-steps";

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

function hexAlpha(hex: string, alpha: number) {
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
            <span style={{ fontSize: 11 }}>🔒</span>
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
              {data.productImage && data.pageType === "page" && data.amountType === "fixed" && (
                <div style={{ width: 56, height: 56, borderRadius: radius.sm, background: `url(${data.productImage}) center/cover`, border: `1px solid ${border}`, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 19, fontWeight: 700, color: text, margin: 0, lineHeight: 1.3, overflowWrap: "break-word", wordBreak: "break-word" }}>
                  {data.title || (
                    data.pageType === "invoice" ? "Invoice"
                      : (data.amountType === "customer" && data.isDonation) ? "Your Cause Title"
                      : (data.amountType === "multiple" && data.itemsAreTickets) ? "Your Event Name"
                      : "Your Page Title"
                  )}
                </p>
                <div style={{ width: 30, height: 3, background: data.brandColor, margin: "10px 0 0" }} />
                {data.pageType === "page" && data.amountType === "customer" && data.isDonation && (
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

            {(data.pageType === "page" && data.amountType === "multiple" && data.itemsAreTickets) && (data.eventDate || data.eventVenue) && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Event Info</p>
                {data.eventDate && <InfoLine icon="📅" text={`${formatDate(data.eventDate)}${data.eventTime ? ` · ${data.eventTime}` : ""}`} color={text} />}
                {data.eventVenue && <InfoLine icon="📍" text={data.eventVenue} color={text} />}
              </div>
            )}

            {data.pageType === "invoice" && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Invoice Details</p>
                {data.invoiceNumber && <InfoLine icon="#" text={`Invoice ${data.invoiceNumber}`} color={text} />}
                {data.dueDate && <InfoLine icon="⏰" text={`Due ${formatDate(data.dueDate)}`} color={text} />}
                {data.customerName && <InfoLine icon="👤" text={`Bill to: ${data.customerName}`} color={text} />}
              </div>
            )}

            {(data.contactEmail || data.contactPhone || data.contactWhatsapp || data.contactWebsite) && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Contact Us</p>
                {data.contactEmail && <ContactLine icon="✉" label={data.contactEmail} color={text} brand={data.brandColor} />}
                {data.contactPhone && <ContactLine icon="☎" label={data.contactPhone} color={text} brand={data.brandColor} />}
                {data.contactWhatsapp && <ContactLine icon="💬" label={data.contactWhatsapp} color={text} brand={data.brandColor} />}
                {data.contactWebsite && <ContactLine icon="🌐" label={data.contactWebsite} color={text} brand={data.brandColor} link />}
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
                <p style={{ fontSize: 20, margin: "0 0 8px" }}>
                  {data.pageType === "invoice" ? "🧾" : (data.amountType === "customer" && data.isDonation) ? "🤝" : (data.amountType === "multiple" && data.itemsAreTickets) ? "🎟️" : "🛍️"}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: textMuted, margin: "0 0 4px" }}>
                  {data.pageType === "invoice" ? "Add notes for your client" : (data.amountType === "customer" && data.isDonation) ? "Add details about your cause" : (data.amountType === "multiple" && data.itemsAreTickets) ? "Tell customers about your event" : "Add info about your product or service"}
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
                data={data} text={text} textMuted={textMuted} textFaint={textFaint}
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
              <span style={{ width: 15, height: 15, background: C.blue, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 9, fontWeight: 800 }}>E</span>
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
          <button style={tabStyle(tab === "info")} onClick={() => setTab("info")}>ℹ Info</button>
          <button style={tabStyle(tab === "pay")} onClick={() => setTab("pay")}>💳 Pay</button>
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
            {(data.pageType === "page" && data.amountType === "multiple" && data.itemsAreTickets) && (data.eventDate || data.eventVenue) && (
              <div style={{ background: subtleBg, borderRadius: radius.sm, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
                {data.eventDate && <p style={{ margin: "0 0 4px", color: text }}>📅 {data.eventDate}{data.eventTime ? ` at ${data.eventTime}` : ""}</p>}
                {data.eventVenue && <p style={{ margin: 0, color: text }}>📍 {data.eventVenue}</p>}
              </div>
            )}

            {(data.contactEmail || data.contactPhone) && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>Contact</p>
                {data.contactEmail && <p style={{ fontSize: 12, color: text, margin: "0 0 3px" }}>✉ {data.contactEmail}</p>}
                {data.contactPhone && <p style={{ fontSize: 12, color: text, margin: 0 }}>☎ {data.contactPhone}</p>}
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
                <p style={{ margin: "0 0 4px", fontSize: 20 }}>🛍️</p>
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
                data={data} text={text} textMuted={textMuted} textFaint={textFaint}
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
// Header (product / cause / event / invoice)
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
      {data.productImage && data.pageType === "page" && data.amountType === "fixed" && (
        <div style={{ width: compact ? 44 : 56, height: compact ? 44 : 56, borderRadius: radius.sm, background: `url(${data.productImage}) center/cover`, border: `1px solid ${border}`, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Brand accent rule */}
        <div style={{ width: 30, height: 3, background: brandColor || data.brandColor, marginBottom: 8 }} />
        <p style={{ fontSize: compact ? 15 : 18, fontWeight: 700, color: text, margin: 0, overflowWrap: "break-word", wordBreak: "break-word" }}>
          {data.title || (
            data.pageType === "invoice" ? "Invoice"
              : (data.amountType === "customer" && data.isDonation) ? "Your Cause Title"
              : (data.amountType === "multiple" && data.itemsAreTickets) ? "Your Event Name"
              : "Your Page Title"
          )}
        </p>
        {data.pageType === "page" && data.amountType === "customer" && data.isDonation && (
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
  data, text, textMuted, textFaint, border, subtleBg, onBrand, btnRadius, total, compact, quantities, setQty, dark, chosenAmount, setChosenAmount,
}: {
  data: WizardData; text: string; textMuted: string; textFaint: string; border: string;
  subtleBg: string; onBrand: string; btnRadius: number; total: string; compact?: boolean;
  quantities?: Record<number, number>; setQty?: (i: number, delta: number, min?: number, max?: number) => void;
  dark?: boolean; chosenAmount?: string; setChosenAmount?: (v: string) => void;
}) {
  const qty = quantities ?? {};
  const bump = setQty ?? (() => {});
  const symbol = getSymbol(data.currency);
  const fieldSurface = dark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const fieldBorder = dark ? "rgba(255,255,255,0.14)" : "#d6dbe5";

  // Subtle raised surface for the Total box — faint brand-neutral tint → white.
  const summaryGradient = dark
    ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
    : "linear-gradient(180deg, #f7f9fc 0%, #ffffff 100%)";

  // Enabled payment methods (merchant-configurable); fall back to all four.
  const methods = (data.paymentMethods && data.paymentMethods.length ? data.paymentMethods : ALL_PAYMENT_METHODS.map(m => m.key));
  const [payMethod, setPayMethod] = useState<PaymentMethod>(methods[0]);
  // Keep selection valid if the merchant toggles the active method off in the wizard.
  const activeMethod = methods.includes(payMethod) ? payMethod : methods[0];

  // Computed states — defensive against any data combo where flags don't match amountType.
  const isInvoice = data.pageType === "invoice";
  const isCustomerDecides = data.pageType === "page" && data.amountType === "customer";
  const isDonationFlow = isCustomerDecides && data.isDonation;
  const isMultipleItems = data.pageType === "page" && data.amountType === "multiple";
  const isTicketsFlow = isMultipleItems && data.itemsAreTickets;
  const isFixed = data.pageType === "page" && data.amountType === "fixed";

  // Label above the pricing panel
  const amountLabel = isInvoice
    ? "Amount Due"
    : isDonationFlow
      ? "Donation Amount"
      : isCustomerDecides
        ? "Choose an amount"
        : isTicketsFlow
          ? "Select Tickets"
          : isMultipleItems
            ? "Choose items"
            : "Final Amount";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* ── Total card (gradient elevation surface) ── */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Total</p>
        <div style={{ background: summaryGradient, border: `1px solid ${border}`, borderRadius: radius.md, padding: "14px 16px", boxShadow: dark ? "none" : "0 1px 2px rgba(16,24,40,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 12, color: textMuted }}>
              {isInvoice ? "Total due" : isDonationFlow ? "Your donation" : "Total payable"}
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: text }}>{total}</span>
          </div>
          {isInvoice && parseFloat(data.taxPercent || "0") > 0 && (
            <p style={{ fontSize: 11, color: textFaint, margin: "4px 0 0" }}>Incl. {data.taxPercent}% tax</p>
          )}
        </div>
      </div>

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

      {/* INVOICE: line items table */}
      {isInvoice && (
        <div style={{ border: `1px solid ${border}`, borderRadius: radius.sm, overflow: "hidden" }}>
          {(data.lineItems.filter(li => li.description).length === 0 ? [{ description: "Service / Product", quantity: "1", unitPrice: "0" }] : data.lineItems).map((li, i) => (
            <div key={i} style={{ padding: "8px 12px", borderBottom: i < data.lineItems.length - 1 ? `1px solid ${border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <div style={{ flex: 1, color: text }}>
                {li.description || "—"}
                <span style={{ color: textFaint, marginLeft: 6 }}>× {li.quantity || "1"}</span>
              </div>
              <span style={{ fontWeight: 600, color: text }}>{symbol}{(parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1")).toFixed(2)}</span>
            </div>
          ))}
          {parseFloat(data.taxPercent || "0") > 0 && (
            <div style={{ padding: "8px 12px", background: subtleBg, fontSize: 12, color: textMuted, display: "flex", justifyContent: "space-between" }}>
              <span>Tax ({data.taxPercent}%)</span>
              <span>{symbol}{computeTax(data)}</span>
            </div>
          )}
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

      {/* ── PAY VIA — method selector + method-specific input ── */}
      <div style={{ marginTop: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Pay via</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {ALL_PAYMENT_METHODS.filter(m => methods.includes(m.key)).map(m => {
            const selected = activeMethod === m.key;
            return (
              <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: compact ? "7px 11px" : "8px 14px",
                border: `1.5px solid ${selected ? data.brandColor : fieldBorder}`,
                background: selected ? hexAlpha(data.brandColor, 0.08) : fieldSurface,
                color: selected ? data.brandColor : text, borderRadius: 999,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                {selected && (
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: data.brandColor, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>✓</span>
                )}
                {m.label}
              </button>
            );
          })}
        </div>
        <MethodInput
          method={activeMethod} brand={data.brandColor}
          banks={data.netbankingBanks} wallets={data.wallets}
          text={text} textMuted={textMuted} textFaint={textFaint}
          fieldSurface={fieldSurface} fieldBorder={fieldBorder} subtleBg={subtleBg} compact={compact}
        />
      </div>

      {/* Pay button */}
      <button style={{
        width: "100%", padding: compact ? "12px" : "14px", background: data.brandColor, color: onBrand,
        border: "none", borderRadius: btnRadius, fontSize: compact ? 14 : 15, fontWeight: 700,
        cursor: "default", fontFamily: "inherit", letterSpacing: "0.01em",
        boxShadow: `0 6px 18px ${hexAlpha(data.brandColor, 0.32)}`,
        marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span style={{ fontSize: 13 }}>🔒</span>
        {data.buttonLabel || "Pay Securely"} {total}
        <span style={{ fontSize: 14 }}>›</span>
      </button>

      {/* Trust badges */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {["256-bit SSL", "PCI DSS", "RBI Compliant"].map(b => (
          <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: textFaint, fontWeight: 600, letterSpacing: "0.01em" }}>
            <span style={{ color: "#16a34a", fontSize: 11 }}>✓</span>{b}
          </span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Buyer field — renders a real, type-aware input with a label above it
// ──────────────────────────────────────────────────────────────────────────────
function BuyerField({
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
function MethodInput({
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

  if (method === "upi") {
    return (
      <div style={{ display: "flex", alignItems: "stretch", border: `1px solid ${fieldBorder}`, borderRadius: radius.sm, overflow: "hidden", background: fieldSurface }}>
        <input placeholder="yourname@upi" style={{ ...base, border: "none", borderRadius: 0, flex: 1, minWidth: 0 }} />
        <span style={{ padding: pad, fontSize: 12, fontWeight: 800, color: brand, borderLeft: `1px solid ${fieldBorder}`, display: "flex", alignItems: "center" }}>UPI</span>
      </div>
    );
  }
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
function InfoLine({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color, marginBottom: 4 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ContactLine({ icon, label, color, brand, link, small }: { icon: string; label: string; color: string; brand: string; link?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: small ? 11 : 12, color: link ? brand : color, marginBottom: 4, textDecoration: link ? "underline" : "none" }}>
      <span style={{ fontSize: 12, opacity: 0.7, color }}>{icon}</span>
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

  if (data.pageType === "invoice") {
    const sub = data.lineItems.reduce((acc, li) => acc + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0);
    const tax = sub * (parseFloat(data.taxPercent || "0") / 100);
    return `${sym}${(sub + tax).toFixed(2)}`;
  }

  // Payment page — branch on amountType (the source of truth)
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

function computeTax(data: WizardData): string {
  const sub = data.lineItems.reduce((acc, li) => acc + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0);
  const tax = sub * (parseFloat(data.taxPercent || "0") / 100);
  return tax.toFixed(2);
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
