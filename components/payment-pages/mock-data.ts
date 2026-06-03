export type PageStatus = "Active" | "Inactive" | "Draft" | "Expired" | "Archived";

// Primary type — matches the 2 creation flows.
// Sub-categories (Donation / Event Tickets / Fixed Price / etc.) are derived
// from amountType + isDonation + itemsAreTickets and shown via the row icon,
// not as a label the merchant explicitly selected.
export type PageType = "Standard Page" | "Invoice";

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  amountType: "fixed" | "customer" | "multiple";
  isDonation?: boolean;
  itemsAreTickets?: boolean;
  amount: string;
  views: number;
  payments: number;
  revenue: string;
  status: PageStatus;
  created: string;
  expires?: string;
  brandColor: string;
  buttonLabel: string;
  theme: "light" | "dark";
  layout: "centered" | "wide";
  description?: string;
}

// 5 examples — each demonstrates a different page configuration the new
// 2-flow architecture can produce. Together they exercise every conditional
// branch in the wizard (fixed / customer-decides / multiple-items, with the
// donation and tickets refinements).
export const INITIAL_PAGES: PaymentPage[] = [
  // ── Page · Event Tickets (Multiple Items + itemsAreTickets) ─────────────
  {
    id: "PP-ENK-CONF2024",
    title: "Tech Summit 2024 Registration",
    slug: "tech-summit-2024",
    type: "Standard Page",
    amountType: "multiple",
    itemsAreTickets: true,
    amount: "₹999 – ₹4,999",
    views: 1842,
    payments: 326,
    revenue: "₹9,77,674",
    status: "Active",
    created: "15 Nov 2024, 10:30",
    brandColor: "#7c3aed",
    buttonLabel: "Register Now",
    theme: "light",
    layout: "centered",
    description: "Join us for India's biggest tech conference. Network with 1000+ professionals across 3 tracks.",
  },

  // ── Page · Donation (Customer Decides + isDonation) ─────────────────────
  {
    id: "PP-ENK-DIWALI24",
    title: "Diwali Charity Drive 2024",
    slug: "diwali-charity-2024",
    type: "Standard Page",
    amountType: "customer",
    isDonation: true,
    amount: "Any amount",
    views: 4210,
    payments: 918,
    revenue: "₹18,36,000",
    status: "Active",
    created: "01 Oct 2024, 08:00",
    brandColor: "#ea580c",
    buttonLabel: "Donate Now",
    theme: "light",
    layout: "centered",
    description: "Help us bring joy to underprivileged children this Diwali. 80G receipts available.",
  },

  // ── Invoice ─────────────────────────────────────────────────────────────
  {
    id: "PP-ENK-VENDOR42",
    title: "Vendor Invoice — Acme Corp Q4",
    slug: "vendor-acme-q4-2024",
    type: "Invoice",
    amountType: "fixed",
    amount: "₹85,000",
    views: 14,
    payments: 1,
    revenue: "₹85,000",
    status: "Active",
    created: "20 Dec 2024, 14:18",
    expires: "31 Jan 2025",
    brandColor: "#1c5af4",
    buttonLabel: "Pay Invoice",
    theme: "light",
    layout: "centered",
  },

  // ── Page · Fixed Price (Fixed) ──────────────────────────────────────────
  {
    id: "PP-ENK-COURSE01",
    title: "React Masterclass — Jan Batch",
    slug: "react-masterclass-jan",
    type: "Standard Page",
    amountType: "fixed",
    amount: "₹4,999",
    views: 672,
    payments: 48,
    revenue: "₹2,39,952",
    status: "Inactive",
    created: "10 Dec 2024, 09:00",
    brandColor: "#0891b2",
    buttonLabel: "Enroll Now",
    theme: "light",
    layout: "wide",
    description: "8-week intensive React bootcamp. Live sessions, project reviews, job referrals.",
  },

  // ── Page · Multiple Items (Multiple Items, non-tickets) ─────────────────
  {
    id: "PP-ENK-MERCH05",
    title: "EnKash Branded Merchandise",
    slug: "enkash-merch",
    type: "Standard Page",
    amountType: "multiple",
    amount: "₹499 – ₹2,499",
    views: 234,
    payments: 0,
    revenue: "₹0",
    status: "Draft",
    created: "26 Dec 2024, 17:42",
    brandColor: "#1c5af4",
    buttonLabel: "Buy Now",
    theme: "dark",
    layout: "wide",
    description: "T-shirts, hoodies, mugs and notebooks featuring the EnKash brand.",
  },

  // ── Archived (last year's event) ────────────────────────────────────────
  {
    id: "PP-ENK-CONF2023",
    title: "Tech Summit 2023 (Archived)",
    slug: "tech-summit-2023",
    type: "Standard Page",
    amountType: "multiple",
    itemsAreTickets: true,
    amount: "₹799 – ₹3,999",
    views: 2410,
    payments: 412,
    revenue: "₹11,24,580",
    status: "Archived",
    created: "10 Nov 2023, 09:15",
    brandColor: "#0891b2",
    buttonLabel: "Register",
    theme: "light",
    layout: "centered",
    description: "Last year's edition. Archived after the event concluded.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard headline metrics.
// These are illustrative figures for the prototype — they are NOT derived from
// the page rows above. In production these come from the payments/analytics
// service. The two sparkline series are 7-point (last 7 days) trends used by the
// Total Revenue and Failed stat cards.
// ──────────────────────────────────────────────────────────────────────────────
export const DASHBOARD_METRICS = {
  // Successful payments — count + method split (shown as the breakdown card).
  successfulPayments: 1705,
  methodSplit: [
    { method: "UPI", pct: 61 },
    { method: "Cards", pct: 24 },
    { method: "Netbanking", pct: 15 },
  ],

  // Failed payments — count + 7d delta. Delta is negative (fewer failures),
  // which is GOOD news, so the card renders it green with a down arrow.
  failed: 182,
  failedDeltaPct: -4,
  // Trend FALLS left→right so the line agrees with the "down 4%" chip.
  failedTrend: [58, 54, 49, 47, 41, 38, 34],

  // Total revenue — 7d delta is positive (more revenue), rendered green/up.
  revenueDeltaPct: 18,
  // Trend RISES left→right to agree with the "up 18%" chip.
  revenueTrend: [22, 26, 31, 38, 44, 52, 61],
} as const;

export const TRANSACTIONS = [
  { id: "TXN-001", customer: "Rahul Sharma", email: "rahul@example.com", amount: "₹2,999", status: "Success", date: "28 Dec 2024, 11:22" },
  { id: "TXN-002", customer: "Priya Mehta", email: "priya.m@gmail.com", amount: "₹2,999", status: "Success", date: "27 Dec 2024, 15:07" },
  { id: "TXN-003", customer: "Arjun Nair", email: "arjun.nair@corp.in", amount: "₹2,999", status: "Failed", date: "26 Dec 2024, 09:55" },
  { id: "TXN-004", customer: "Sneha Patel", email: "sneha@startup.io", amount: "₹2,999", status: "Success", date: "25 Dec 2024, 20:10" },
  { id: "TXN-005", customer: "Karan Gupta", email: "karan.g@outlook.com", amount: "₹2,999", status: "Refunded", date: "24 Dec 2024, 13:45" },
];
