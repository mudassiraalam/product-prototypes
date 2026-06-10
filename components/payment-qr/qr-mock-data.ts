import type { QrData, AmountMode, Usage, CardColorMode, LayoutVariant, ScreenTheme } from "./qr-wizard-steps";
import { qrMatrix } from "./qr-encoder";

export type QrStatus = "Active" | "Inactive" | "Draft" | "Expired";
export type QrOrigin = "dashboard" | "api";

// ──────────────────────────────────────────────────────────────────────────────
// Merchant profile — the KYC-verified identity captured at onboarding.
// Business name + settlement VPA are sourced from here, never merchant-typed:
// free-typing either would let money route to an unverified account or show
// payers a name that doesn't match the registered entity.
// Modeled with MULTIPLE verified settlement accounts: the merchant PICKS one
// per QR from a dropdown — they can never type a new one here. Accounts are
// added and verified through KYC, elsewhere.
// [VERIFY with Pallav: does EnKash support multiple settlement VPAs per
//  merchant? If single-account, the picker collapses to a read-only field.]
// ──────────────────────────────────────────────────────────────────────────────
export const MERCHANT_PROFILE = {
  businessName: "EnKash Demo Store",
  vpas: [
    { vpa: "enkashstore@okhdfcbank", bank: "HDFC Bank ····4521" },
    { vpa: "enkashstore@okicici", bank: "ICICI Bank ····0093" },
    { vpa: "enkashstore.events@okaxis", bank: "Axis Bank ····7718" },
  ],
} as const;

export const PRIMARY_VPA = MERCHANT_PROFILE.vpas[0].vpa;

// ──────────────────────────────────────────────────────────────────────────────
// Attribution model (how a PSP knows WHICH QR a payment came through):
//   • All of a merchant's QRs can share ONE settlement VPA (`pa`) — that's just
//     where the money lands.
//   • Each QR carries its own unique REFERENCE (`tr` in the upi:// string).
//     The reference rides back with every payment, so each payment maps to the
//     exact QR that was scanned — even with an identical VPA on every code.
//   • Each individual payment is separated by its UTR (the UPI rail's own id).
//
// Origin model (who minted the QR):
//   • dashboard — authored by a person in the create wizard (reusable standee
//     or one-time collect QR).
//   • api — minted by the merchant's own system at transaction time (checkout,
//     delivery app, kiosk). Visible in the ledger, read-only here.
// ──────────────────────────────────────────────────────────────────────────────

export interface QrCode {
  id: string;
  reference: string;     // unique per QR → encoded as `tr`; attribution key
  label: string;
  merchantName: string;
  vpa: string;           // shared settlement VPA across all this merchant's QRs
  usage: Usage;
  amountMode: AmountMode;
  amount: string;        // display: "₹499" / "Any amount" / "₹249 · one-time" / "Set per bill"
  amountValue?: number;  // numeric amount when one exists (fixed / one-time)
  origin: QrOrigin;
  location: string;
  payments: number;      // successful payments attributed to this code
  revenue: string;
  status: QrStatus;
  created: string;
  // standee design (addendum-bounded)
  brandColor: string;
  cardColorMode: CardColorMode;
  layoutVariant: LayoutVariant;
  showMerchantName: boolean;
  centerLogo: boolean;
  screenTheme: ScreenTheme;
  showMerchantLogo: boolean;
  draftData?: QrData;
  lastStep?: number;
}

// ── UPI deep-link builder ─────────────────────────────────────────────────────
// A UPI QR encodes a `upi://pay?...` string that opens the customer's UPI app.
// `pa` = settlement VPA (can be shared) · `tr` = per-QR reference (attribution)
// `am` = amount — the ONLY field that differs static vs dynamic.
export function upiString(opts: { vpa: string; name: string; amount?: string; note?: string; ref?: string }): string {
  const p = new URLSearchParams();
  p.set("pa", opts.vpa || "merchant@upi");
  p.set("pn", opts.name || "Merchant");
  p.set("cu", "INR");
  if (opts.amount && parseFloat(opts.amount) > 0) p.set("am", parseFloat(opts.amount).toFixed(2));
  if (opts.ref) p.set("tr", opts.ref);
  if (opts.note) p.set("tn", opts.note);
  return "upi://pay?" + p.toString().replace(/\+/g, "%20");
}

