"use client";
import React from "react";
import { C, radius, shadow } from "./tokens";
import type { WizardData } from "./wizard-steps";
import { getSymbol } from "./wizard-steps";

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
  const dark = data.theme === "dark";
  const pageBg = dark ? "#0b1220" : "#f4f6fb";
  const cardBg = dark ? "#162033" : "#ffffff";
  const subtleBg = dark ? "#1c2a44" : "#f9fafb";
  const text = dark ? "#f1f5f9" : "#111827";
  const textMuted = dark ? "#94a3b8" : "#6b7280";
  const textFaint = dark ? "#64748b" : "#9ca3af";
  const border = dark ? "#1e2a44" : "#e5e7eb";
  const font = FONT_MAP[data.fontStyle];
  const onBrand = isDark(data.brandColor) ? "#ffffff" : "#0f172a";
  const btnRadius = data.buttonStyle === "pill" ? 999 : data.buttonStyle === "sharp" ? 4 : 10;
  const total = computeTotal(data);

  if (device === "mobile") {
    return (
      <MobilePreview
        data={data} pageBg={pageBg} cardBg={cardBg} subtleBg={subtleBg}
        text={text} textMuted={textMuted} textFaint={textFaint} border={border}
        font={font} onBrand={onBrand} btnRadius={btnRadius} total={total}
      />
    );
  }

  return (
    <DesktopPreview
      data={data} pageBg={pageBg} cardBg={cardBg} subtleBg={subtleBg}
      text={text} textMuted={textMuted} textFaint={textFaint} border={border}
      font={font} onBrand={onBrand} btnRadius={btnRadius} total={total}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// DESKTOP — full webpage layout
// ──────────────────────────────────────────────────────────────────────────────
function DesktopPreview(p: PreviewProps) {
  const { data, pageBg, cardBg, subtleBg, text, textMuted, textFaint, border, font, onBrand, btnRadius, total } = p;
  const maxW = data.layout === "wide" ? 940 : 820;

  return (
    <div style={{ background: pageBg, width: "100%", minHeight: "100%", fontFamily: font, padding: "20px 16px 32px" }}>
      <div style={{ maxWidth: maxW, margin: "0 auto" }}>
        {/* ── Top brand banner ─────────────────────────────────────── */}
        <div style={{
          background: data.brandColor, borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
          padding: "18px 28px", display: "flex", alignItems: "center", gap: 14,
          color: onBrand,
        }}>
          {data.showLogo && (
            <div style={{ width: 36, height: 36, background: hexAlpha("#ffffff", 0.18), borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 800, overflow: "hidden" }}>
              {(data as any).logoImage
                ? <img src={(data as any).logoImage} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
                : (data.merchantName || "E").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Paying to</p>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "1px 0 0" }}>{data.merchantName || "Your Brand"}</p>
          </div>
        </div>

        {/* Cover image (if uploaded) */}
        {data.coverImage && (
          <div style={{ height: 140, background: `url(${data.coverImage}) center/cover`, borderBottom: `1px solid ${border}` }} />
        )}

        {/* ── Product / Cause / Event / Invoice header ────────────── */}
        <HeaderBlock data={data} cardBg={cardBg} subtleBg={subtleBg} text={text} textMuted={textMuted} border={border} total={total} />

        {/* ── Two column body ──────────────────────────────────────── */}
        <div style={{
          background: cardBg, borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
          display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0,
        }}>
          {/* LEFT: description, contact, social */}
          <div style={{ padding: "24px 28px" }}>
            {data.description && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>About</p>
                <p style={{ fontSize: 13, color: text, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{data.description}</p>
              </div>
            )}

            {data.pageType === "event" && (data.eventDate || data.eventVenue) && (
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
                    <div key={i} style={{ aspectRatio: "4/3", borderRadius: radius.sm, background: `url(${img}) center/cover`, border: `1px solid ${border}` }} />
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

            {!data.description && !data.contactEmail && !data.contactPhone && !data.socialTwitter && !data.socialInstagram && !data.socialFacebook && !data.socialLinkedin && !(data as any).galleryImages?.length && (
              <div style={{ background: subtleBg, border: `1px dashed ${border}`, borderRadius: radius.md, padding: "20px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 20, margin: "0 0 8px" }}>
                  {data.pageType === "donation" ? "🤝" : data.pageType === "event" ? "🎟️" : data.pageType === "invoice" ? "🧾" : "🛍️"}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: textMuted, margin: "0 0 4px" }}>
                  {data.pageType === "donation" ? "Add details about your cause" : data.pageType === "event" ? "Tell customers about your event" : data.pageType === "invoice" ? "Add notes for your client" : "Add info about your product or service"}
                </p>
                <p style={{ fontSize: 11, color: textFaint, margin: 0, lineHeight: 1.5 }}>
                  Fill these in Step 1 under <strong>Page Info</strong> — they'll appear here.
                </p>
              </div>
            )}

          </div>

          {/* divider */}
          <div style={{ background: border }} />

          {/* RIGHT: billing form */}
          <div style={{ padding: "24px 28px" }}>
            <BillingPanel
              data={data} text={text} textMuted={textMuted} textFaint={textFaint}
              border={border} subtleBg={subtleBg} onBrand={onBrand} btnRadius={btnRadius}
              total={total}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: cardBg, borderTop: `1px solid ${border}`,
          borderRadius: `0 0 ${radius.lg}px ${radius.lg}px`,
          padding: "16px 28px", textAlign: "center",
          border: `1px solid ${border}`, borderTopColor: border,
        }}>
          <p style={{ fontSize: 10, color: textFaint, margin: "0 0 4px", letterSpacing: "0.06em" }}>POWERED BY</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: data.brandColor, margin: 0, letterSpacing: "-0.01em" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 16, height: 16, background: C.blue, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 10, fontWeight: 800 }}>E</span>
              EnKash
            </span>
          </p>
        </div>
      </div>
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
        {/* Brand banner */}
        <div style={{ background: data.brandColor, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, color: onBrand }}>
          {data.showLogo && (
            <div style={{ width: 28, height: 28, background: hexAlpha("#ffffff", 0.18), borderRadius: radius.sm, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, overflow: "hidden" }}>
              {(data as any).logoImage
                ? <img src={(data as any).logoImage} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
                : (data.merchantName || "E").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 600, margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Paying to</p>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "1px 0 0" }}>{data.merchantName || "Your Brand"}</p>
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, margin: 0, opacity: 0.95 }}>{total}</p>
        </div>

        {data.coverImage && <div style={{ height: 90, background: `url(${data.coverImage}) center/cover` }} />}

        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>
          <button style={tabStyle(tab === "info")} onClick={() => setTab("info")}>ℹ Info</button>
          <button style={tabStyle(tab === "pay")} onClick={() => setTab("pay")}>💳 Pay</button>
        </div>

        {/* Info tab */}
        {tab === "info" && (
          <div style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: text, margin: "0 0 6px" }}>{data.title || "Page Title"}</p>

            {data.description && (
              <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{data.description}</p>
            )}

            {(data as any).galleryImages?.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
                {(data as any).galleryImages.map((img: string, i: number) => (
                  <div key={i} style={{ aspectRatio: "4/3", borderRadius: radius.sm, background: `url(${img}) center/cover`, border: `1px solid ${border}` }} />
                ))}
              </div>
            )}

            {/* Event-specific info */}
            {data.pageType === "event" && (data.eventDate || data.eventVenue) && (
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

            {!data.description && !(data as any).galleryImages?.length && !data.contactEmail && !data.contactPhone && (
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
                total={total} compact
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
  data, cardBg, subtleBg, text, textMuted, border, total, compact,
}: { data: WizardData; cardBg: string; subtleBg: string; text: string; textMuted: string; border: string; total: string; compact?: boolean }) {
  return (
    <div style={{
      background: subtleBg, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
      padding: compact ? "12px 16px" : "18px 28px", display: "flex", alignItems: "center", gap: compact ? 12 : 16,
    }}>
      {data.productImage && data.pageType === "standard" && (
        <div style={{ width: compact ? 44 : 56, height: compact ? 44 : 56, borderRadius: radius.sm, background: `url(${data.productImage}) center/cover`, border: `1px solid ${border}`, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: text, margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {data.title || (data.pageType === "donation" ? "Your Cause Title" : data.pageType === "event" ? "Your Event Name" : data.pageType === "invoice" ? "Invoice" : "Your Page Title")}
        </p>
        {data.pageType === "donation" && (
          <p style={{ fontSize: 11, color: textMuted, margin: "2px 0 0" }}>Every contribution counts</p>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {data.pageType === "donation" ? "Donation" : data.pageType === "invoice" ? "Total Due" : "Total Amount"}
        </p>
        <p style={{ fontSize: compact ? 16 : 18, fontWeight: 800, color: text, margin: "2px 0 0" }}>{total}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Billing panel — type-aware
// ──────────────────────────────────────────────────────────────────────────────
function BillingPanel({
  data, text, textMuted, textFaint, border, subtleBg, onBrand, btnRadius, total, compact,
}: {
  data: WizardData; text: string; textMuted: string; textFaint: string; border: string;
  subtleBg: string; onBrand: string; btnRadius: number; total: string; compact?: boolean;
}) {
  const symbol = getSymbol(data.currency);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: compact ? "9px 11px" : "10px 13px", border: `1px solid ${border}`,
    borderRadius: radius.sm, fontSize: 13, color: textMuted, background: "transparent",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
        {data.pageType === "donation" ? "Donation Amount" : data.pageType === "event" ? "Select Tickets" : data.pageType === "invoice" ? "Amount Due" : "Final Amount"}
      </p>

      {/* DONATION: suggested chips + custom */}
      {data.pageType === "donation" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: compact ? "repeat(2, 1fr)" : "repeat(2, 1fr)", gap: 8 }}>
            {(data.suggestedAmounts.filter(a => a).length === 0 ? ["100", "500", "1000", "2500"] : data.suggestedAmounts).slice(0, 4).map((amt, i) => (
              <button key={i} style={{
                padding: "10px", border: `1.5px solid ${i === 1 ? data.brandColor : border}`,
                background: i === 1 ? hexAlpha(data.brandColor, 0.08) : "transparent",
                color: i === 1 ? data.brandColor : text, borderRadius: radius.sm, fontSize: 13, fontWeight: 700,
                cursor: "default", fontFamily: "inherit",
              }}>
                {symbol}{amt || "—"}
              </button>
            ))}
          </div>
          {data.allowCustomDonation && (
            <div style={{ display: "flex", alignItems: "center", border: `1px solid ${border}`, borderRadius: radius.sm, overflow: "hidden", marginTop: 4 }}>
              <span style={{ padding: "10px 12px", background: subtleBg, fontSize: 13, color: textMuted, fontWeight: 600 }}>{symbol}</span>
              <span style={{ flex: 1, padding: "10px 12px", fontSize: 13, color: textFaint, fontStyle: "italic" }}>Or enter any amount</span>
            </div>
          )}
        </>
      )}

      {/* EVENT: ticket selectors */}
      {data.pageType === "event" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(data.tickets.filter(t => t.name || t.price).length === 0 ? [{ name: "General Admission", price: "0", capacity: "", description: "" }] : data.tickets).map((t, i) => (
            <div key={i} style={{ border: `1px solid ${border}`, borderRadius: radius.sm, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>{t.name || `Ticket ${i + 1}`}</p>
                <p style={{ fontSize: 11, color: textMuted, margin: "2px 0 0" }}>{symbol}{t.price || "0"}{t.capacity ? ` · ${t.capacity} seats` : ""}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: subtleBg, borderRadius: radius.sm, padding: "2px 4px" }}>
                <span style={{ fontSize: 13, color: textMuted, padding: "0 4px" }}>−</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: text, minWidth: 14, textAlign: "center" }}>{i === 0 ? "1" : "0"}</span>
                <span style={{ fontSize: 13, color: data.brandColor, padding: "0 4px" }}>+</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INVOICE: line items table */}
      {data.pageType === "invoice" && (
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

      {/* STANDARD: fixed amount preview / customer field */}
      {data.pageType === "standard" && (
        <>
          {data.amountType === "fixed" && (
            <div style={{ ...inputStyle, color: text, fontWeight: 700, fontSize: 15 }}>
              {symbol}{data.fixedAmount || "0.00"}
            </div>
          )}
          {data.amountType === "customer" && (
            <div style={{ display: "flex", alignItems: "center", border: `1px solid ${border}`, borderRadius: radius.sm, overflow: "hidden" }}>
              <span style={{ padding: "10px 12px", background: subtleBg, fontSize: 13, color: textMuted, fontWeight: 600 }}>{symbol}</span>
              <span style={{ flex: 1, padding: "10px 12px", fontSize: 13, color: textFaint, fontStyle: "italic" }}>Enter amount</span>
            </div>
          )}
          {data.amountType === "multiple" && data.items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.items.slice(0, 3).map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", border: `1px solid ${border}`, borderRadius: radius.sm, fontSize: 12 }}>
                  <span style={{ color: text }}>{it.label || `Item ${i + 1}`}</span>
                  <span style={{ fontWeight: 600, color: text }}>{symbol}{it.amount || "0"}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Customer fields */}
      {data.customerFields.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {data.customerFields.slice(0, compact ? 3 : 5).map((f, i) => (
            <div key={i} style={inputStyle}>
              {f.label}{!f.optional && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
            </div>
          ))}
          {data.customerFields.length > (compact ? 3 : 5) && (
            <p style={{ fontSize: 11, color: textFaint, margin: 0 }}>+{data.customerFields.length - (compact ? 3 : 5)} more fields</p>
          )}
        </div>
      )}

      {data.pageType === "donation" && data.is80G && (
        <div style={{ background: hexAlpha("#16a34a", 0.08), border: `1px solid ${hexAlpha("#16a34a", 0.25)}`, borderRadius: radius.sm, padding: "8px 10px", fontSize: 11, color: "#15803d", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12 }}>✓</span>
          <span>80G receipt available · Tax exemption eligible</span>
        </div>
      )}

      {/* Pay button */}
      <button style={{
        width: "100%", padding: compact ? "11px" : "13px", background: data.brandColor, color: onBrand,
        border: "none", borderRadius: btnRadius, fontSize: compact ? 14 : 15, fontWeight: 700,
        cursor: "default", fontFamily: "inherit", letterSpacing: "0.01em",
        boxShadow: `0 6px 18px ${hexAlpha(data.brandColor, 0.32)}`,
        marginTop: 6,
      }}>
        {data.buttonLabel || "Pay Securely"} {total}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 10 }}>🔒</span>
        <span style={{ fontSize: 10, color: textFaint }}>100% Secure payment</span>
      </div>
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
}

function computeTotal(data: WizardData): string {
  const sym = getSymbol(data.currency);
  if (data.pageType === "standard") {
    if (data.amountType === "fixed") return `${sym}${data.fixedAmount || "0"}`;
    if (data.amountType === "customer") return `${sym}—`;
    if (data.amountType === "multiple") {
      const sum = data.items.reduce((acc, it) => acc + parseFloat(it.amount || "0"), 0);
      return sum > 0 ? `${sym}${sum.toFixed(2)}` : `${sym}—`;
    }
  }
  if (data.pageType === "donation") {
    return `${sym}—`;
  }
  if (data.pageType === "event") {
    const first = data.tickets.find(t => t.price);
    return first ? `${sym}${first.price}` : `${sym}—`;
  }
  if (data.pageType === "invoice") {
    const sub = data.lineItems.reduce((acc, li) => acc + parseFloat(li.unitPrice || "0") * parseFloat(li.quantity || "1"), 0);
    const tax = sub * (parseFloat(data.taxPercent || "0") / 100);
    return `${sym}${(sub + tax).toFixed(2)}`;
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
