import type { ButtonData, ButtonAmountMode, ButtonStyle } from "./button-wizard-steps";
import { MERCHANT_PROFILE } from "@/components/payment-qr/qr-mock-data";

export type ButtonStatus = "Active" | "Inactive" | "Draft";
export type ButtonOrigin = "dashboard" | "api";

// ──────────────────────────────────────────────────────────────────────────────
// Attribution model (how the PG knows WHICH button a payment came through):
//   • Every button carries a unique REFERENCE. The checkout JS sends it with the
//     order, so each payment maps back to the exact button that was clicked —
//     even with many buttons on one merchant account.
//   • Each individual payment has its own payment id (the PG rail's id).
//
// Origin model (who created the button):
//   • dashboard — authored in the create wizard.
//   • api       — created by the merchant's own system via the buttons API.
//     [VERIFY with Pallav: does EnKash expose a button-creation API, mirroring
//      Payment QR's API-minted codes? If not, this origin is dropped.]
//
// Settlement: unlike a UPI QR (which settles to a VPA), a button takes cards /
// netbanking / UPI through the PG, so funds settle to the merchant's configured
// PG settlement account — surfaced read-only, never typed here.
// ──────────────────────────────────────────────────────────────────────────────

export const SETTLEMENT_ACCOUNT = MERCHANT_PROFILE.vpas[0].bank; // e.g. "HDFC Bank ····4521"

export interface PaymentButton {
  id: string;
  reference: string;       // unique per button → attribution key
  title: string;           // internal label (dashboard only)
  buttonLabel: string;     // customer-facing words on the button
  merchantName: string;
  amountMode: ButtonAmountMode;
  amount: string;          // display: "₹499" / "Customer decides"
  amountValue?: number;    // numeric when fixed
  origin: ButtonOrigin;
  payments: number;        // successful payments attributed to this button
  revenue: string;
  status: ButtonStatus;
  created: string;
  brandColor: string;
  buttonStyle: ButtonStyle;
  draftData?: ButtonData;
  lastStep?: number;
}

export const genButtonRef = () => "PBN" + Math.random().toString(36).slice(2, 8).toUpperCase();

// ── Embed snippet — THE artifact the merchant pastes on their own site ────────
// One <script> tag, referenced by the button's id. This mirrors how every hosted
// payment-button product ships (a single async script), but the host, path and
// data attribute are EnKash's, not a competitor's.
// [VERIFY with Pallav/PG: the real checkout-JS URL and the data attribute name.]
export function embedSnippet(id: string): string {
  return [
    "<form>",
    '  <script src="https://checkout.enkash.io/v1/payment-button.js"',
    `          data-button_id="${id}"`,
    "          async>",
    "  </script>",
    "</form>",
  ].join("\n");
}

const MERCHANT = MERCHANT_PROFILE.businessName;
const ACCENT = "#1c5af4";

// ── Seed rows — one merchant, a mix of dashboard-authored + one API-created ───
export const INITIAL_BUTTONS: PaymentButton[] = [
  {
    id: "PB-ENK-DONATE", reference: "PBNA91X4", title: "Website donate", buttonLabel: "Donate",
    merchantName: MERCHANT, amountMode: "customer", amount: "Customer decides", origin: "dashboard",
    payments: 482, revenue: "₹3,11,400", status: "Active", created: "06 Jan 2025, 10:20",
    brandColor: "#16a34a", buttonStyle: "solid",
  },
  {
    id: "PB-ENK-COURSE", reference: "PBNB72K9", title: "Course fee — Batch 12", buttonLabel: "Pay course fee",
    merchantName: MERCHANT, amountMode: "fixed", amount: "₹14,999", amountValue: 14999, origin: "dashboard",
    payments: 96, revenue: "₹14,39,904", status: "Active", created: "20 Dec 2024, 12:05",
    brandColor: ACCENT, buttonStyle: "solid",
  },
  {
    id: "PB-ENK-MEMBER", reference: "PBNC58M2", title: "Annual membership", buttonLabel: "Renew membership",
    merchantName: MERCHANT, amountMode: "fixed", amount: "₹2,999", amountValue: 2999, origin: "dashboard",
    payments: 0, revenue: "₹0", status: "Draft", created: "11 Jan 2025, 16:40",
    brandColor: ACCENT, buttonStyle: "outline",
  },
  {
    id: "PB-ENK-TOPUP", reference: "PBND13QT", title: "Wallet top-up", buttonLabel: "Add money",
    merchantName: MERCHANT, amountMode: "customer", amount: "Customer decides", origin: "dashboard",
    payments: 1340, revenue: "₹8,52,300", status: "Inactive", created: "28 Oct 2024, 09:15",
    brandColor: ACCENT, buttonStyle: "solid",
  },
  {
    id: "PB-ENK-CHKOUT", reference: "PBNE66ZP", title: "Storefront checkout", buttonLabel: "Pay Now",
    merchantName: MERCHANT, amountMode: "customer", amount: "Set per order", origin: "api",
    payments: 5230, revenue: "₹41,18,600", status: "Active", created: "05 Nov 2024, 11:00",
    brandColor: ACCENT, buttonStyle: "solid",
  },
];

