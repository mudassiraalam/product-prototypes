export type PageStatus = "Active" | "Inactive" | "Draft" | "Expired";
export type PageType = "Standard" | "Donation" | "Event" | "Invoice";

export interface PaymentPage {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  amountType: "fixed" | "customer" | "multiple";
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

export const INITIAL_PAGES: PaymentPage[] = [
  {
    id: "PP-ENK-CONF2024",
    title: "Tech Summit 2024 Registration",
    slug: "tech-summit-2024",
    type: "Event",
    amountType: "multiple",
    amount: "₹2,999",
    views: 1842,
    payments: 326,
    revenue: "₹9,77,674",
    status: "Active",
    created: "15 Nov 2024, 10:30",
    brandColor: "#1c5af4",
    buttonLabel: "Register Now",
    theme: "light",
    layout: "centered",
    description: "Join us for India's biggest tech conference. Network with 1000+ professionals.",
  },
  {
    id: "PP-ENK-DIWALI23",
    title: "Diwali Charity Drive 2024",
    slug: "diwali-charity-2024",
    type: "Donation",
    amountType: "customer",
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
    description: "Help us bring joy to underprivileged children this Diwali season.",
  },
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
  {
    id: "PP-ENK-COURSE01",
    title: "React Masterclass — Jan Batch",
    slug: "react-masterclass-jan",
    type: "Standard",
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
  },
  {
    id: "PP-ENK-MERCH05",
    title: "EnKash Branded Merchandise",
    slug: "enkash-merch",
    type: "Standard",
    amountType: "multiple",
    amount: "₹499–₹2,499",
    views: 234,
    payments: 0,
    revenue: "₹0",
    status: "Draft",
    created: "26 Dec 2024, 17:42",
    brandColor: "#1c5af4",
    buttonLabel: "Buy Now",
    theme: "dark",
    layout: "wide",
  },
];

export const TRANSACTIONS = [
  { id: "TXN-001", customer: "Rahul Sharma", email: "rahul@example.com", amount: "₹2,999", status: "Success", date: "28 Dec 2024, 11:22" },
  { id: "TXN-002", customer: "Priya Mehta", email: "priya.m@gmail.com", amount: "₹2,999", status: "Success", date: "27 Dec 2024, 15:07" },
  { id: "TXN-003", customer: "Arjun Nair", email: "arjun.nair@corp.in", amount: "₹2,999", status: "Failed", date: "26 Dec 2024, 09:55" },
  { id: "TXN-004", customer: "Sneha Patel", email: "sneha@startup.io", amount: "₹2,999", status: "Success", date: "25 Dec 2024, 20:10" },
  { id: "TXN-005", customer: "Karan Gupta", email: "karan.g@outlook.com", amount: "₹2,999", status: "Refunded", date: "24 Dec 2024, 13:45" },
];
