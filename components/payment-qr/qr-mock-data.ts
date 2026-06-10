import type { QrData, AmountMode, Usage } from "./qr-wizard-steps";
import { qrMatrix } from "./qr-encoder";

export type QrStatus = "Active" | "Inactive" | "Draft" | "Expired";

// ──────────────────────────────────────────────────────────────────────────────
// Attribution model (how a PSP knows WHICH QR a payment came through):
//   • All of a merchant's QRs can share ONE settlement VPA (`pa`) — that's just
//     where the money lands.
//   • Each QR carries its own unique REFERENCE (`tr` in the upi:// string).
//     The reference rides back with every payment, so each payment maps to the
//     exact QR that was scanned — even with an identical VPA on every code.
//   • Each individual payment is separated by its UTR (the UPI rail's own id).
// ──────────────────────────────────────────────────────────────────────────────

export interface QrCode {
  id: string;
  reference: string;     // unique per QR → encoded as `tr`; attribution key
  label: string;
  merchantName: string;
  vpa: string;           // shared settlement VPA across all this merchant's QRs
  usage: Usage;
  amountMode: AmountMode;
  amount: string;        // display: "₹499" / "Any amount" / "Set per bill"
  location: string;
  payments: number;      // successful payments attributed to this code
  revenue: string;
  status: QrStatus;
  created: string;
  brandColor: string;
  standeeTheme: "light" | "dark";
  draftData?: QrData;
  lastStep?: number;
}

// ── UPI deep-link builder ─────────────────────────────────────────────────────
// A UPI QR encodes a `upi://pay?...` string that opens the customer's UPI app.
// `pa` = settlement VPA (can be shared) · `tr` = per-QR reference (attribution)
// `am` = amount (dynamic only) — the ONLY field that differs static vs dynamic.
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

// ── Seed rows — ONE merchant, ONE shared VPA, 3 static + 2 dynamic ────────────
const MERCHANT = "EnKash Demo Store";
const SHARED_VPA = "enkashstore@okhdfcbank";

export const INITIAL_QRS: QrCode[] = [
  {
    id: "QR-ENK-CNTR01", reference: "ENKA91X4", label: "Front Counter", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "any", amount: "Any amount", location: "Main counter",
    payments: 2774, revenue: "₹4,16,100", status: "Active", created: "02 Jan 2025, 09:10",
    brandColor: "#1c5af4", standeeTheme: "light",
  },
  {
    id: "QR-ENK-GATE02", reference: "ENKB72K9", label: "Entry Gate", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "fixed", amount: "₹100", location: "Gate A",
    payments: 612, revenue: "₹61,200", status: "Active", created: "18 Dec 2024, 07:30",
    brandColor: "#1c5af4", standeeTheme: "dark",
  },
  {
    id: "QR-ENK-STALL3", reference: "ENKC58M2", label: "Stall #3", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "reusable", amountMode: "any", amount: "Any amount", location: "Expo stall 3",
    payments: 1331, revenue: "₹1,98,400", status: "Expired", created: "28 Oct 2024, 16:40",
    brandColor: "#1c5af4", standeeTheme: "light",
  },
  {
    id: "QR-ENK-BILL04", reference: "ENKD13QT", label: "Billing Screen", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "onetime", amountMode: "fixed", amount: "Set per bill", location: "Checkout 1",
    payments: 5102, revenue: "₹5,21,440", status: "Active", created: "20 Dec 2024, 18:00",
    brandColor: "#1c5af4", standeeTheme: "light",
  },
  {
    id: "QR-ENK-DLVR05", reference: "ENKE66ZP", label: "Delivery QR", merchantName: MERCHANT, vpa: SHARED_VPA,
    usage: "onetime", amountMode: "fixed", amount: "Set per bill", location: "Field delivery",
    payments: 388, revenue: "₹97,310", status: "Inactive", created: "05 Nov 2024, 12:05",
    brandColor: "#1c5af4", standeeTheme: "dark",
  },
];

// ── Dashboard headline metrics — every number is one a PSP actually reports ───
// (No "scans" or "scan→pay": a printed QR cannot report a scan back to anyone.)
export const QR_DASHBOARD_METRICS = {
  totalCodes: 5,
  statusCounts: { active: 3, draft: 0, inactive: 1, expired: 1 },

  totalCollected: "₹12.9L",
  collectedTrend: [44, 39, 58, 52, 71, 64, 96],
  collectedDeltaPct: 18,

  successfulPayments: 10207,
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
  { id: "TXN-Q02", qrId: "QR-ENK-BILL04", payerVpa: "ra**sh@okhdfc", utr: "882034117765", amount: "₹1,250", status: "Success", time: "28 Dec 2024, 11:05" },
  { id: "TXN-Q03", qrId: "QR-ENK-CNTR01", payerVpa: "8xxxx9043@apl", utr: "129044556610", amount: "₹249", status: "Failed", time: "28 Dec 2024, 10:51" },
  { id: "TXN-Q04", qrId: "QR-ENK-GATE02", payerVpa: "pr**ti@oksbi", utr: "776512094432", amount: "₹100", status: "Success", time: "28 Dec 2024, 10:33" },
  { id: "TXN-Q05", qrId: "QR-ENK-BILL04", payerVpa: "7xxxx1180@ybl", utr: "330187654221", amount: "₹990", status: "Success", time: "28 Dec 2024, 10:18" },
  { id: "TXN-Q06", qrId: "QR-ENK-CNTR01", payerVpa: "an**ta@okicici", utr: "551209873340", amount: "₹80", status: "Success", time: "28 Dec 2024, 09:56" },
  { id: "TXN-Q07", qrId: "QR-ENK-DLVR05", payerVpa: "6xxxx4421@ptm", utr: "204876119923", amount: "₹560", status: "Failed", time: "28 Dec 2024, 09:41" },
  { id: "TXN-Q08", qrId: "QR-ENK-GATE02", payerVpa: "vi**ay@ybl", utr: "667320948811", amount: "₹100", status: "Success", time: "28 Dec 2024, 09:27" },
  { id: "TXN-Q09", qrId: "QR-ENK-STALL3", payerVpa: "9xxxx7752@oksbi", utr: "118245660934", amount: "₹520", status: "Success", time: "27 Dec 2024, 18:44" },
  { id: "TXN-Q10", qrId: "QR-ENK-BILL04", payerVpa: "me**na@okaxis", utr: "905134228876", amount: "₹2,340", status: "Success", time: "27 Dec 2024, 17:12" },
  { id: "TXN-Q11", qrId: "QR-ENK-DLVR05", payerVpa: "8xxxx0915@apl", utr: "443652091178", amount: "₹430", status: "Success", time: "27 Dec 2024, 15:50" },
  { id: "TXN-Q12", qrId: "QR-ENK-CNTR01", payerVpa: "ku**al@ybl", utr: "771204956623", amount: "₹150", status: "Success", time: "27 Dec 2024, 14:36" },
];

export const txnsForQr = (qrId: string): QrTxn[] => QR_TRANSACTIONS.filter(t => t.qrId === qrId);

export const successRateForQr = (qrId: string): number | null => {
  const list = txnsForQr(qrId);
  if (list.length === 0) return null;
  return Math.round((list.filter(t => t.status === "Success").length / list.length) * 100);
};
