import { QrData, DEFAULT_QR, AmountMode, Usage } from "./qr-wizard-steps";
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
    fixedAmount: qr.amountMode === "fixed" && qr.usage === "reusable" ? String(qr.amount).replace(/[^\d.]/g, "") : "",
    brandColor: qr.brandColor,
    standeeTheme: qr.standeeTheme,
    slug: qr.id.toLowerCase(),
  };
}

function amountDisplay(data: QrData): string {
  if (data.usage === "onetime") return "Set per bill";
  if (data.amountMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "—";
  }
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
    amountMode: data.amountMode,
    amount: amountDisplay(data),
    location: ex?.location ?? "—",
    payments: ex?.payments ?? 0,
    revenue: ex?.revenue ?? "₹0",
    status: opts.status,
    created: ex?.created ?? new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    brandColor: data.brandColor,
    standeeTheme: data.standeeTheme,
    draftData: data,
    lastStep: opts.step,
  };
}
