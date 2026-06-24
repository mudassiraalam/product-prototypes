"use client";
import { C, radius } from "@/components/payment-pages/tokens";
import {
  Inp, Sel, Textarea, SegmentedControl, ColorPicker, InfoBanner, SectionCard,
} from "@/components/payment-pages/primitives";
import { Icon } from "@/components/payment-pages/icons";
import { MERCHANT_PROFILE } from "@/components/payment-qr/qr-mock-data";
import { ALL_PAYMENT_METHODS, getSymbol, type PaymentMethod } from "@/components/payment-pages/wizard-steps";

// ──────────────────────────────────────────────────────────────────────────────
// Payment Button — builder data model (v1).
//
// A Payment Button is a snippet the merchant pastes onto THEIR OWN website. It
// renders a branded "Pay" button; clicking it opens the EnKash checkout. There
// is no hosted EnKash page here — the surrounding page is the merchant's.
//
// Razorpay ships four button "templates" (Quick-Pay / Donations / Buy Now /
// Custom). We deliberately DON'T copy that split: the only thing that actually
// changes the button's behaviour is the AMOUNT MODE, so that's a control in
// step 1 rather than four marketing screens. The B2B value is "collect a
// payment from your site", not "run a storefront".
//
// v1 amount modes:
//   fixed     → one set price (a fee, a known invoice, a fixed product).
//   customer  → the payer decides the amount; optionally seeded with preset
//               chips and bounded by a min/max (covers donation-style buttons).
//
// DEFERRED, flagged for Pallav (NOT built in v1):
//   • Buy-Now button with inventory / units sold / stock — storefront territory.
//   • Subscription / recurring-mandate buttons — a separate product surface.
// ──────────────────────────────────────────────────────────────────────────────

export type ButtonAmountMode = "fixed" | "customer";
export type ButtonStyle = "solid" | "outline";

// A field the payer fills in the checkout before paying. `type` reuses the same
// vocabulary the Payment Pages checkout already renders (see BuyerField), so the
// preview is identical across products.
export interface ButtonField {
  id: string;
  type: string;   // email | phone | name | company | address | gstin | pan | number | text
  label: string;
  optional: boolean;
}

export interface ButtonData {
  merchantName: string;            // read-only, from the KYC'd merchant profile
  title: string;                   // internal label — dashboard only, never shown to payers
  amountMode: ButtonAmountMode;
  fixedAmount: string;             // fixed mode
  presetAmounts: string[];         // customer mode: optional chips
  minAmount: string;               // customer mode: optional bound
  maxAmount: string;               // customer mode: optional bound
  buttonLabel: string;             // the words ON the button — shown to the payer
  brandColor: string;              // button colour. [VERIFY: merchant-set colour vs locked accent — Pallav]
  buttonStyle: ButtonStyle;        // solid fill or outline
  fields: ButtonField[];           // checkout form fields
  paymentMethods: PaymentMethod[]; // methods offered in the checkout
  successMessage: string;          // Custom Success Message ONLY (no receipt/redirect/webhook here)
  slug: string;
  slugTouched?: boolean;
  isRecurring: boolean;
  recurringFrequency: "monthly" | "quarterly" | "yearly";
  durationType: "until_cancelled" | "until_date";
  endDate: string;
}

export const FIELD_TYPES: { value: string; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "address", label: "Address" },
  { value: "gstin", label: "GSTIN" },
  { value: "pan", label: "PAN" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
];

let fieldSeq = 0;
const newFieldId = () => `f${++fieldSeq}_${Math.random().toString(36).slice(2, 6)}`;

export const DEFAULT_BUTTON: ButtonData = {
  merchantName: MERCHANT_PROFILE.businessName,
  title: "",
  amountMode: "fixed",
  fixedAmount: "",
  presetAmounts: ["", "", ""],
  minAmount: "",
  maxAmount: "",
  buttonLabel: "Pay Now",
  brandColor: "#1c5af4",
  buttonStyle: "solid",
  fields: [
    { id: "default_email", type: "email", label: "Email", optional: false },
    { id: "default_phone", type: "phone", label: "Phone", optional: false },
  ],
  paymentMethods: ["upi", "cards", "netbanking", "wallets"],
  successMessage: "",
  slug: "",
  isRecurring: false,
  recurringFrequency: "monthly",
  durationType: "until_cancelled",
  endDate: "",
};

export function getButtonSteps(): { key: string; label: string }[] {
  return [
    { key: "basics", label: "Button" },
    { key: "checkout", label: "Checkout" },
  ];
}

export interface ButtonValidationError { step: number; message: string; }