export const genQrRef = () => "ENK" + Math.random().toString(36).slice(2, 8).toUpperCase();

// ── Download a scannable QR as a PNG (makes the dashboard/detail button real) ──
export function downloadQrPng(text: string, filename: string, scale = 16) {
  try {
    const m = qrMatrix(text);
    const n = m.length, quiet = 4, dim = (n + quiet * 2) * scale;
    const canvas = document.createElement("canvas");
    canvas.width = dim; canvas.height = dim;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = "#0f172a";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (m[y][x]) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png";
    a.click();
  } catch { /* no-op in non-browser contexts */ }
}

// ── Seed rows — ONE merchant, ONE shared VPA ──────────────────────────────────
// 3 dashboard-authored reusable standees, 1 dashboard-authored one-time QR,
// 2 API-minted transaction QRs (read-only in this UI).
const MERCHANT = MERCHANT_PROFILE.businessName;
const SHARED_VPA = PRIMARY_VPA;
const DESIGN_DEFAULTS = { brandColor: "#1c5af4", cardColorMode: "white" as CardColorMode, layoutVariant: "bhimTop" as LayoutVariant, showMerchantName: true, centerLogo: false, screenTheme: "light" as ScreenTheme, showMerchantLogo: true };

export const INITIAL_QRS: QrCode[] = [
  {
    id: "QR-ENK-CNTR01", reference: "ENKA91X4", label: "Front Counter", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "any", amount: "Any amount", origin: "dashboard", location: "Main counter",
    payments: 2774, revenue: "₹4,16,100", status: "Active", created: "02 Jan 2025, 09:10",
    ...DESIGN_DEFAULTS,
  },
  {
    id: "QR-ENK-GATE02", reference: "ENKB72K9", label: "Entry Gate", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "fixed", amount: "₹100", amountValue: 100, origin: "dashboard", location: "Gate A",
    payments: 612, revenue: "₹61,200", status: "Active", created: "18 Dec 2024, 07:30",
    ...DESIGN_DEFAULTS, cardColorMode: "brand",
  },
  {
    id: "QR-ENK-STALL3", reference: "ENKC58M2", label: "Stall #3", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "any", amount: "Any amount", origin: "dashboard", location: "Expo stall 3",
    payments: 1331, revenue: "₹1,98,400", status: "Expired", created: "28 Oct 2024, 16:40",
    ...DESIGN_DEFAULTS,
  },
  {
    id: "QR-ENK-COLL04", reference: "ENKD13QT", label: "Counter due — Mehta Traders", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "onetime", amountMode: "fixed", amount: "₹12,500 · one-time", amountValue: 12500, origin: "dashboard", location: "Collected at counter",
    payments: 1, revenue: "₹12,500", status: "Expired", created: "20 Dec 2024, 18:00",
    ...DESIGN_DEFAULTS,
  },
  {
    id: "QR-ENK-BILL05", reference: "ENKE66ZP", label: "Checkout 1 (POS)", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "onetime", amountMode: "fixed", amount: "Set per bill", origin: "api", location: "Billing system",
    payments: 5102, revenue: "₹5,21,440", status: "Active", created: "05 Nov 2024, 12:05",
    ...DESIGN_DEFAULTS,
  },
  {
    id: "QR-ENK-DLVR06", reference: "ENKF20RH", label: "Delivery app", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "onetime", amountMode: "fixed", amount: "Set per order", origin: "api", location: "Field delivery",
    payments: 388, revenue: "₹97,310", status: "Active", created: "11 Nov 2024, 09:45",
    ...DESIGN_DEFAULTS,
  },
];

