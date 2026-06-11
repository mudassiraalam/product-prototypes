import { QrData, DEFAULT_QR, AmountMode, Usage, validityMinutes } from "./qr-wizard-steps";
import { QrCode, QrStatus, genQrRef } from "./qr-mock-data";

export function qrToWizardData(qr: QrCode): QrData {
  if (qr.draftData) return qr.draftData;
  return {
    ...DEFAULT_QR,
    merchantName: qr.merchantName,
    label: qr.label,
    vpa: qr.vpa,
    usage: qr.usage as Usage,
    amountMode: qr.amountMode as AmountMode,
    fixedAmount: qr.usage === "reusable" && qr.amountMode === "fixed" && qr.amountValue ? String(qr.amountValue) : "",
    oneTimeAmount: qr.usage === "onetime" && qr.amountValue ? String(qr.amountValue) : "",
    brandColor: qr.brandColor,
    cardColorMode: qr.cardColorMode,
    layoutVariant: qr.layoutVariant,
    showMerchantName: qr.showMerchantName,
    centerLogo: qr.centerLogo,
    screenTheme: qr.screenTheme,
    showMerchantLogo: qr.showMerchantLogo,
    slug: qr.id.toLowerCase(),
  };
}

function amountValue(data: QrData): number | undefined {
  if (data.usage === "onetime") {
    const n = parseFloat(data.oneTimeAmount || "0");
    return n > 0 ? n : undefined;
  }
  if (data.amountMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? n : undefined;
  }
  return undefined;
}

function amountDisplay(data: QrData): string {
  const v = amountValue(data);
  if (data.usage === "onetime") return v ? `₹${v.toLocaleString("en-IN")} · one-time` : "—";
  if (data.amountMode === "fixed") return v ? `₹${v.toLocaleString("en-IN")}` : "—";
  return "Any amount";
}

export function wizardDataToQr(
  data: QrData,
  opts: { id: string; status: QrStatus; step: number; existing?: QrCode | null },
): QrCode {
  const ex = opts.existing;
  return {
    id: opts.id,
    reference: ex?.reference ?? genQrRef(),
    label: data.label || "Untitled QR",
    merchantName: data.merchantName,
    vpa: data.vpa,
    usage: data.usage,
    amountMode: data.usage === "onetime" ? "fixed" : data.amountMode,
    amount: amountDisplay(data),
    amountValue: amountValue(data),
    origin: ex?.origin ?? "dashboard",
    location: ex?.location ?? (data.usage === "onetime" ? (data.expiryEnabled ? `Valid ${validityMinutes(data)} min` : "Open until paid") : "—"),
    payments: ex?.payments ?? 0,
    revenue: ex?.revenue ?? "₹0",
    status: opts.status,
    created: ex?.created ?? new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    brandColor: data.brandColor,
    cardColorMode: data.cardColorMode,
    layoutVariant: data.layoutVariant,
    showMerchantName: data.showMerchantName,
    centerLogo: data.centerLogo,
    screenTheme: data.screenTheme,
    showMerchantLogo: data.showMerchantLogo,
    draftData: data,
    lastStep: opts.step,
  };
}
