"use client";
import { C, radius } from "@/components/payment-pages/tokens";
import {
  Inp, Label, Toggle, SegmentedControl, ColorPicker, InfoBanner, SectionCard, Btn,
} from "@/components/payment-pages/primitives";

// ──────────────────────────────────────────────────────────────────────────────
// Payment QR — builder data model (v2).
//
// Grounded in how Razorpay / Cashfree actually model UPI QR:
//   AMOUNT  any  → static QR, customer types amount
//           fixed→ amount baked into the code
//   USAGE   reusable → one printed code, many payments, never auto-expires
//                      (Razorpay multiple_use). Optional end-date + payment cap.
//           onetime  → fresh code per sale on a billing SCREEN, short timer,
//                      closes on payment or timeout (Razorpay single_use+close_by).
//
// "Menu" and "What to collect" were removed: a plain UPI QR cannot show a merchant
// item list or capture custom fields — that all happens inside the customer's UPI
// app, which the merchant can't touch. A price list, if wanted, is just printed
// text on the standee (decorative); the customer still types the total.
// ──────────────────────────────────────────────────────────────────────────────

export type AmountMode = "any" | "fixed";
export type Usage = "reusable" | "onetime";
export type StandeeTheme = "light" | "dark";
export type FrameStyle = "rounded" | "sharp" | "ticket";

export interface PriceItem { id: string; label: string; amount: string; }

export interface QrData {
  merchantName: string;
  label: string;
  vpa: string;
  headline: string;

  usage: Usage;
  amountMode: AmountMode;   // only meaningful when usage === "reusable"
  fixedAmount: string;

  // decorative price list printed on the standee (any-amount + reusable only)
  priceListEnabled: boolean;
  priceList: PriceItem[];

  // standee / screen design
  brandColor: string;
  showLogo: boolean;
  logoLetter: string;
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
  merchantName: "EnKash Demo",
  label: "",
  vpa: "enkashdemo@okhdfcbank",
  headline: "Scan & Pay",

  usage: "reusable",
  amountMode: "any",
  fixedAmount: "",

  priceListEnabled: false,
  priceList: [],

