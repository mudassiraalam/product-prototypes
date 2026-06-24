import type { WizardData } from "./wizard-steps";
import type { Subscriber } from "../subscriptions/types";
import { SUBSCRIBERS } from "../subscriptions/mock-data";

export type PageStatus = "Active" | "Inactive" | "Draft" | "Expired" | "Archived";

// Sub-categories (Donation / Event Tickets / Fixed Price / etc.) are derived
// from amountType + isDonation + itemsAreTickets and shown via the row icon,
// not as a label the merchant explicitly selected.

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
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
  // Full builder state, stored when a page is created/saved through the wizard so
  // drafts (and edits of in-session pages) reopen losslessly. Absent on the seed
  // mock rows — those get believable details fabricated on demand instead.
  draftData?: WizardData;
  // Step the merchant was on when they saved a draft, so resume lands there.
  lastStep?: number;
  // Recurring billing — mirrors the fields added to WizardData.
  // Optional so all existing one-time seed rows remain valid without changes.
  isRecurring?: boolean;
  recurringFrequency?: "monthly" | "quarterly" | "yearly";
  durationType?: "until_cancelled" | "until_date";
  endDate?: string;
}

// Seed examples — each demonstrates a different page configuration the
// single-flow architecture can produce. Together they exercise every conditional
// branch in the wizard (fixed / customer-decides / multiple-items, with the
// donation and tickets refinements).
export const INITIAL_PAGES: PaymentPage[] = [
  // ── Page · Event Tickets (Multiple Items + itemsAreTickets) ─────────────
  {
    id: "PP-ENK-CONF2024",
    title: "Tech Summit 2024 Registration",
    slug: "tech-summit-2024",
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

  // ── Page · Fixed Price (Fixed) ──────────────────────────────────────────
  {
    id: "PP-ENK-COURSE01",
    title: "React Masterclass — Jan Batch",
    slug: "react-masterclass-jan",
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

  // ── Recurring · Monthly Membership ─────────────────────────────────────
  {
    id: "PP-ENK-MEMBER01",
    title: "EnKash Pro — Monthly Membership",
    slug: "enkash-pro-monthly",
    amountType: "fixed",
    isRecurring: true,
    recurringFrequency: "monthly",
    // Revenue ≈ 5 subscribers × avg 3 charges × ₹999. Matches the charge
    // history in components/subscriptions/mock-data.ts (sub-001: 3, sub-002: 2
    // quarterly at ₹2,499 each, sub-003: 2 successes, sub-004: 1 refunded).
    amount: "₹999 / mo",
    views: 312,
    payments: 5,
    revenue: "₹19,980",
    status: "Active",
    created: "01 Oct 2024, 09:00",
    brandColor: "#7c3aed",
    buttonLabel: "Subscribe Now",
    theme: "light",
    layout: "centered",
    description: "Unlock full access to EnKash Pro features. Billed monthly. Cancel anytime.",
  },

  // ── Archived (last year's event) ────────────────────────────────────────
  {
    id: "PP-ENK-CONF2023",
    title: "Tech Summit 2023 (Archived)",
    slug: "tech-summit-2023",
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
  // A clearly DECLINING series (one minor early bump, then a steady fall) so the
  // card reads unambiguously as "failures coming down" — no late up-spike that
  // could be misread as a problem. Agrees with the −4% green/down delta.
  failedTrend: [56, 48, 51, 40, 36, 31, 24],

  // Total revenue — 7d delta is positive (more revenue), rendered green/up.
  revenueDeltaPct: 18,
  // Sharp peaks/valleys, TRENDING UP overall to agree with "up 18%".
  revenueTrend: [28, 22, 40, 32, 50, 42, 60],
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Per-page submissions — one record per payment attempt, carrying the customer's
// form responses. `responses` is keyed by the field LABELS the merchant set in
// the wizard (Step 2), which is what lets the detail view build its columns
// dynamically from `customerFields`. Records exist only for payment attempts —
// abandoned forms are not captured. Pages created in-session start empty.
// In production this comes from the payments service joined with form data.
// ──────────────────────────────────────────────────────────────────────────────
export interface Submission {
  id: string;                          // PG payment id
  date: string;
  amount: string;
  status: "Success" | "Failed" | "Refunded";
  responses: Record<string, string>;   // field label → customer's answer
}

export const PAGE_SUBMISSIONS: Record<string, Submission[]> = {
  // Tech Summit — fields: Full Name / Email Address / Phone Number / Company
  "PP-ENK-CONF2024": [
    { id: "pay_NkT82mQ1", date: "28 Dec 2024, 11:22", amount: "₹4,999", status: "Success",
      responses: { "Full Name": "Ananya Iyer", "Email Address": "ananya.iyer@gmail.com", "Phone Number": "98301 22418", "Company": "Flexiloans" } },
    { id: "pay_NkR55xB7", date: "27 Dec 2024, 18:40", amount: "₹2,499", status: "Success",
      responses: { "Full Name": "Rohit Bansal", "Email Address": "rohit@bansaltech.in", "Phone Number": "99872 10334", "Company": "Bansal Tech" } },
    { id: "pay_NkQ19pL3", date: "27 Dec 2024, 09:12", amount: "₹2,499", status: "Failed",
      responses: { "Full Name": "Megha Joshi", "Email Address": "megha.j@outlook.com", "Phone Number": "91123 87650", "Company": "" } },
    { id: "pay_NkP74vC9", date: "26 Dec 2024, 21:05", amount: "₹999", status: "Success",
      responses: { "Full Name": "Arjun Nair", "Email Address": "arjun.nair@corp.in", "Phone Number": "98450 66721", "Company": "Corp.in" } },
    { id: "pay_NkN12hT6", date: "26 Dec 2024, 10:48", amount: "₹2,499", status: "Success",
      responses: { "Full Name": "Divya Krishnan", "Email Address": "divya.k@zoho.com", "Phone Number": "97316 44209", "Company": "Zoho" } },
    { id: "pay_NkM31dF2", date: "25 Dec 2024, 14:51", amount: "₹4,999", status: "Refunded",
      responses: { "Full Name": "Sahil Khanna", "Email Address": "sahil.k@startup.io", "Phone Number": "97714 50982", "Company": "Startup.io" } },
  ],

  // Diwali charity — fields: Full Name / Email Address / Phone Number / PAN Number
  "PP-ENK-DIWALI24": [
    { id: "pay_NhV61kR8", date: "24 Oct 2024, 19:30", amount: "₹5,000", status: "Success",
      responses: { "Full Name": "Kavita Reddy", "Email Address": "kavita.reddy@gmail.com", "Phone Number": "98490 31177", "PAN Number": "BHJPR4821K" } },
    { id: "pay_NhT28wM4", date: "23 Oct 2024, 12:14", amount: "₹1,000", status: "Success",
      responses: { "Full Name": "Imran Shaikh", "Email Address": "imran.s@yahoo.in", "Phone Number": "90040 78215", "PAN Number": "AKWPS6390D" } },
    { id: "pay_NhS90bN1", date: "22 Oct 2024, 08:55", amount: "₹2,500", status: "Success",
      responses: { "Full Name": "Pooja Agarwal", "Email Address": "pooja.agarwal@rediffmail.com", "Phone Number": "93345 12908", "PAN Number": "CMHPA2217F" } },
    { id: "pay_NhR47cV5", date: "21 Oct 2024, 16:02", amount: "₹500", status: "Failed",
      responses: { "Full Name": "Nikhil Verma", "Email Address": "nikhil.v@gmail.com", "Phone Number": "98115 90443", "PAN Number": "DKVPV8804M" } },
    { id: "pay_NhQ16zX3", date: "20 Oct 2024, 20:47", amount: "₹10,000", status: "Success",
      responses: { "Full Name": "Sunita Menon", "Email Address": "sunita.menon@hotmail.com", "Phone Number": "98952 33860", "PAN Number": "EQMPM5172B" } },
  ],

  // React Masterclass — fields: Full Name / Email Address / Phone Number
  "PP-ENK-COURSE01": [
    { id: "pay_NjK73fG6", date: "18 Dec 2024, 22:10", amount: "₹4,999", status: "Success",
      responses: { "Full Name": "Rahul Sharma", "Email Address": "rahul@example.com", "Phone Number": "98201 45673" } },
    { id: "pay_NjJ40rH2", date: "17 Dec 2024, 15:07", amount: "₹4,999", status: "Success",
      responses: { "Full Name": "Priya Mehta", "Email Address": "priya.m@gmail.com", "Phone Number": "99303 21458" } },
    { id: "pay_NjH85sJ9", date: "16 Dec 2024, 09:55", amount: "₹4,999", status: "Failed",
      responses: { "Full Name": "Karan Gupta", "Email Address": "karan.g@outlook.com", "Phone Number": "97689 04312" } },
    { id: "pay_NjG52tK4", date: "15 Dec 2024, 20:10", amount: "₹4,999", status: "Success",
      responses: { "Full Name": "Sneha Patel", "Email Address": "sneha@startup.io", "Phone Number": "98760 55291" } },
  ],

  // Archived 2023 summit — fields match CONF2024 (same fabricated builder state)
  "PP-ENK-CONF2023": [
    { id: "pay_MzC18uL7", date: "08 Dec 2023, 13:26", amount: "₹3,999", status: "Success",
      responses: { "Full Name": "Vikram Singh", "Email Address": "vikram.s@infosys.com", "Phone Number": "98860 17402", "Company": "Infosys" } },
    { id: "pay_MzB64vM3", date: "07 Dec 2023, 11:03", amount: "₹799", status: "Success",
      responses: { "Full Name": "Aditi Rao", "Email Address": "aditi.rao@gmail.com", "Phone Number": "90080 63915", "Company": "" } },
    { id: "pay_MzA29wN8", date: "06 Dec 2023, 17:44", amount: "₹1,999", status: "Refunded",
      responses: { "Full Name": "Farhan Ali", "Email Address": "farhan.ali@tcs.com", "Phone Number": "98220 84137", "Company": "TCS" } },
  ],

  // Merch page is a Draft with 0 payments → intentionally no records, which is
  // what exercises the Submissions empty state.
};

// ──────────────────────────────────────────────────────────────────────────────
// Per-page subscribers — parallel to PAGE_SUBMISSIONS but for recurring pages.
// Keyed by page ID; values are Subscriber objects imported from the subscriptions
// module. The Subscribers tab in PageDetailView reads from here.
// ──────────────────────────────────────────────────────────────────────────────
export const PAGE_SUBSCRIBERS: Record<string, Subscriber[]> = {
  // All five seed subscribers are attributed to this page. Their charge history
  // lives in CHARGES in components/subscriptions/mock-data.ts.
  "PP-ENK-MEMBER01": SUBSCRIBERS,
};
