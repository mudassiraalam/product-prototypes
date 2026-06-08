import type { QrData, AmountMode, Usage } from "./qr-wizard-steps";
import { qrMatrix } from "./qr-encoder";

export type QrStatus = "Active" | "Inactive" | "Draft" | "Expired";

export interface QrCode {
  id: string;
  label: string;
  merchantName: string;
  vpa: string;
  usage: Usage;
  amountMode: AmountMode;
  amount: string;        // display: "₹499" / "Any amount" / "Set per bill"
  location: string;
  payments: number;      // successful payments (real, attributable per code)
  revenue: string;
  status: QrStatus;
  created: string;
  brandColor: string;
  standeeTheme: "light" | "dark";
  draftData?: QrData;
  lastStep?: number;
}

// ── UPI deep-link builder ─────────────────────────────────────────────────────
// A UPI QR encodes a `upi://pay?...` string that opens the customer's UPI app
// directly with the amount pre-filled — it is NOT a web URL.
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

// ── Seed rows — one of each status, both usages, both amount modes ────────────
export const INITIAL_QRS: QrCode[] = [
  {
    id: "QR-ENK-CNTR01", label: "Front Counter", merchantName: "Brew & Bean Cafe", vpa: "brewbean@okhdfcbank",
    usage: "reusable", amountMode: "any", amount: "Any amount", location: "Main counter",
    payments: 2774, revenue: "₹4,16,100", status: "Active", created: "02 Jan 2025, 09:10",
    brandColor: "#0891b2", standeeTheme: "light",
  },
  {
    id: "QR-ENK-STALL7", label: "Tea Stall", merchantName: "Sharma Chai Point", vpa: "sharmachai@okaxis",
    usage: "reusable", amountMode: "any", amount: "Any amount", location: "Stall 7, Food Court",
    payments: 5102, revenue: "₹2,71,440", status: "Active", created: "18 Dec 2024, 07:30",
    brandColor: "#ea580c", standeeTheme: "dark",
  },
  {
    id: "QR-ENK-EVENT3", label: "Entry — Music Night", merchantName: "The Backyard", vpa: "backyard@okicici",
    usage: "reusable", amountMode: "fixed", amount: "₹499", location: "Gate A",
    payments: 612, revenue: "₹3,05,388", status: "Inactive", created: "20 Dec 2024, 18:00",
    brandColor: "#7c3aed", standeeTheme: "dark",
  },
  {
    id: "QR-ENK-DESK02", label: "Reception Desk", merchantName: "EnKash Demo", vpa: "enkashdemo@okhdfcbank",
    usage: "onetime", amountMode: "fixed", amount: "Set per bill", location: "Lobby",
    payments: 0, revenue: "₹0", status: "Draft", created: "28 Dec 2024, 12:05",
    brandColor: "#1c5af4", standeeTheme: "light",
  },
  {
    id: "QR-ENK-FEST24", label: "Diwali Mela Stall", merchantName: "Craft Collective", vpa: "craftco@oksbi",
    usage: "reusable", amountMode: "any", amount: "Any amount", location: "Mela Stall 12",
    payments: 1331, revenue: "₹1,98,400", status: "Expired", created: "28 Oct 2024, 16:40",
    brandColor: "#16a34a", standeeTheme: "light",
  },
];

// ── Dashboard headline metrics — every number is one a PSP actually reports ───
// (No "scans" or "scan→pay": a printed QR cannot report a scan back to anyone.)
// Mirrors the Payment Pages dashboard exactly: 2 graph metrics (Collected,
// Failed) + 2 breakdown metrics (Total codes by status, Successful payments).
// Failed is a "bad" metric, so its trend DESCENDS and the delta is negative —
// the card flips the colour to green (a falling failure count is good news),
// identical to the Pages treatment.
export const QR_DASHBOARD_METRICS = {
  totalCodes: 5,
  statusCounts: { active: 2, draft: 1, inactive: 1, expired: 1 },

  totalCollected: "₹11.9L",
  collectedTrend: [28, 22, 40, 32, 50, 42, 60],
  collectedDeltaPct: 18,

  successfulPayments: 9819,
  successRate: 93,
  successThisWeek: 1204,
  avgPayment: "₹121",

  failedAttempts: 712,
  failedTrend: [56, 48, 51, 40, 36, 31, 24],
  failedDeltaPct: -4,
} as const;

// ── Recent payments — what really settles back: masked payer VPA + UTR ────────
export const QR_TRANSACTIONS = [
  { id: "TXN-Q01", payerVpa: "9xxxx2317@ybl", utr: "447100982231", amount: "₹249", status: "Success", time: "28 Dec 2024, 11:22" },
  { id: "TXN-Q02", payerVpa: "ra**sh@okhdfc", utr: "882034117765", amount: "₹60", status: "Success", time: "28 Dec 2024, 11:05" },
  { id: "TXN-Q03", payerVpa: "8xxxx9043@apl", utr: "129044556610", amount: "₹249", status: "Failed", time: "28 Dec 2024, 10:51" },
  { id: "TXN-Q04", payerVpa: "pr**ti@oksbi", utr: "776512094432", amount: "₹120", status: "Success", time: "28 Dec 2024, 10:33" },
  { id: "TXN-Q05", payerVpa: "7xxxx1180@ybl", utr: "330187654221", amount: "₹40", status: "Success", time: "28 Dec 2024, 10:18" },
];
