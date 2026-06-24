"use client";
import { C, radius, shadow } from "../payment-pages/tokens";
import type { Plan } from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// MandateSummary — payer-facing "what you're authorising" panel.
//
// Shows only plain, certain facts (amount, duration, cancellation).
// Regulatory detail stays in comments below — confirm with NPCI/RBI/aggregator
// before adding any of it back to customer-facing copy.
// ──────────────────────────────────────────────────────────────────────────────

const FREQ_PER_LABEL: Record<Plan["frequency"], string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const FREQ_CYCLE_LABEL: Record<Plan["frequency"], string> = {
  monthly: "every month",
  quarterly: "every 3 months",
  yearly: "every year",
};

function MandateRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: 16, padding: "11px 0", borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <span style={{ fontSize: 13, color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>
        {value}
      </span>
    </div>
  );
}

export function MandateSummary({
  plan,
  onApprove,
}: {
  plan: Plan;
  // Opens the EXISTING page-preview BillingPanel checkout (the caller's
  // responsibility). This component must not implement a new payment flow.
  onApprove: () => void;
}) {
  const perLabel = FREQ_PER_LABEL[plan.frequency];
  const cycleLabel = FREQ_CYCLE_LABEL[plan.frequency];
  const formattedAmount = `₹${plan.amount.toLocaleString("en-IN")}`;

  // Regulatory facts NOT shown to customers — confirm with NPCI/RBI/aggregator before
  // adding any of this back to customer-facing copy:
  // · Max per debit: [VERIFY: ₹15,000 for general merchants — confirm category cap with NPCI/aggregator]
  // · Pre-debit notice: [VERIFY: 24 hours before each debit — confirm channel requirements with NPCI]
  // · First debit: [VERIFY: AFA required on registration; immediate first debit not permitted — confirm with aggregator]
  const mandateFacts: { label: string; value: string }[] = [
    {
      label: "Billed",
      value: `${formattedAmount} ${cycleLabel}`,
    },
    {
      label: "Runs until",
      value: (plan.durationType === "until_date" && plan.endDate)
        ? new Date(plan.endDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "Cancelled by you",
    },
    {
      label: "Cancel anytime",
      value: "From your subscription portal or by contacting support",
    },
  ];

  return (
    <div style={{
      background: C.white, border: `1.5px solid ${C.border}`,
      borderRadius: radius.lg, boxShadow: shadow.md,
      overflow: "hidden", maxWidth: 460,
    }}>

      {/* ── Plan header ── */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
          Subscribing to
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{plan.name}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.blue, whiteSpace: "nowrap" }}>
            {formattedAmount} / {perLabel}
          </span>
        </div>
      </div>

      {/* ── Mandate facts ── */}
      <div style={{ padding: "16px 24px 0" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
          What you're authorising
        </p>
        {mandateFacts.map(f => (
          <MandateRow key={f.label} label={f.label} value={f.value} />
        ))}
      </div>

      {/* ── Approve button ── */}
      <div style={{ padding: "20px 24px 24px" }}>
        <button
          onClick={onApprove}
          style={{
            width: "100%", padding: "13px", background: C.blue, color: C.white,
            border: "none", borderRadius: radius.md, fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.01em",
            boxShadow: shadow.blue, transition: "background 0.15s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.blueHover)}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.blue)}
        >
          Approve & Continue
        </button>
        <p style={{ fontSize: 12, color: C.textFaint, margin: "10px 0 0", textAlign: "center", lineHeight: 1.5 }}>
          Continuing opens the EnKash checkout to complete your UPI AutoPay mandate setup.
        </p>
      </div>
    </div>
  );
}
