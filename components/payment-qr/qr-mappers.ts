import { QrData, DEFAULT_QR, PriceMode } from "./qr-wizard-steps";
import { QrCode, QrStatus } from "./qr-mock-data";

// ── Saved row → builder state ─────────────────────────────────────────────────
// Drafts/in-session edits carry full draftData, so reopen losslessly. Seed rows
// have no draftData — fabricate believable builder state from their summary.
export function qrToWizardData(qr: QrCode): QrData {
  if (qr.draftData) return qr.draftData;
  return {
    ...DEFAULT_QR,
    merchantName: qr.merchantName,
    label: qr.label,
    vpa: qr.vpa,
    priceMode: qr.priceMode,
    fixedAmount: qr.priceMode === "fixed" ? String(qr.amount).replace(/[^\d.]/g, "") : "",
    brandColor: qr.brandColor,
    standeeTheme: qr.standeeTheme,
    slug: qr.id.toLowerCase(),
  };
}

// ── Builder state → saved row ─────────────────────────────────────────────────
function amountDisplay(data: QrData): string {
  if (data.priceMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "—";
  }
  if (data.priceMode === "any") return "Any amount";
  const prices = data.items.map(i => parseFloat(i.amount || "0")).filter(n => n > 0);
  if (prices.length === 0) return "—";
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? `₹${lo.toLocaleString("en-IN")}` : `₹${lo.toLocaleString("en-IN")} – ₹${hi.toLocaleString("en-IN")}`;
}

export function wizardDataToQr(
  data: QrData,
  opts: { id: string; status: QrStatus; step: number; existing?: QrCode | null },
): QrCode {
  const existing = opts.existing;
  return {
    id: opts.id,
    label: data.label || "Untitled QR",
    merchantName: data.merchantName,
    vpa: data.vpa,
    priceMode: data.priceMode as PriceMode,
    amount: amountDisplay(data),
    location: existing?.location ?? "—",
    scans: existing?.scans ?? 0,
    collections: existing?.collections ?? 0,
    revenue: existing?.revenue ?? "₹0",
    status: opts.status,
    created: existing?.created ?? new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    brandColor: data.brandColor,
    standeeTheme: data.standeeTheme,
    draftData: data,
    lastStep: opts.step,
  };
}