export function validateButton(data: ButtonData): ButtonValidationError[] {
  const e: ButtonValidationError[] = [];
  if (!data.title.trim()) e.push({ step: 0, message: "Give this button a name (for your own dashboard)." });
  if (!data.buttonLabel.trim()) e.push({ step: 0, message: "Add the label the customer sees on the button." });
  if (data.amountMode === "fixed" && !(parseFloat(data.fixedAmount || "0") > 0)) {
    e.push({ step: 0, message: "Set a fixed amount greater than zero, or switch to Customer decides." });
  }
  if (data.amountMode === "customer") {
    const mn = parseFloat(data.minAmount || "0"), mx = parseFloat(data.maxAmount || "0");
    if (data.minAmount && data.maxAmount && mn > 0 && mx > 0 && mx < mn) {
      e.push({ step: 0, message: "Maximum amount can't be less than the minimum." });
    }
  }
  if (data.fields.some(f => !f.label.trim())) {
    e.push({ step: 1, message: "Give every checkout field a label, or remove the empty one." });
  }
  if (data.paymentMethods.length === 0) {
    e.push({ step: 1, message: "Turn on at least one payment method for the checkout." });
  }
  return e;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Button (identity + amount + the button itself)
// ══════════════════════════════════════════════════════════════════════════════
export function StepButtonBasics({ data, setData }: { data: ButtonData; setData: (d: ButtonData) => void }) {
  const set = (patch: Partial<ButtonData>) => setData({ ...data, ...patch });
  const setTitle = (v: string) => set({ title: v, slug: data.slugTouched ? data.slug : slugify(v) });
  const sym = getSymbol();

  const setPreset = (i: number, v: string) => {
    const next = data.presetAmounts.slice();
    next[i] = v;
    set({ presetAmounts: next });
  };
  const addPreset = () => set({ presetAmounts: [...data.presetAmounts, ""] });
  const removePreset = (i: number) => set({ presetAmounts: data.presetAmounts.filter((_, idx) => idx !== i) });

  return (
    <div>
      <SectionCard title="The basics">
        <Inp label="Button name" required value={data.title} onChange={setTitle}
          placeholder="e.g. Website donate, Course fee, Invoice top-up"
          hint="Only you see this — it labels the button on your dashboard." />
        <Inp label="Business name" value={data.merchantName} onChange={() => {}} disabled
          hint="Verified at onboarding — shown to the payer in the checkout." />
      </SectionCard>

      <SectionCard title="Payment type">
        <div style={{ marginBottom: 14 }}>
          <SegmentedControl
            value={data.isRecurring ? "recurring" : "onetime"}
            onChange={v => set({ isRecurring: v === "recurring", endDate: "" })}
            options={[{ key: "onetime", label: "One-time" }, { key: "recurring", label: "Recurring" }]}
          />
        </div>
        {data.isRecurring && (
          <>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary, margin: "0 0 6px" }}>Billing frequency</p>
              <SegmentedControl
                value={data.recurringFrequency}
                onChange={v => set({ recurringFrequency: v as "monthly" | "quarterly" | "yearly" })}
                options={[
                  { key: "monthly",   label: "Monthly" },
                  { key: "quarterly", label: "Quarterly" },
                  { key: "yearly",    label: "Yearly" },
                ]}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary, margin: "0 0 6px" }}>Runs for</p>
              <SegmentedControl
                value={data.durationType}
                onChange={v => set({ durationType: v as "until_cancelled" | "until_date", endDate: "" })}
                options={[
                  { key: "until_cancelled", label: "Until cancelled" },
                  { key: "until_date",      label: "Until a set date" },
                ]}
              />
            </div>
            {data.durationType === "until_date" && (
              <Inp
                label="End date"
                value={data.endDate}
                onChange={v => set({ endDate: v })}
                type="date"
                hint="Subscription stops renewing on or after this date"
              />
            )}
          </>
        )}
      </SectionCard>

      <SectionCard title="What does the button charge?">
        <div style={{ marginBottom: 14 }}>
          <SegmentedControl value={data.amountMode}
            onChange={v => set({ amountMode: v as ButtonAmountMode })}
            options={[{ key: "fixed", label: "Fixed amount" }, { key: "customer", label: "Customer decides" }]} />
        </div>

        {data.amountMode === "fixed" ? (
          <>
            <Inp label="Amount" required type="number" value={data.fixedAmount}
              onChange={v => set({ fixedAmount: v })} prefix={sym} placeholder="499" />
            <InfoBanner type="info">
              Every click charges this exact amount — good for a fixed fee, a set product price or a known invoice.
            </InfoBanner>
          </>
        ) : (
          <>
            <InfoBanner type="info">
              The payer types the amount in the checkout. Add a few presets to nudge common values, or leave them blank
              for a fully open field.
            </InfoBanner>

            <p style={{ fontSize: 12.5, fontWeight: 600, color: C.textSecondary, margin: "4px 0 8px" }}>Suggested amounts (optional)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {data.presetAmounts.map((amt, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <Inp value={amt} onChange={v => setPreset(i, v)} placeholder="0" prefix={sym} type="number" />
                  </div>
                  {data.presetAmounts.length > 1 && (
                    <button onClick={() => removePreset(i)} aria-label="Remove preset"
                      style={{ width: 34, height: 38, marginBottom: 18, flexShrink: 0, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.md, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addPreset}
              style={{ fontSize: 13, fontWeight: 600, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.md, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              + Add suggested amount
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Minimum (optional)" type="number" value={data.minAmount}
                onChange={v => set({ minAmount: v })} prefix={sym} placeholder="100" />
              <Inp label="Maximum (optional)" type="number" value={data.maxAmount}
                onChange={v => set({ maxAmount: v })} prefix={sym} placeholder="100000" />
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="The button">
        <Inp label="Button label" required value={data.buttonLabel} onChange={v => set({ buttonLabel: v })}
          placeholder="Pay Now" hint="The words on the button on your site — e.g. Pay Now, Donate, Buy ticket." />
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Button style</p>
          <SegmentedControl value={data.buttonStyle}
            onChange={v => set({ buttonStyle: v as ButtonStyle })}
            options={[{ key: "solid", label: "Solid" }, { key: "outline", label: "Outline" }]} />
        </div>
        <ColorPicker label="Button colour" value={data.brandColor} onChange={v => set({ brandColor: v })} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "2px 0 0", lineHeight: 1.5 }}>
          Defaults to the EnKash accent. The checkout itself always uses EnKash branding for trust.
        </p>
      </SectionCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Checkout (what the payer fills, which methods, the success message)
// ══════════════════════════════════════════════════════════════════════════════
export function StepButtonCheckout({ data, setData }: { data: ButtonData; setData: (d: ButtonData) => void }) {
  const set = (patch: Partial<ButtonData>) => setData({ ...data, ...patch });

  const updateField = (id: string, patch: Partial<ButtonField>) =>
    set({ fields: data.fields.map(f => (f.id === id ? { ...f, ...patch } : f)) });
  const addField = () => set({ fields: [...data.fields, { id: newFieldId(), type: "text", label: "", optional: true }] });
  const removeField = (id: string) => set({ fields: data.fields.filter(f => f.id !== id) });

  const toggleMethod = (key: PaymentMethod) =>
    set({ paymentMethods: data.paymentMethods.includes(key) ? data.paymentMethods.filter(m => m !== key) : [...data.paymentMethods, key] });

  return (
    <div>
      <SectionCard title="Details you collect">
        <InfoBanner type="info">
          The payer fills these in the checkout before paying. Email and phone are sensible defaults — add only what you
          actually need.
        </InfoBanner>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.fields.map(f => (
            <div key={f.id} style={{ border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "12px 14px", background: C.white }}>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, alignItems: "end" }}>
                <div style={{ marginBottom: -18 }}>
                  <Sel label="Type" value={f.type} onChange={v => updateField(f.id, { type: v })} options={FIELD_TYPES} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, marginBottom: -18 }}>
                    <Inp label="Label" value={f.label} onChange={v => updateField(f.id, { label: v })} placeholder="e.g. Email" />
                  </div>
                  <button onClick={() => removeField(f.id)} aria-label="Remove field"
                    style={{ width: 34, height: 38, flexShrink: 0, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.md, color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={!f.optional} onChange={e => updateField(f.id, { optional: !e.target.checked })} style={{ accentColor: C.blue, width: 15, height: 15 }} />
                <span style={{ fontSize: 12.5, color: C.textSecondary }}>Required</span>
              </label>
            </div>
          ))}
        </div>
        <button onClick={addField}
          style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: C.blue, background: C.blueLight, border: `1px solid ${C.blueMid}`, borderRadius: radius.md, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
          + Add another field
        </button>
      </SectionCard>

      <SectionCard title="Payment methods">
        <p style={{ fontSize: 12.5, color: C.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>
          Methods offered inside the checkout. All on by default.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ALL_PAYMENT_METHODS.map(m => {
            const on = data.paymentMethods.includes(m.key);
            return (
              <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${on ? C.blueMid : C.border}`, borderRadius: radius.md, cursor: "pointer", background: C.white }}>
                <input type="checkbox" checked={on} onChange={() => toggleMethod(m.key)} style={{ accentColor: C.blue, width: 16, height: 16 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textSecondary }}>{m.label}</span>
              </label>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="After payment">
        <Textarea label="Custom success message" value={data.successMessage} onChange={v => set({ successMessage: v })}
          placeholder="e.g. Thank you! Your payment is confirmed and our team will be in touch shortly."
          rows={3}
          hint="Shown to the payer the moment a payment succeeds." />
        <InfoBanner type="info">
          v1 shows a custom success message only — automated receipts, redirects and webhooks aren't part of this surface
          (consistent with Payment Pages and Payment QR).
        </InfoBanner>
      </SectionCard>
    </div>
  );
}
