"use client";
import { C, radius } from "@/components/payment-pages/tokens";
import {
  Inp, Sel, Toggle, SegmentedControl, ColorPicker, InfoBanner, SectionCard,
} from "@/components/payment-pages/primitives";
import { MERCHANT_PROFILE, PRIMARY_VPA } from "./qr-mock-data";

// ──────────────────────────────────────────────────────────────────────────────
// Payment QR — builder data model (v3).
//
// Two objects this wizard authors:
//   reusable → printed standee. One code, many payments, never auto-expires.
//              Amount: any (customer types) or fixed (encoded in the QR — but
//              NEVER printed on the sticker; see addendum note below).
//   onetime  → one-time collect QR. Amount is mandatory, validity-limited,
//              shown on screen / shared as a link, dies on payment or expiry.
//              Not printed, so it has no Design step.
// A third object exists in the product but NOT in this wizard: transaction QRs
// minted by the merchant's own system via API at checkout (origin: "api").
// They appear on the dashboard as read-only rows.
//
// Standee layout per NPCI/UPI/OC-100B addendum (mandatory brand guidelines):
//   • BHIM|UPI lockup with ½x safe area, never adjacent to partner/merchant logos
//   • QR ≥60% of layout height, white tile + quiet zone
//   • "UPI ID: <vpa>" below/above the QR (≥10pt), never hugging the lockup
//   • Issuance date MM/YYYY on the RIGHT side of the QR — mandatory
//   • "SCAN & PAY WITH ANY UPI APP" line (≥20pt on standard format)
//   • Partner (EnKash) logo; merchant name optional, placed BESIDE partner logo;
//     when absent, partner logo centre-aligns
//   • Brand colour allowed as card background → BHIM|UPI reverse (white) logo
//   • No custom messages/images on the sticker → no amount text printed
//   • Centre logo: NOT sanctioned for static QRs (only Tap-to-Pay's symbol is).
//     Offered as a toggle, default OFF. [VERIFY: needs NPCI design approval,
//     Annexure B — upi.marketing@npci.org.in, 5 working days]
// ──────────────────────────────────────────────────────────────────────────────

export type AmountMode = "any" | "fixed";
export type Usage = "reusable" | "onetime";
export type CardColorMode = "white" | "brand";
export type LayoutVariant = "bhimTop" | "partnerTop";

export interface QrData {
  merchantName: string;     // read-only, from MERCHANT_PROFILE
  vpa: string;              // read-only, from MERCHANT_PROFILE
  label: string;

  usage: Usage;
  amountMode: AmountMode;   // reusable only
  fixedAmount: string;      // reusable + fixed (encoded, never printed)
  oneTimeAmount: string;    // onetime: mandatory

  // standee design (reusable only) — addendum-bounded
  cardColorMode: CardColorMode;
  brandColor: string;
  layoutVariant: LayoutVariant;
  showMerchantName: boolean;
  centerLogo: boolean;      // default off — needs NPCI approval

  // availability
  endDateEnabled: boolean;  // reusable
  endDate: string;          // yyyy-mm-dd
  capEnabled: boolean;      // reusable: close after N successful payments
  capCount: string;
  validityPreset: "15" | "60" | "1440" | "custom";  // onetime
  validityCustomMinutes: string;

  slug: string;
  slugTouched?: boolean;
}

export const DEFAULT_QR: QrData = {
  merchantName: MERCHANT_PROFILE.businessName,
  vpa: PRIMARY_VPA,
  label: "",

  usage: "reusable",
  amountMode: "any",
  fixedAmount: "",
  oneTimeAmount: "",

  cardColorMode: "white",
  brandColor: "#1c5af4",
  layoutVariant: "bhimTop",
  showMerchantName: true,
  centerLogo: false,

  endDateEnabled: false,
  endDate: "",
  capEnabled: false,
  capCount: "",
  validityPreset: "15",
  validityCustomMinutes: "",

  slug: "",
};

export function validityMinutes(data: QrData): number {
  if (data.validityPreset === "custom") return Math.max(1, parseInt(data.validityCustomMinutes || "0") || 0);
  return parseInt(data.validityPreset);
}

export function getQrSteps(usage: Usage): { key: string; label: string }[] {
  return usage === "reusable"
    ? [{ key: "setup", label: "QR Setup" }, { key: "design", label: "Design" }]
    : [{ key: "setup", label: "QR Setup" }, { key: "collect", label: "Amount & validity" }];
}

