"use client";
import { C, radius } from "@/components/payment-pages/tokens";
import {
  Inp, Label, Toggle, SegmentedControl, ColorPicker, InfoBanner, SectionCard,
} from "@/components/payment-pages/primitives";

// ──────────────────────────────────────────────────────────────────────────────
// Payment QR — builder data model (v2).
//
// How a UPI QR behaves, in plain terms:
//   AMOUNT  any  → no amount in the code, customer types it
//           fixed→ amount baked into the code
//   USAGE   reusable → one printed code, many payments, never auto-expires.
//                      Optional end-date + payment cap.
//           onetime  → fresh code per sale on a billing SCREEN, short timer,
//                      closes on payment or timeout.
//
// Sticker content follows the NPCI BHIM UPI Merchant QR brand guidelines:
// the printed layout is composed of the mandated elements (BHIM|UPI lockup,
// partner + merchant identity, UPI ID, instruction line, issuance date).
// Custom messages, images, and decorative content are not part of the sticker.
// ──────────────────────────────────────────────────────────────────────────────

export type AmountMode = "any" | "fixed";
export type Usage = "reusable" | "onetime";
export type StandeeTheme = "light" | "dark";
export type FrameStyle = "rounded" | "sharp" | "ticket";

export interface QrData {
  merchantName: string;
  label: string;
  vpa: string;

  usage: Usage;
  amountMode: AmountMode;   // only meaningful when usage === "reusable"
  fixedAmount: string;

  // standee / screen design
  brandColor: string;
  standeeTheme: StandeeTheme;
  frameStyle: FrameStyle;

  // availability
  endDateEnabled: boolean;  // reusable
  endDate: string;          // yyyy-mm-dd
  capEnabled: boolean;      // reusable: close after N successful payments
  capCount: string;
  timerMinutes: string;     // onetime: per-bill validity window

  slug: string;
  slugTouched?: boolean;
}

export const DEFAULT_QR: QrData = {
  merchantName: "EnKash Demo Store",
  label: "",
  vpa: "enkashstore@okhdfcbank",

  usage: "reusable",
  amountMode: "any",
  fixedAmount: "",

  brandColor: "#1c5af4",
  standeeTheme: "light",
  frameStyle: "rounded",

  endDateEnabled: false,
  endDate: "",
  capEnabled: false,
  capCount: "",
  timerMinutes: "15",

  slug: "",
};

export function getQrSteps(): { key: string; label: string }[] {
  return [
    { key: "setup", label: "QR Setup" },
    { key: "design", label: "Design" },
  ];
}

export interface QrValidationError { step: number; message: string; }

