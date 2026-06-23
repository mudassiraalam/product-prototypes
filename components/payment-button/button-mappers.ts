import { ButtonData, DEFAULT_BUTTON, ButtonAmountMode } from "./button-wizard-steps";
import { PaymentButton, ButtonStatus, genButtonRef } from "./button-mock-data";

export function buttonToWizardData(b: PaymentButton): ButtonData {
  if (b.draftData) return b.draftData;
  return {
    ...DEFAULT_BUTTON,
    merchantName: b.merchantName,
    title: b.title,
    buttonLabel: b.buttonLabel,
    amountMode: b.amountMode as ButtonAmountMode,
    fixedAmount: b.amountMode === "fixed" && b.amountValue ? String(b.amountValue) : "",
    brandColor: b.brandColor,
    buttonStyle: b.buttonStyle,
    slug: b.id.toLowerCase(),
  };
}

function amountValue(data: ButtonData): number | undefined {
  if (data.amountMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? n : undefined;
  }
  return undefined;
}

function amountDisplay(data: ButtonData): string {
  if (data.amountMode === "fixed") {
    const v = amountValue(data);
    return v ? `₹${v.toLocaleString("en-IN")}` : "—";
  }
  return "Customer decides";
}

export function wizardDataToButton(
  data: ButtonData,
  opts: { id: string; status: ButtonStatus; step: number; existing?: PaymentButton | null },
): PaymentButton {
  const ex = opts.existing;
  return {
    id: opts.id,
    reference: ex?.reference ?? genButtonRef(),
    title: data.title || "Untitled button",
    buttonLabel: data.buttonLabel || "Pay Now",
    merchantName: data.merchantName,
    amountMode: data.amountMode,
    amount: amountDisplay(data),
    amountValue: amountValue(data),
    origin: ex?.origin ?? "dashboard",
    payments: ex?.payments ?? 0,
    revenue: ex?.revenue ?? "₹0",
    status: opts.status,
    created: ex?.created ?? new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    brandColor: data.brandColor,
    buttonStyle: data.buttonStyle,
    draftData: data,
    lastStep: opts.step,
  };
}