export interface QrValidationError { step: number; message: string; }

export function validateQr(data: QrData): QrValidationError[] {
  const e: QrValidationError[] = [];
  if (!data.label.trim()) e.push({ step: 0, message: "Give this QR a name (for your own dashboard)." });
  if (data.usage === "reusable") {
    if (data.amountMode === "fixed" && !(parseFloat(data.fixedAmount || "0") > 0)) {
      e.push({ step: 0, message: "Set a fixed amount greater than zero." });
    }
    if (data.endDateEnabled && !data.endDate) {
      e.push({ step: 0, message: "Pick an end date, or turn the end date off." });
    }
    if (data.capEnabled && !(parseInt(data.capCount || "0") > 0)) {
      e.push({ step: 0, message: "Enter how many payments to allow, or turn the cap off." });
    }
  } else {
    if (!(parseFloat(data.oneTimeAmount || "0") > 0)) {
      e.push({ step: 1, message: "Enter the amount to collect — a one-time QR always carries one." });
    }
    if (data.validityPreset === "custom" && !(parseInt(data.validityCustomMinutes || "0") > 0)) {
      e.push({ step: 1, message: "Enter a custom validity in minutes, or pick a preset." });
    }
  }
  return e;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — QR Setup (identity + usage)
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrSetup({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  const setLabel = (v: string) => set({ label: v, slug: data.slugTouched ? data.slug : slugify(v) });

  return (
    <div>
      <SectionCard title="The basics">
        <Inp label="QR name" required value={data.label} onChange={setLabel}
          placeholder="e.g. Front Counter, Gate A, Diwali Stall"
          hint="Only you see this — it labels the QR on your dashboard." />
        <Inp label="Business name" value={data.merchantName} onChange={() => {}} disabled
          hint="Verified at onboarding — shown to the customer in their UPI app." />
        <Sel label="Settle payments into" required value={data.vpa} onChange={v => set({ vpa: v })}
          options={MERCHANT_PROFILE.vpas.map(a => ({ value: a.vpa, label: `${a.vpa} — ${a.bank}` }))}
          hint="Verified settlement accounts only — added through KYC, never typed here." />
      </SectionCard>

      <SectionCard title="How will this QR be used?">
        <div style={{ marginBottom: 14 }}>
          <SegmentedControl value={data.usage} onChange={v => set({ usage: v as Usage })}
            options={[{ key: "reusable", label: "Multiple Use" }, { key: "onetime", label: "One-time collect" }]} />
        </div>
        {data.usage === "reusable" ? (
          <InfoBanner type="info">
            One <strong>printed</strong> code that lives on your counter and takes many payments. It stays active until you
            close it.
          </InfoBanner>
        ) : (
          <InfoBanner type="info">
            A code for collecting <strong>one specific payment</strong> — share it on a screen, WhatsApp or email. It closes
            after the payment, or when its timer runs out. You'll set the amount and validity in the next step.
          </InfoBanner>
        )}
      </SectionCard>

      {data.usage === "reusable" && (
        <>
          <SectionCard title="What amount does it take?">
            <div style={{ marginBottom: 14 }}>
              <SegmentedControl value={data.amountMode}
                onChange={v => set({ amountMode: v as AmountMode })}
                options={[{ key: "any", label: "Any amount" }, { key: "fixed", label: "Fixed price" }]} />
            </div>

            {data.amountMode === "fixed" ? (
              <>
                <Inp label="Amount" required type="number" value={data.fixedAmount}
                  onChange={v => set({ fixedAmount: v })} prefix="₹" placeholder="499" />
                <InfoBanner type="info">
                  The amount is encoded <strong>inside</strong> the code — the customer's UPI app shows it pre-filled. NPCI
                  guidelines don't allow printing the amount on the sticker itself.
                </InfoBanner>
              </>
            ) : (
              <InfoBanner type="info">
                One reusable code with no set amount — the customer types how much they're paying. Perfect for a counter
                sticker.
              </InfoBanner>
            )}
          </SectionCard>

          <SectionCard title="End date">
            <Toggle checked={data.endDateEnabled} onChange={v => set({ endDateEnabled: v })}
              label="Stop accepting payments after a date"
              desc="Good for events or seasonal stalls. Leave off for a permanent counter QR that never expires." />
            {data.endDateEnabled && (
              <Inp label="Active until" type="date" value={data.endDate} onChange={v => set({ endDate: v })} />
            )}
          </SectionCard>

          <SectionCard title="Payment limit">
            <Toggle checked={data.capEnabled} onChange={v => set({ capEnabled: v })}
              label="Close after a set number of payments"
              desc="e.g. 100 entry passes, then the QR stops accepting payments." />
            {data.capEnabled && (
              <Inp label="Maximum payments" type="number" value={data.capCount}
                onChange={v => set({ capCount: v })} placeholder="100" />
            )}
          </SectionCard>
        </>
      )}

      <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: "2px 4px 14px" }}>
        You can also <strong>deactivate</strong> any QR instantly from the dashboard. Payments made to a closed QR are
        auto-refunded to the customer.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 (one-time) — Amount & validity
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrCollect({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  return (
    <div>
      <SectionCard title="Amount to collect">
        <Inp label="Amount" required type="number" value={data.oneTimeAmount}
          onChange={v => set({ oneTimeAmount: v })} prefix="₹" placeholder="12500" />
        <InfoBanner type="info">
          The amount is encoded in the code — the payer's UPI app shows it pre-filled, so there's nothing to type and
          nothing to get wrong.
        </InfoBanner>
      </SectionCard>

      <SectionCard title="Valid for">
        <SegmentedControl value={data.validityPreset}
          onChange={v => set({ validityPreset: v as QrData["validityPreset"] })}
          options={[
            { key: "15", label: "15 min" }, { key: "60", label: "1 hour" },
            { key: "1440", label: "24 hours" }, { key: "custom", label: "Custom" },
          ]} />
        {data.validityPreset === "custom" && (
          <div style={{ marginTop: 14 }}>
            <Inp label="Validity (minutes)" required type="number" value={data.validityCustomMinutes}
              onChange={v => set({ validityCustomMinutes: v })} placeholder="120" suffix="min" />
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <InfoBanner type="info">
            The code closes the moment it's paid, or when the timer runs out — whichever comes first.
          </InfoBanner>
        </div>
      </SectionCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 (reusable) — Design. Four controls, all addendum-traceable. The QR,
// UPI ID line, issuance date, instruction strip and BHIM|UPI lockup are fixed
// furniture and never enter this step.
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrDesign({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  return (
    <div>
      <InfoBanner type="info">
        Design the <strong>printed standee</strong> around a fixed, scannable QR. Every combination here follows the NPCI
        BHIM UPI merchant QR guidelines — the final artwork still goes to NPCI for approval before printing.
      </InfoBanner>

      <SectionCard title="Card colour">
        <div style={{ marginBottom: 14 }}>
          <SegmentedControl value={data.cardColorMode}
            onChange={v => set({ cardColorMode: v as CardColorMode })}
            options={[{ key: "white", label: "White" }, { key: "brand", label: "Brand colour" }]} />
        </div>
        {data.cardColorMode === "brand" && (
          <>
            <ColorPicker label="Brand colour" value={data.brandColor} onChange={v => set({ brandColor: v })} />
            <p style={{ fontSize: 12, color: C.textFaint, margin: "2px 0 0", lineHeight: 1.5 }}>
              On a brand-coloured card the BHIM | UPI logo switches to its reverse (white) version automatically, as the
              guidelines require.
            </p>
          </>
        )}
      </SectionCard>

      <SectionCard title="Layout">
        <SegmentedControl value={data.layoutVariant}
          onChange={v => set({ layoutVariant: v as LayoutVariant })}
          options={[{ key: "bhimTop", label: "BHIM|UPI on top" }, { key: "partnerTop", label: "Partner on top" }]} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "10px 0 0", lineHeight: 1.5 }}>
          The two arrangements the guidelines sanction — the lockup at one end, the EnKash + business identity at the other.
        </p>
      </SectionCard>

      <SectionCard title="Business identity">
        <Toggle checked={data.showMerchantName} onChange={v => set({ showMerchantName: v })}
          label="Show business name on the sticker"
          desc="Optional. Shown beside the EnKash logo; when off, the EnKash logo centre-aligns on its own." />
      </SectionCard>

      <SectionCard title="QR centre logo">
        <Toggle checked={data.centerLogo} onChange={v => set({ centerLogo: v })}
          label="Place the EnKash logo in the QR centre"
          desc="Subject to NPCI design approval before go-live — keep off unless approved." />
      </SectionCard>
    </div>
  );
}
