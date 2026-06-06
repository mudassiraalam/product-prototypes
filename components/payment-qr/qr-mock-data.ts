import type { QrData, PriceMode } from "./qr-wizard-steps";

export type QrStatus = "Active" | "Inactive" | "Draft" | "Expired";

// A saved QR row (what the dashboard lists). Mirrors PaymentPage in spirit but
// the scoreboard is QR-world: scans & collections at a counter, not page views.
export interface QrCode {
  id: string;
  label: string;          // merchant's internal name
  merchantName: string;
  vpa: string;
  priceMode: PriceMode;
  amount: string;         // display string, e.g. "₹249" / "Any amount" / "₹20 – ₹120"
  location: string;       // which counter / stall this code lives at
  scans: number;
  collections: number;    // successful payments
  revenue: string;
  status: QrStatus;
  created: string;
  brandColor: string;
  standeeTheme: "light" | "dark";
  // Lossless builder state for drafts / in-session edits (seed rows omit it).
  draftData?: QrData;
  lastStep?: number;
}

// ── UPI deep-link builder ─────────────────────────────────────────────────────
// A UPI QR is NOT a web URL — it encodes a `upi://pay?...` string that opens
// GPay / PhonePe / Paytm directly with the amount pre-filled. This is the correct,
// industry-standard behaviour (Razorpay & Cashfree QRs do the same).
export function upiString(opts: {
  vpa: string; name: string; amount?: string; note?: string; ref?: string;
}): string {
  const p = new URLSearchParams();
  p.set("pa", opts.vpa || "merchant@upi");
  p.set("pn", opts.name || "Merchant");
  p.set("cu", "INR");
  if (opts.amount && parseFloat(opts.amount) > 0) p.set("am", parseFloat(opts.amount).toFixed(2));
  if (opts.ref) p.set("tr", opts.ref);
  if (opts.note) p.set("tn", opts.note);
  // URLSearchParams encodes spaces as "+"; UPI apps want %20.
  return "upi://pay?" + p.toString().replace(/\+/g, "%20");
}

// A short order reference for dynamic codes.
export const genQrRef = () => "ENK" + Math.random().toString(36).slice(2, 8).toUpperCase();

// ── Seed rows — exercise every price mode + status ───────────────────────────
export const INITIAL_QRS: QrCode[] = [
  {
    id: "QR-ENK-CNTR01",
    label: "Front Counter",
    merchantName: "Brew & Bean Café",
    vpa: "brewbean@okhdfcbank",
    priceMode: "any",
    amount: "Any amount",
    location: "Main counter",
    scans: 3120, collections: 2774, revenue: "₹4,16,100",
    status: "Active",
    created: "02 Jan 2025, 09:10",
    brandColor: "#0891b2",
    standeeTheme: "light",
  },
  {
    id: "QR-ENK-MENU07",
    label: "Tea Stall Menu",
    merchantName: "Sharma Chai Point",
    vpa: "sharmachai@okaxis",
    priceMode: "menu",
    amount: "₹20 – ₹120",
    location: "Stall 7, Food Court",
    scans: 5840, collections: 5102, revenue: "₹2,71,440",
    status: "Active",
    created: "18 Dec 2024, 07:30",
    brandColor: "#ea580c",
    standeeTheme: "dark",
  },
  {
    id: "QR-ENK-EVENT3",
    label: "Entry — Music Night",
    merchantName: "The Backyard",
    vpa: "backyard@okicici",
    priceMode: "fixed",
    amount: "₹499",
    location: "Gate A",
    scans: 980, collections: 612, revenue: "₹3,05,388",
    status: "Inactive",
    created: "20 Dec 2024, 18:00",
    brandColor: "#7c3aed",
    standeeTheme: "dark",
  },
  {
    id: "QR-ENK-DESK02",
    label: "Reception Desk",
    merchantName: "EnKash Demo",
    vpa: "enkashdemo@okhdfcbank",
    priceMode: "fixed",
    amount: "₹1,200",
    location: "Lobby",
    scans: 42, collections: 0, revenue: "₹0",
    status: "Draft",
    created: "28 Dec 2024, 12:05",
    brandColor: "#1c5af4",
    standeeTheme: "light",
  },
  {
    id: "QR-ENK-FEST24",
    label: "Diwali Mela Stall",
    merchantName: "Craft Collective",
    vpa: "craftco@oksbi",
    priceMode: "any",
    amount: "Any amount",
    location: "Mela Stall 12",
    scans: 1560, collections: 1331, revenue: "₹1,98,400",
    status: "Expired",
    created: "28 Oct 2024, 16:40",
    brandColor: "#16a34a",
    standeeTheme: "light",
  },
];

// ── Dashboard headline metrics (illustrative for the prototype) ───────────────
export const QR_DASHBOARD_METRICS = {
  totalScans: 11542,
  totalCollections: 9819,
  // scan → pay conversion, the QR-world equivalent of a page conversion rate.
  conversionPct: 85,
  activeCodes: 2,
  // 7-day scans trend (rising).
  scansTrend: [980, 1120, 1040, 1310, 1280, 1520, 1690],
  // method split is always ~100% UPI for QR — that's the point of the product.
  methodSplit: [{ method: "UPI", pct: 100 }],
} as const;

export const QR_TRANSACTIONS = [
  { id: "TXN-Q01", customer: "UPI ref 4471…", amount: "₹249", status: "Success", date: "28 Dec 2024, 11:22", app: "PhonePe" },
  { id: "TXN-Q02", customer: "UPI ref 8820…", amount: "₹60", status: "Success", date: "28 Dec 2024, 11:05", app: "GPay" },
  { id: "TXN-Q03", customer: "UPI ref 1290…", amount: "₹249", status: "Failed", date: "28 Dec 2024, 10:51", app: "Paytm" },
  { id: "TXN-Q04", customer: "UPI ref 7765…", amount: "₹120", status: "Success", date: "28 Dec 2024, 10:33", app: "GPay" },
  { id: "TXN-Q05", customer: "UPI ref 3301…", amount: "₹40", status: "Success", date: "28 Dec 2024, 10:18", app: "PhonePe" },
];
