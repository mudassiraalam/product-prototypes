"use client";
import { C, radius } from "@/components/payment-pages/tokens";
import {
  Inp, Label, Toggle, SegmentedControl, ColorPicker, InfoBanner, SectionCard, Btn,
} from "@/components/payment-pages/primitives";
import { Icon } from "@/components/payment-pages/icons";

// ──────────────────────────────────────────────────────────────────────────────
// Payment QR — builder data model.
//
// Mirrors the Payment Pages WizardData *pattern* (one working object, progressive
// disclosure) but is QR-native: a QR lives on a counter, not in a browser, so the
// fields are about the printed standee and the amount behaviour, not page sections.
//
// One flow ("Standard QR"); priceMode is the progressive-disclosure axis:
//   fixed → dynamic QR, amount baked in        (à la Cashfree dynamic)
//   any   → static QR, customer types amount    (the reusable counter sticker)
//   menu  → small item list, dynamic per pick   (tea-stall menu)
// ──────────────────────────────────────────────────────────────────────────────

export type PriceMode = "fixed" | "any" | "menu";
export type StandeeTheme = "light" | "dark";
export type FrameStyle = "rounded" | "sharp" | "ticket";

export interface MenuItem {
  id: string;
  label: string;
  amount: string;
}

export interface QrData {
  // Identity
  merchantName: string;
  label: string;          // internal name for this QR (e.g. "Counter 1")
  vpa: string;            // merchant UPI ID the money lands in
  headline: string;       // text printed above the code, e.g. "Scan & Pay"

  // Amount behaviour
  priceMode: PriceMode;
  fixedAmount: string;
  items: MenuItem[];

  // What to collect from the payer at scan time
  collectName: boolean;
  collectPhone: boolean;
  collectNote: boolean;

  // Standee design
  brandColor: string;
  showLogo: boolean;
  logoLetter: string;
  standeeTheme: StandeeTheme;
  frameStyle: FrameStyle;

  // Rules & publish
  expires: boolean;       // only meaningful for dynamic (fixed / menu)
  expiryMinutes: string;
  maxPayments: string;
  successMessage: string;

  // builder URL helper
  slug: string;
  slugTouched?: boolean;
}

export const DEFAULT_QR: QrData = {
  merchantName: "EnKash Demo",
  label: "",
  vpa: "enkashdemo@okhdfcbank",
  headline: "Scan & Pay",

  priceMode: "fixed",
  fixedAmount: "",
  items: [],

  collectName: false,
  collectPhone: false,
  collectNote: false,

  brandColor: "#1c5af4",
  showLogo: true,
  logoLetter: "E",
  standeeTheme: "light",
  frameStyle: "rounded",

  expires: false,
  expiryMinutes: "10",
  maxPayments: "",
  successMessage: "Payment received — thank you!",

  slug: "",
};

export function getQrSteps(): { key: string; label: string }[] {
  return [
    { key: "setup", label: "QR Setup" },
    { key: "collect", label: "What to Collect" },
    { key: "standee", label: "Standee Design" },
    { key: "rules", label: "Rules & Publish" },
  ];
}

// ── Validation (runs once on Publish) ─────────────────────────────────────────
export interface QrValidationError { step: number; message: string; }

export function validateQr(data: QrData): QrValidationError[] {
  const errors: QrValidationError[] = [];
  const STEP_SETUP = 0;

  if (!data.label.trim()) errors.push({ step: STEP_SETUP, message: "Give this QR a name (for your own dashboard)." });
  if (!data.vpa.trim() || !data.vpa.includes("@")) {
    errors.push({ step: STEP_SETUP, message: "Enter a valid UPI ID (looks like name@bank)." });
  }
  if (data.priceMode === "fixed" && !(parseFloat(data.fixedAmount || "0") > 0)) {
    errors.push({ step: STEP_SETUP, message: "Set a fixed amount greater than zero." });
  }
  if (data.priceMode === "menu") {
    const ok = data.items.some(it => it.label.trim() && parseFloat(it.amount || "0") > 0);
    if (!ok) errors.push({ step: STEP_SETUP, message: "Add at least one menu item with a price." });
  }
  return errors;
}