// ── Dashboard headline metrics — every number is one a PSP actually reports ───
// (No "scans" or "scan→pay": a printed QR cannot report a scan back to anyone.)
export const QR_DASHBOARD_METRICS = {
  totalCodes: 6,
  statusCounts: { active: 4, draft: 0, inactive: 0, expired: 2 },

  totalCollected: "₹13.1L",
  collectedTrend: [44, 39, 58, 52, 71, 64, 96],
  collectedDeltaPct: 18,

  successfulPayments: 10208,
  successRate: 93,
  successTrend: [180, 240, 220, 310, 360, 420, 540],

  failedAttempts: 712,
  failedTrend: [128, 96, 112, 80, 73, 60, 41],
  failedDeltaPct: -4,
} as const;

// ── Payments — every row carries qrId (via the QR's reference) + its own UTR ──
export interface QrTxn {
  id: string;
  qrId: string;          // ← attribution: which QR was scanned
  payerVpa: string;
  utr: string;           // unique per payment (UPI rail id)
  amount: string;
  status: "Success" | "Failed";
  time: string;
}

export const QR_TRANSACTIONS: QrTxn[] = [
  { id: "TXN-Q01", qrId: "QR-ENK-CNTR01", payerVpa: "9xxxx2317@ybl", utr: "447100982231", amount: "₹249", status: "Success", time: "28 Dec 2024, 11:22" },
  { id: "TXN-Q02", qrId: "QR-ENK-BILL05", payerVpa: "ra**sh@okhdfc", utr: "882034117765", amount: "₹1,250", status: "Success", time: "28 Dec 2024, 11:05" },
  { id: "TXN-Q03", qrId: "QR-ENK-CNTR01", payerVpa: "8xxxx9043@apl", utr: "129044556610", amount: "₹249", status: "Failed", time: "28 Dec 2024, 10:51" },
  { id: "TXN-Q04", qrId: "QR-ENK-GATE02", payerVpa: "pr**ti@oksbi", utr: "776512094432", amount: "₹100", status: "Success", time: "28 Dec 2024, 10:33" },
  { id: "TXN-Q05", qrId: "QR-ENK-BILL05", payerVpa: "7xxxx1180@ybl", utr: "330187654221", amount: "₹990", status: "Success", time: "28 Dec 2024, 10:18" },
  { id: "TXN-Q06", qrId: "QR-ENK-CNTR01", payerVpa: "an**ta@okicici", utr: "551209873340", amount: "₹80", status: "Success", time: "28 Dec 2024, 09:56" },
  { id: "TXN-Q07", qrId: "QR-ENK-DLVR06", payerVpa: "6xxxx4421@ptm", utr: "204876119923", amount: "₹560", status: "Failed", time: "28 Dec 2024, 09:41" },
  { id: "TXN-Q08", qrId: "QR-ENK-GATE02", payerVpa: "vi**ay@ybl", utr: "667320948811", amount: "₹100", status: "Success", time: "28 Dec 2024, 09:27" },
  { id: "TXN-Q09", qrId: "QR-ENK-STALL3", payerVpa: "9xxxx7752@oksbi", utr: "118245660934", amount: "₹520", status: "Success", time: "27 Dec 2024, 18:44" },
  { id: "TXN-Q10", qrId: "QR-ENK-BILL05", payerVpa: "me**na@okaxis", utr: "905134228876", amount: "₹2,340", status: "Success", time: "27 Dec 2024, 17:12" },
  { id: "TXN-Q11", qrId: "QR-ENK-DLVR06", payerVpa: "8xxxx0915@apl", utr: "443652091178", amount: "₹430", status: "Success", time: "27 Dec 2024, 15:50" },
  { id: "TXN-Q12", qrId: "QR-ENK-COLL04", payerVpa: "mehta**@okhdfc", utr: "771204956623", amount: "₹12,500", status: "Success", time: "20 Dec 2024, 18:42" },
];

export const txnsForQr = (qrId: string): QrTxn[] => QR_TRANSACTIONS.filter(t => t.qrId === qrId);

export const successRateForQr = (qrId: string): number | null => {
  const list = txnsForQr(qrId);
  if (list.length === 0) return null;
  return Math.round((list.filter(t => t.status === "Success").length / list.length) * 100);
};