// ── Dashboard headline metrics — every number is one a PG actually reports ────
export const BUTTON_DASHBOARD_METRICS = {
  totalButtons: 5,
  statusCounts: { active: 3, draft: 1, inactive: 1 },

  totalCollected: "₹67.3L",
  collectedTrend: [38, 52, 47, 63, 59, 78, 91],
  collectedDeltaPct: 14,

  successfulPayments: 7148,
  successRate: 91,
  successTrend: [120, 180, 165, 240, 300, 360, 470],

  failedAttempts: 706,
  failedTrend: [110, 92, 101, 70, 64, 55, 49],
  failedDeltaPct: -6,
} as const;

// ── Payments — every row carries buttonId (its reference) + its own payment id ─
export interface ButtonTxn {
  id: string;
  buttonId: string;      // ← attribution: which button was clicked
  customer: string;      // payer's email / phone (masked)
  method: string;        // UPI / Card / Netbanking / Wallet
  payId: string;         // unique per payment
  amount: string;
  status: "Success" | "Failed" | "Refunded";
  time: string;
}

export const BUTTON_TRANSACTIONS: ButtonTxn[] = [
  { id: "TXN-B01", buttonId: "PB-ENK-COURSE", customer: "ar**v@gmail.com", method: "Card", payId: "pay_PB7100982231", amount: "₹14,999", status: "Success", time: "28 Dec 2024, 11:24" },
  { id: "TXN-B02", buttonId: "PB-ENK-DONATE", customer: "9xxxx2317", method: "UPI", payId: "pay_PB2034117765", amount: "₹500", status: "Success", time: "28 Dec 2024, 11:09" },
  { id: "TXN-B03", buttonId: "PB-ENK-CHKOUT", customer: "me**a@okaxis", method: "UPI", payId: "pay_PB9044556610", amount: "₹2,340", status: "Success", time: "28 Dec 2024, 10:52" },
  { id: "TXN-B04", buttonId: "PB-ENK-DONATE", customer: "pr**ti@oksbi", method: "Netbanking", payId: "pay_PB6512094432", amount: "₹1,000", status: "Failed", time: "28 Dec 2024, 10:34" },
  { id: "TXN-B05", buttonId: "PB-ENK-CHKOUT", customer: "7xxxx1180", method: "UPI", payId: "pay_PB0187654221", amount: "₹990", status: "Success", time: "28 Dec 2024, 10:19" },
  { id: "TXN-B06", buttonId: "PB-ENK-COURSE", customer: "an**ta@gmail.com", method: "Card", payId: "pay_PB1209873340", amount: "₹14,999", status: "Refunded", time: "27 Dec 2024, 18:46" },
  { id: "TXN-B07", buttonId: "PB-ENK-CHKOUT", customer: "vi**y@ybl", method: "UPI", payId: "pay_PB7320948811", amount: "₹560", status: "Success", time: "27 Dec 2024, 17:15" },
  { id: "TXN-B08", buttonId: "PB-ENK-DONATE", customer: "9xxxx7752", method: "UPI", payId: "pay_PB8245660934", amount: "₹250", status: "Success", time: "27 Dec 2024, 15:50" },
  { id: "TXN-B09", buttonId: "PB-ENK-CHKOUT", customer: "ka**l@okhdfc", method: "Card", payId: "pay_PB4652091178", amount: "₹4,300", status: "Success", time: "27 Dec 2024, 14:12" },
  { id: "TXN-B10", buttonId: "PB-ENK-COURSE", customer: "su**t@gmail.com", method: "Netbanking", payId: "pay_PB5134228876", amount: "₹14,999", status: "Success", time: "26 Dec 2024, 19:40" },
];

export const txnsForButton = (buttonId: string): ButtonTxn[] => BUTTON_TRANSACTIONS.filter(t => t.buttonId === buttonId);

export const successRateForButton = (buttonId: string): number | null => {
  const list = txnsForButton(buttonId).filter(t => t.status !== "Refunded");
  if (list.length === 0) return null;
  return Math.round((list.filter(t => t.status === "Success").length / list.length) * 100);
};