// ── shared tiny helpers ───────────────────────────────────────────────────────
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uid = () => Math.random().toString(36).slice(2, 8);

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — QR Setup
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrSetup({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });

  const setLabel = (v: string) =>
    set({ label: v, slug: data.slugTouched ? data.slug : slugify(v) });

  const addItem = () => set({ items: [...data.items, { id: uid(), label: "", amount: "" }] });
  const updItem = (id: string, patch: Partial<MenuItem>) =>
    set({ items: data.items.map(it => it.id === id ? { ...it, ...patch } : it) });
  const delItem = (id: string) => set({ items: data.items.filter(it => it.id !== id) });

  return (
    <div>
      <SectionCard title="The basics">
        <Inp label="QR name" required value={data.label} onChange={setLabel}
          placeholder="e.g. Front Counter, Table 4, Diwali Stall"
          hint="Only you see this — it labels the QR on your dashboard." />
        <Inp label="Business name" value={data.merchantName} onChange={v => set({ merchantName: v })}
          hint="Printed on the standee and shown in the customer's UPI app." />
        <Inp label="UPI ID (where money lands)" required value={data.vpa} onChange={v => set({ vpa: v })}
          placeholder="yourbusiness@okhdfcbank" prefix="₹→" />
      </SectionCard>

      <SectionCard title="How does the amount work?">
        <div style={{ marginBottom: 16 }}>
          <SegmentedControl
            value={data.priceMode}
            onChange={v => set({ priceMode: v as PriceMode })}
            options={[
              { key: "fixed", label: "Fixed price" },
              { key: "any", label: "Any amount" },
              { key: "menu", label: "Menu" },
            ]}
          />
        </div>

        {data.priceMode === "fixed" && (
          <>
            <Inp label="Amount" required type="number" value={data.fixedAmount}
              onChange={v => set({ fixedAmount: v })} prefix="₹" placeholder="249" />
            <InfoBanner type="info">
              A <strong>dynamic</strong> QR — the amount is baked in, so the customer just scans and confirms. No typing.
            </InfoBanner>
          </>
        )}

        {data.priceMode === "any" && (
          <InfoBanner type="info">
            A <strong>static</strong> QR — one reusable code with no amount. The customer types how much they're paying.
            Perfect for a printed counter sticker.
          </InfoBanner>
        )}

        {data.priceMode === "menu" && (
          <>
            <Label>Menu items</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {data.items.length === 0 && (
                <p style={{ fontSize: 13, color: C.textFaint, margin: "2px 0 6px" }}>
                  No items yet — add a few (e.g. Chai ₹20, Coffee ₹40).
                </p>
              )}
              {data.items.map(it => (
                <div key={it.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <input value={it.label} onChange={e => updItem(it.id, { label: e.target.value })}
                      placeholder="Item name"
                      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ width: 110 }}>
                    <input value={it.amount} onChange={e => updItem(it.id, { amount: e.target.value })}
                      placeholder="₹" type="number"
                      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontFamily: "inherit", color: C.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={() => delItem(it.id)} title="Remove"
                    style={{ width: 34, height: 34, flexShrink: 0, border: `1.5px solid ${C.border}`, background: C.white, borderRadius: radius.md, cursor: "pointer", color: C.textMuted }}>✕</button>
                </div>
              ))}
            </div>
            <Btn variant="secondary" size="sm" onClick={addItem}>+ Add item</Btn>
            <div style={{ marginTop: 14 }}>
              <InfoBanner type="info">
                A <strong>dynamic</strong> QR per pick — the customer taps an item and the amount fills in automatically.
              </InfoBanner>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="What it says">
        <Inp label="Headline on the standee" value={data.headline} onChange={v => set({ headline: v })}
          placeholder="Scan & Pay" hint="The line printed above the QR square." />
      </SectionCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — What to Collect
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrCollect({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  return (
    <div>
      <InfoBanner type="info">
        UPI payments already capture the payer's bank reference automatically. Turn these on only if you need extra
        detail — each one is an extra tap for the customer, so keep it lean.
      </InfoBanner>
      <SectionCard title="Ask the payer for…">
        <Toggle checked={data.collectName} onChange={v => set({ collectName: v })}
          label="Name" desc="Useful for events or donations where you want to know who paid." />
        <Toggle checked={data.collectPhone} onChange={v => set({ collectPhone: v })}
          label="Phone number" desc="For sending a receipt or following up." />
        <Toggle checked={data.collectNote} onChange={v => set({ collectNote: v })}
          label="A short note" desc='e.g. "Table 4" or an order number, so you can match the payment.' />
      </SectionCard>
      {!data.collectName && !data.collectPhone && !data.collectNote && (
        <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: "2px 4px" }}>
          Nothing extra selected — fastest tap-and-go experience. Recommended for a busy counter.
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Standee Design
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrStandee({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  return (
    <div>
      <SectionCard title="Brand">
        <ColorPicker label="Accent colour" value={data.brandColor} onChange={v => set({ brandColor: v })} />
        <Toggle checked={data.showLogo} onChange={v => set({ showLogo: v })}
          label="Show logo in the centre" desc="A small badge in the middle of the code (the code still scans)." />
        {data.showLogo && (
          <Inp label="Logo letter" value={data.logoLetter}
            onChange={v => set({ logoLetter: v.slice(0, 2).toUpperCase() })} placeholder="E" />
        )}
      </SectionCard>

      <SectionCard title="The printed card">
        <Label>Card theme</Label>
        <div style={{ marginBottom: 16 }}>
          <SegmentedControl value={data.standeeTheme} onChange={v => set({ standeeTheme: v as StandeeTheme })}
            options={[{ key: "light", label: "Light" }, { key: "dark", label: "Dark" }]} />
        </div>
        <Label>Frame style</Label>
        <SegmentedControl value={data.frameStyle} onChange={v => set({ frameStyle: v as FrameStyle })}
          options={[
            { key: "rounded", label: "Rounded" },
            { key: "sharp", label: "Sharp" },
            { key: "ticket", label: "Ticket" },
          ]} />
        <p style={{ fontSize: 12, color: C.textFaint, margin: "10px 0 0", lineHeight: 1.5 }}>
          Watch the standee on the right update as you change these.
        </p>
      </SectionCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Rules & Publish
// ══════════════════════════════════════════════════════════════════════════════
export function StepQrRules({ data, setData }: { data: QrData; setData: (d: QrData) => void }) {
  const set = (patch: Partial<QrData>) => setData({ ...data, ...patch });
  const isStatic = data.priceMode === "any";
  return (
    <div>
      <SectionCard title="Expiry">
        {isStatic ? (
          <InfoBanner type="info">
            An <strong>Any amount</strong> QR is static and reusable, so it doesn't expire — print it once and leave it
            on the counter.
          </InfoBanner>
        ) : (
          <>
            <Toggle checked={data.expires} onChange={v => set({ expires: v })}
              label="Code expires after a set time"
              desc="Industry practice for dynamic QRs (Cashfree caps them too). If no one scans in time, you regenerate." />
            {data.expires && (
              <Inp label="Expires after (minutes)" type="number" value={data.expiryMinutes}
                onChange={v => set({ expiryMinutes: v })} suffix="min" placeholder="10" />
            )}
          </>
        )}
      </SectionCard>

      <SectionCard title="Limits & confirmation">
        <Inp label="Maximum payments (optional)" type="number" value={data.maxPayments}
          onChange={v => set({ maxPayments: v })} placeholder="Leave blank for unlimited" />
        <Inp label="Success message" value={data.successMessage} onChange={v => set({ successMessage: v })}
          hint="Shown to the customer after a successful payment." />
      </SectionCard>
    </div>
  );
}