export function validateQr(data: QrData): QrValidationError[] {
  const e: QrValidationError[] = [];
  if (!data.label.trim()) e.push({ step: 0, message: "Give this QR a name (for your own dashboard)." });
  if (!data.vpa.trim() || !data.vpa.includes("@")) e.push({ step: 0, message: "Enter a valid UPI ID (looks like name@bank)." });
  if (data.usage === "reusable" && data.amountMode === "fixed" && !(parseFloat(data.fixedAmount || "0") > 0)) {
    e.push({ step: 0, message: "Set a fixed amount greater than zero." });
  }
  if (data.usage === "reusable" && data.endDateEnabled && !data.endDate) {
    e.push({ step: 0, message: "Pick an end date, or turn the end date off." });
  }
  if (data.usage === "reusable" && data.capEnabled && !(parseInt(data.capCount || "0") > 0)) {
    e.push({ step: 0, message: "Enter how many payments to allow, or turn the cap off." });
  }
  return e;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — QR Setup (usage + amount)
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
        <Inp label="Business name" value={data.merchantName} onChange={v => set({ merchantName: v })}
          hint="Shown on the standee and in the customer's UPI app." />
        <Inp label="UPI ID (where money lands)" required value={data.vpa} onChange={v => set({ vpa: v })}
          placeholder="yourbusiness@okhdfcbank" prefix="₹→" />
      </SectionCard>

      <SectionCard title="How will this QR be used?">
        <div style={{ marginBottom: 14 }}>
          <SegmentedControl value={data.usage} onChange={v => set({ usage: v as Usage })}
            options={[{ key: "reusable", label: "Multiple Use" }, { key: "onetime", label: "One-time (per bill)" }]} />
        </div>
        {data.usage === "reusable" ? (
          <InfoBanner type="info">
            One <strong>printed</strong> code that lives on your counter and takes many payments. It stays active until you
            close it.
          </InfoBanner>
        ) : (
          <InfoBanner type="info">
            A fresh code is shown on a <strong>screen</strong> for each sale, with a short timer, and closes once it's paid or
            when it times out. The cashier sets the amount per bill.
          </InfoBanner>
        )}
      </SectionCard>

      {data.usage === "reusable" && (
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
                The amount is set into the code, so the customer just scans and confirms. Good for a fixed entry fee or
                product price.
              </InfoBanner>
            </>
          ) : (
            <>
              <InfoBanner type="info">
                One reusable code with no set amount — the customer types how much they're paying. Perfect for a counter
                sticker.
              </InfoBanner>
            </>
          )}
        </SectionCard>
      )}

      {data.usage === "onetime" && (
        <SectionCard title="Amount">
          <InfoBanner type="info">
            No amount is set here — the cashier enters it for each bill on the billing screen, then generates the code.
            Set how long each generated code stays valid below.
          </InfoBanner>
        </SectionCard>
      )}

      {data.usage === "reusable" ? (
        <>
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
      ) : (
        <SectionCard title="Per-bill timer">
          <Label>Each generated code is valid for</Label>
          <SegmentedControl value={data.timerMinutes} onChange={v => set({ timerMinutes: v })}
            options={[{ key: "5", label: "5 min" }, { key: "15", label: "15 min" }, { key: "30", label: "30 min" }]} />
          <div style={{ marginTop: 14 }}>
            <InfoBanner type="info">
              The code closes the moment it's paid, or when the timer runs out — whichever comes first. The cashier then
              generates a fresh one for the next customer.
            </InfoBanner>
          </div>
        </SectionCard>
      )}

      <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: "2px 4px 14px" }}>
        You can also <strong>deactivate</strong> any QR instantly from the dashboard. Payments made to a closed QR are
        auto-refunded to the customer.
      </p>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Design
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrDesign({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  const reusable = data.usage === "reusable";
  return (
    <div>
      <InfoBanner type="info">
        {reusable
          ? <>Design how your QR looks when <strong>printed</strong>. A <strong>standee</strong> is the small printed card you stand on your counter — like the PhonePe / Paytm cards you see at shops.</>
          : <>Design how your QR looks on the <strong>billing screen</strong> the cashier shows each customer. Your brand colour is applied automatically.</>}
      </InfoBanner>

      <SectionCard title="Brand">
        <ColorPicker label="Accent colour" value={data.brandColor} onChange={v => set({ brandColor: v })} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "2px 0 0", lineHeight: 1.5 }}>
          Used as the card background on the dark theme — the BHIM | UPI logo switches to its reverse (white) version
          automatically.
        </p>
      </SectionCard>

      {reusable && (
        <SectionCard title="The printed card">
          <Label>Card theme</Label>
          <div style={{ marginBottom: 16 }}>
            <SegmentedControl value={data.standeeTheme} onChange={v => set({ standeeTheme: v as StandeeTheme })}
              options={[{ key: "light", label: "Light" }, { key: "dark", label: "Dark" }]} />
          </div>
          <Label>Frame style</Label>
          <SegmentedControl value={data.frameStyle} onChange={v => set({ frameStyle: v as FrameStyle })}
            options={[{ key: "rounded", label: "Rounded" }, { key: "sharp", label: "Sharp" }, { key: "ticket", label: "Ticket" }]} />
          <p style={{ fontSize: 12, color: C.textFaint, margin: "10px 0 0", lineHeight: 1.5 }}>
            Watch the standee on the right update as you change these.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