  brandColor: "#1c5af4",
  showLogo: true,
  logoLetter: "E",
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
    { key: "availability", label: "Availability" },
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
    e.push({ step: 2, message: "Pick an end date, or turn the end date off." });
  }
  if (data.usage === "reusable" && data.capEnabled && !(parseInt(data.capCount || "0") > 0)) {
    e.push({ step: 2, message: "Enter how many payments to allow, or turn the cap off." });
  }
  return e;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uid = () => Math.random().toString(36).slice(2, 8);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — QR Setup (usage + amount)
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrSetup({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  const setLabel = (v: string) => set({ label: v, slug: data.slugTouched ? data.slug : slugify(v) });

  const addItem = () => set({ priceList: [...data.priceList, { id: uid(), label: "", amount: "" }] });
  const updItem = (id: string, patch: Partial<PriceItem>) =>
    set({ priceList: data.priceList.map(it => it.id === id ? { ...it, ...patch } : it) });
  const delItem = (id: string) => set({ priceList: data.priceList.filter(it => it.id !== id) });

  const itemRow = (it: PriceItem) => (
    <div key={it.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={it.label} onChange={e => updItem(it.id, { label: e.target.value })} placeholder="Item (e.g. Chai)"
        style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box" }} />
      <input value={it.amount} onChange={e => updItem(it.id, { amount: e.target.value })} placeholder="₹" type="number"
        style={{ width: 96, padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box" }} />
      <button onClick={() => delItem(it.id)} title="Remove"
        style={{ width: 34, height: 34, flexShrink: 0, border: `1.5px solid ${C.border}`, background: C.white, borderRadius: radius.md, cursor: "pointer", color: C.textMuted }}>✕</button>
    </div>
  );

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
            options={[{ key: "reusable", label: "Reusable" }, { key: "onetime", label: "One-time (per bill)" }]} />
        </div>
        {data.usage === "reusable" ? (
          <InfoBanner type="info">
            One <strong>printed</strong> code that lives on your counter and takes many payments. Never expires until you
            close it. <em>(Razorpay calls this multiple-use.)</em>
          </InfoBanner>
        ) : (
          <InfoBanner type="info">
            A fresh code is shown on a <strong>screen</strong> for each sale, with a short timer, and closes once paid or
            when it times out. The cashier sets the amount per bill. <em>(Razorpay calls this single-use.)</em>
          </InfoBanner>
        )}
      </SectionCard>

      {data.usage === "reusable" && (
        <SectionCard title="What amount does it take?">
          <div style={{ marginBottom: 14 }}>
            <SegmentedControl value={data.amountMode} onChange={v => set({ amountMode: v as AmountMode })}
              options={[{ key: "any", label: "Any amount" }, { key: "fixed", label: "Fixed price" }]} />
          </div>

          {data.amountMode === "fixed" ? (
            <>
              <Inp label="Amount" required type="number" value={data.fixedAmount}
                onChange={v => set({ fixedAmount: v })} prefix="₹" placeholder="499" />
              <InfoBanner type="info">
                A <strong>dynamic</strong> QR — the amount is baked in, so the customer just scans and confirms. Good for a
                fixed entry fee or product price.
              </InfoBanner>
            </>
          ) : (
            <>
              <InfoBanner type="info">
                A <strong>static</strong> QR — one reusable code with no amount. The customer types how much they're paying.
                Perfect for a counter sticker.
              </InfoBanner>
              <div style={{ marginTop: 14 }}>
                <Toggle checked={data.priceListEnabled} onChange={v => set({ priceListEnabled: v })}
                  label="Print a price list on the standee"
                  desc="Just text on the card so customers know what to type — they still enter the amount themselves." />
              </div>
              {data.priceListEnabled && (
                <div style={{ marginTop: 6 }}>
                  <Label>Items shown on the card</Label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                    {data.priceList.length === 0 && (
                      <p style={{ fontSize: 13, color: C.textFaint, margin: "2px 0 6px" }}>No items yet — add a few (e.g. Chai ₹20).</p>
                    )}
                    {data.priceList.map(itemRow)}
                  </div>
                  <Btn variant="secondary" size="sm" onClick={addItem}>+ Add item</Btn>
                </div>
              )}
            </>
          )}
        </SectionCard>
      )}

      {data.usage === "onetime" && (
        <SectionCard title="Amount">
          <InfoBanner type="info">
            No amount is set here — the cashier enters it for each bill on the billing screen, then generates the code.
            You'll set the validity timer in the next-but-one step.
          </InfoBanner>
        </SectionCard>
      )}

      <SectionCard title="What it says">
        <Inp label="Headline on the code" value={data.headline} onChange={v => set({ headline: v })}
          placeholder="Scan & Pay" hint="The line printed above the QR square." />
      </SectionCard>
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
          : <>Design how your QR looks on the <strong>billing screen</strong> the cashier shows each customer. Your brand colour and logo are applied automatically.</>}
      </InfoBanner>

      <SectionCard title="Brand">
        <ColorPicker label="Accent colour" value={data.brandColor} onChange={v => set({ brandColor: v })} />
        <Toggle checked={data.showLogo} onChange={v => set({ showLogo: v })}
          label="Show logo in the centre" desc="A small badge in the middle of the code (it still scans)." />
        {data.showLogo && (
          <Inp label="Logo letter" value={data.logoLetter}
            onChange={v => set({ logoLetter: v.slice(0, 2).toUpperCase() })} placeholder="E" />
        )}
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

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Availability
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrAvailability({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });

  return (
    <div>
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
              desc="e.g. 100 entry passes, then the QR stops. (An EnKash extra — Razorpay natively only does single-use or unlimited.)" />
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
              generates a fresh one for the next customer. (Within Razorpay's 2-min–2-hr window.)
            </InfoBanner>
          </div>
        </SectionCard>
      )}

      <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: "2px 4px" }}>
        You can also <strong>deactivate</strong> any QR instantly from the dashboard. Payments made to a closed QR are
        auto-refunded to the customer.
      </p>
    </div>
  );
}
