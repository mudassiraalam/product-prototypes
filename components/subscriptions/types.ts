// ──────────────────────────────────────────────────────────────────────────────
// Subscription types
// ──────────────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  amount: number;                           // INR, not a form-input string
  frequency: "monthly" | "quarterly" | "yearly";
  durationType?: "until_cancelled" | "until_date";
  endDate?: string;
}

// ──────────────────────────────────────────────────────────────────────────────

export type SubscriberStatus = "pending" | "active" | "paused" | "cancelled";

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  planId: string;
  status: SubscriberStatus;
  startDate: string;                        // ISO date string, e.g. "2024-10-01"
  // Attribution — matches the source shape used in DrawerRecord / page-detail.tsx
  // so subscriber records can be linked back to the payment page that enrolled them.
  source: { kind: "page" | "button"; name: string; ref: string };
}

// ──────────────────────────────────────────────────────────────────────────────

// Reuses the same vocabulary as Submission.status in payment-pages/mock-data.ts
// so the same StatusBadge component can render charge rows without modification.
export type ChargeStatus = "Success" | "Failed" | "Refunded";

export interface Charge {
  id: string;
  subscriberId: string;
  amount: number;                           // INR
  date: string;                             // display string, e.g. "01 Dec 2024, 10:00"
  status: ChargeStatus;
}

// ──────────────────────────────────────────────────────────────────────────────
// MANDATE_TERMS — regulated e-mandate parameters.
//
// Every value below is a [VERIFY] placeholder. These MUST be confirmed against
// current NPCI and RBI circulars (and your payment aggregator's compliance
// team) before they appear in any merchant-facing or payer-facing copy.
// ──────────────────────────────────────────────────────────────────────────────
export const MANDATE_TERMS = {
  // Maximum amount that can be debited per transaction under a UPI AutoPay
  // e-mandate. [VERIFY] NPCI circular OC-90 sets ₹15,000 for general
  // merchants; higher caps apply for specific categories (insurance, mutual
  // funds, education). Confirm the applicable cap for your merchant category.
  maxDebitAmount: "[VERIFY: ₹15,000 for general merchants — confirm category cap with NPCI/aggregator]",

  // Minimum advance notice required before each recurring debit.
  // [VERIFY] NPCI e-mandate rules currently require a pre-debit notification
  // sent to the customer at least 24 hours before the debit executes.
  // Confirm the exact window and required notification channel (SMS / push).
  preDebitNotice: "[VERIFY: 24 hours before each debit — confirm channel requirements with NPCI]",

  // Timing of the first debit after mandate registration.
  // [VERIFY] RBI guidelines require Additional Factor of Authentication (AFA)
  // for e-mandates; the first debit may not execute immediately on registration.
  // Confirm the earliest permitted first-debit timing with your payment aggregator.
  firstDebitBehaviour: "[VERIFY: AFA required on registration; immediate first debit not permitted — confirm with aggregator]",
} as const;
