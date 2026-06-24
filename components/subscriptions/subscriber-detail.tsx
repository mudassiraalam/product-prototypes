"use client";
import { useState } from "react";
import { C, radius, shadow } from "../payment-pages/tokens";
import { StatusBadge, Btn, Modal } from "../payment-pages/primitives";
import { FieldRow, EmptyTab } from "../payment-pages/page-detail";
import { RecordDrawer, DrawerRecord } from "../payment-pages/record-drawer";
import type { Subscriber, Charge, Plan, SubscriberStatus } from "./types";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<Plan["frequency"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

// StatusBadge cfg is case-sensitive and covers payment/page statuses by default.
// Capitalize subscriber status so "active" → "Active" gets the green treatment;
// Paused/Pending/Cancelled fall to the default neutral gray, which is fine here.
function capStatus(s: SubscriberStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Color for the left status panel — mirrors the pattern in page-detail.tsx.
function statusColor(s: SubscriberStatus): string {
  if (s === "active")   return C.green;
  if (s === "pending")  return C.amber;
  if (s === "paused")   return C.amber;
  return C.textMuted;   // cancelled
}

// Build the DrawerRecord shape RecordDrawer expects from a single charge.
function chargeToRecord(charge: Charge, subscriber: Subscriber, plan: Plan | undefined): DrawerRecord {
  return {
    id: charge.id,
    amount: `₹${charge.amount.toLocaleString("en-IN")}`,
    status: charge.status,
    date: charge.date,
    source: subscriber.source,
    party: [
      { label: "Name",  value: subscriber.name },
      { label: "Email", value: subscriber.email },
      ...(subscriber.phone ? [{ label: "Phone", value: subscriber.phone }] : []),
    ],
    details: [
      { label: "Date",          value: charge.date },
      { label: "Plan",          value: plan?.name ?? "—" },
      { label: "Subscriber ID", value: subscriber.id },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// SubscriberDetail
// ──────────────────────────────────────────────────────────────────────────────
export function SubscriberDetail({
  subscriber, plan, charges, onBack,
}: {
  subscriber: Subscriber;
  plan: Plan | undefined;
  charges: Charge[];
  onBack?: () => void;
}) {
  // UI-only status — no backend call. Lets the merchant Pause/Resume/Cancel
  // without leaving the prototype.
  const [status, setStatus] = useState<SubscriberStatus>(subscriber.status);
  const [record, setRecord] = useState<DrawerRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<"pause" | "resume" | "cancel" | null>(null);

  const sc = statusColor(status);
  const isPaused = status === "paused";
  const isActive = status === "active";
  const isCancelled = status === "cancelled";

  const applyAction = () => {
    if (confirmAction === "pause")   setStatus("paused");
    if (confirmAction === "resume")  setStatus("active");
    if (confirmAction === "cancel")  setStatus("cancelled");
    setConfirmAction(null);
  };

  const CONFIRM_COPY: Record<NonNullable<typeof confirmAction>, { title: string; body: string; cta: string }> = {
    pause: {
      title: "Pause this subscription?",
      body: "No further charges will run until you resume. The subscriber's mandate stays registered.",
      cta: "Pause subscription",
    },
    resume: {
      title: "Resume this subscription?",
      body: "Charging will restart on the next billing date according to the plan frequency.",
      cta: "Resume subscription",
    },
    cancel: {
      title: "Cancel this subscription?",
      body: "This cannot be undone here. The subscriber's UPI AutoPay mandate will need to be revoked separately through your payment aggregator.",
      cta: "Cancel subscription",
    },
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", background: C.bg }}>

      {/* ── Header ── */}
      <div style={{ padding: "20px 32px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Subscribers
          </button>
        )}

        <div style={{ display: "flex", gap: 18, alignItems: "stretch", paddingBottom: 18 }}>
          {/* Status panel — left accent block (matches page-detail.tsx pattern) */}
          <div style={{ width: 132, flexShrink: 0, background: sc + "14", borderRadius: radius.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "18px 10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: sc }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: sc }}>{capStatus(status)}</span>
          </div>

          {/* Main info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                  {subscriber.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>Subscriber ID</span>
                  <span style={{ fontSize: 12.5, fontFamily: "monospace", color: C.blue }}>{subscriber.id}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>Started {subscriber.startDate}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 2 }}>Plan</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{plan?.name ?? "—"}</div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.borderLight}`, margin: "14px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px 18px" }}>
              <FieldRow label="Email"     value={subscriber.email} />
              {subscriber.phone && <FieldRow label="Phone" value={subscriber.phone} />}
              <FieldRow label="Amount"    value={plan ? `₹${plan.amount.toLocaleString("en-IN")}` : "—"} />
              <FieldRow label="Frequency" value={plan ? FREQ_LABEL[plan.frequency] : "—"} />
              <FieldRow label="Source"    value={<a href="#" style={{ color: C.blue, textDecoration: "none", fontSize: 13 }}>{subscriber.source.name}</a>} />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {isActive  && <Btn variant="ghost" size="sm" onClick={() => setConfirmAction("pause")}>Pause</Btn>}
              {isPaused  && <Btn variant="ghost" size="sm" onClick={() => setConfirmAction("resume")}>Resume</Btn>}
              {!isCancelled && (
                <Btn variant="ghost" size="sm" onClick={() => setConfirmAction("cancel")}>
                  Cancel subscription
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charge history ── */}
      <div style={{ flex: 1, padding: "24px 32px" }}>
        {charges.length === 0 ? (
          <EmptyTab
            icon="receipt"
            title="No charges yet"
            body="Charges appear here once the mandate is confirmed and the first debit runs."
          />
        ) : (
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>
                Charge history
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginLeft: 10 }}>
                  {charges.length} {charges.length === 1 ? "charge" : "charges"}
                </span>
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["Charge ID", "Date", "Amount", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charges.map(charge => (
                    <tr
                      key={charge.id}
                      style={{ borderTop: `1px solid ${C.borderLight}`, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => setRecord(chargeToRecord(charge, subscriber, plan))}
                          style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                          {charge.id}
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{charge.date}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>₹{charge.amount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={charge.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm modal ── */}
      {confirmAction && (
        <Modal
          title={CONFIRM_COPY[confirmAction].title}
          onClose={() => setConfirmAction(null)}
          width={440}
        >
          <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px", lineHeight: 1.6 }}>
            {CONFIRM_COPY[confirmAction].body}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Btn>
            <Btn
              variant={confirmAction === "cancel" ? "danger" : "primary"}
              size="sm"
              onClick={applyAction}
            >
              {CONFIRM_COPY[confirmAction].cta}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Charge detail drawer ── */}
      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
