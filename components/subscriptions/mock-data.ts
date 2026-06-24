import type { Plan, Subscriber, Charge } from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// Plans
// ──────────────────────────────────────────────────────────────────────────────
export const PLANS: Plan[] = [
  {
    id: "plan-starter-monthly",
    name: "Starter",
    amount: 999,
    frequency: "monthly",
  },
  {
    id: "plan-growth-quarterly",
    name: "Growth",
    amount: 2499,
    frequency: "quarterly",
  },
  {
    id: "plan-scale-yearly",
    name: "Scale",
    amount: 9999,
    frequency: "yearly",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Subscribers — split across two sources:
//   PAGE_SOURCE  → recurring PaymentPage PP-ENK-MEMBER01
//   BUTTON_SOURCE → recurring PaymentButton PB-ENK-RECUR
// ──────────────────────────────────────────────────────────────────────────────
const SOURCE = {
  kind: "page" as const,
  name: "EnKash Pro — Monthly Membership",
  ref: "PP-ENK-MEMBER01",
};

const BUTTON_SOURCE = {
  kind: "button" as const,
  name: "Monthly Pro subscription",
  ref: "PB-ENK-RECUR",
};

export const SUBSCRIBERS: Subscriber[] = [
  {
    id: "sub-001",
    name: "Riya Desai",
    email: "riya.desai@gmail.com",
    phone: "98201 33412",
    planId: "plan-starter-monthly",
    status: "active",
    startDate: "2024-10-01",
    source: SOURCE,
  },
  {
    id: "sub-002",
    name: "Karan Mehta",
    email: "karan.m@techcorp.in",
    phone: "97654 12098",
    planId: "plan-growth-quarterly",
    status: "active",
    startDate: "2024-09-15",
    source: SOURCE,
  },
  {
    id: "sub-003",
    name: "Sunita Rao",
    email: "sunita.rao@startup.io",
    planId: "plan-starter-monthly",
    status: "paused",
    startDate: "2024-08-01",
    source: SOURCE,
  },
  {
    id: "sub-004",
    name: "Arjun Nair",
    email: "arjun.nair@corp.in",
    phone: "98450 66721",
    planId: "plan-scale-yearly",
    status: "cancelled",
    startDate: "2024-07-01",
    source: SOURCE,
  },
  {
    id: "sub-005",
    name: "Priya Sharma",
    email: "priya.s@example.com",
    planId: "plan-starter-monthly",
    status: "pending",
    startDate: "2024-12-28",
    source: SOURCE,
  },
  {
    id: "sub-B01",
    name: "Neha Kulkarni",
    email: "neha.k@designstudio.in",
    phone: "99204 51837",
    planId: "plan-starter-monthly",
    status: "active",
    startDate: "2025-01-10",
    source: BUTTON_SOURCE,
  },
  {
    id: "sub-B02",
    name: "Vikram Joshi",
    email: "vjoshi@fintech.io",
    phone: "98107 34920",
    planId: "plan-starter-monthly",
    status: "active",
    startDate: "2025-02-01",
    source: BUTTON_SOURCE,
  },
  {
    id: "sub-B03",
    name: "Meera Pillai",
    email: "meera.pillai@gmail.com",
    planId: "plan-starter-monthly",
    status: "paused",
    startDate: "2024-12-05",
    source: BUTTON_SOURCE,
  },
  {
    id: "sub-B04",
    name: "Rohit Anand",
    email: "rohit.anand@corp.in",
    phone: "97300 88214",
    planId: "plan-starter-monthly",
    status: "pending",
    startDate: "2025-03-01",
    source: BUTTON_SOURCE,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Charges — keyed by subscriber ID.
// sub-001 (active): 3 consecutive successes — healthy cadence.
// sub-002 (active): 2 quarterly successes — only two billing cycles so far.
// sub-003 (paused): recent failure explains the pause; two prior successes.
// sub-004 (cancelled): single charge, refunded on cancellation.
// sub-005 (pending): no charges yet — mandate not yet confirmed.
// ──────────────────────────────────────────────────────────────────────────────
export const CHARGES: Record<string, Charge[]> = {
  "sub-001": [
    { id: "chg_Nk1003", subscriberId: "sub-001", amount: 999,  date: "01 Dec 2024, 10:00", status: "Success" },
    { id: "chg_Nk1002", subscriberId: "sub-001", amount: 999,  date: "01 Nov 2024, 10:00", status: "Success" },
    { id: "chg_Nk1001", subscriberId: "sub-001", amount: 999,  date: "01 Oct 2024, 10:00", status: "Success" },
  ],
  "sub-002": [
    { id: "chg_Nk2002", subscriberId: "sub-002", amount: 2499, date: "15 Dec 2024, 09:30", status: "Success" },
    { id: "chg_Nk2001", subscriberId: "sub-002", amount: 2499, date: "15 Sep 2024, 09:30", status: "Success" },
  ],
  "sub-003": [
    { id: "chg_Nk3003", subscriberId: "sub-003", amount: 999,  date: "01 Nov 2024, 11:15", status: "Failed"  },
    { id: "chg_Nk3002", subscriberId: "sub-003", amount: 999,  date: "01 Oct 2024, 10:00", status: "Success" },
    { id: "chg_Nk3001", subscriberId: "sub-003", amount: 999,  date: "01 Sep 2024, 10:00", status: "Success" },
  ],
  "sub-004": [
    { id: "chg_Nk4001", subscriberId: "sub-004", amount: 9999, date: "01 Jul 2024, 14:20", status: "Refunded" },
  ],
  "sub-B01": [
    { id: "chg_NkB103", subscriberId: "sub-B01", amount: 999, date: "10 Mar 2025, 10:00", status: "Success" },
    { id: "chg_NkB102", subscriberId: "sub-B01", amount: 999, date: "10 Feb 2025, 10:00", status: "Success" },
    { id: "chg_NkB101", subscriberId: "sub-B01", amount: 999, date: "10 Jan 2025, 10:00", status: "Success" },
  ],
  "sub-B02": [
    { id: "chg_NkB202", subscriberId: "sub-B02", amount: 999, date: "01 Mar 2025, 09:45", status: "Success" },
    { id: "chg_NkB201", subscriberId: "sub-B02", amount: 999, date: "01 Feb 2025, 09:45", status: "Success" },
  ],
  "sub-B03": [
    { id: "chg_NkB302", subscriberId: "sub-B03", amount: 999, date: "05 Feb 2025, 11:30", status: "Failed"  },
    { id: "chg_NkB301", subscriberId: "sub-B03", amount: 999, date: "05 Jan 2025, 10:00", status: "Success" },
  ],
};
