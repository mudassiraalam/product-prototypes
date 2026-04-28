"use client";
import { useRef, useState } from "react";
import { C, radius } from "./tokens";
import { Inp, Textarea, Sel, Toggle, ColorPicker, SegmentedControl, InfoBanner, SectionCard, Label, Btn } from "./primitives";

export type PageType = "standard" | "donation" | "event" | "invoice";

export interface Ticket {
  name: string;
  price: string;
  capacity: string;
  description?: string;
}

export interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface WizardData {
  // Common
  pageType: PageType;
  merchantName: string;
  title: string;
  description: string;
  pageSlug: string;
  coverImage: string; // data URL or placeholder
  productImage: string;
  currency: "INR" | "USD" | "EUR" | "GBP" | "AED";

  // Standard
  amountType: "fixed" | "customer" | "multiple";
  fixedAmount: string;
  minAmount: string;
  maxAmount: string;
  items: { label: string; amount: string; amountType: "fixed" | "customer" | "quantity"; optional: boolean }[];

  // Donation
  suggestedAmounts: string[];
  allowCustomDonation: boolean;
  is80G: boolean;
  collectPan: boolean;

  // Event
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  tickets: Ticket[];

  // Invoice
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  lineItems: LineItem[];
  taxPercent: string;
  dueDate: string;
  invoiceTerms: string;

  // Customer fields
  customerFields: { type: string; label: string; optional: boolean }[];

  // Branding / Customization
  brandColor: string;
  buttonLabel: string;
  theme: "light" | "dark";
  layout: "centered" | "wide";
  fontStyle: "default" | "serif" | "mono";
  buttonStyle: "rounded" | "sharp" | "pill";
  showLogo: boolean;

  // Settings - Contact Us
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactWebsite: string;
  supportLink: string;

  // Settings - Social
  socialTwitter: string;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;

  // Gallery & Terms (collected in Step 1)
  galleryImages: string[];
  termsText: string;

  // Settings - Publish
  expiryDate: string;
  maxPayments: string;
  maxRevenue: string;
  successMessage: string;
  redirectUrl: string;
  sendReceipt: boolean;
  webhookUrl: string;
  capturePayment: boolean;
}

export const DEFAULT_WIZARD: WizardData = {
  pageType: "standard",
  merchantName: "EnKash Demo",
  title: "",
  description: "",
  pageSlug: "",
  coverImage: "",
  productImage: "",
  currency: "INR",

  amountType: "fixed",
  fixedAmount: "",
  minAmount: "",
  maxAmount: "",
  items: [],

  suggestedAmounts: ["100", "500", "1000", "2500"],
  allowCustomDonation: true,
  is80G: false,
  collectPan: false,

  eventDate: "",
  eventTime: "",
  eventVenue: "",
  tickets: [{ name: "General Admission", price: "", capacity: "", description: "" }],

  invoiceNumber: "",
  customerName: "",
  customerEmail: "",
  lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
  taxPercent: "0",
  dueDate: "",
  invoiceTerms: "",

  customerFields: [
    { type: "name", label: "Full Name", optional: false },
    { type: "email", label: "Email Address", optional: false },
    { type: "phone", label: "Phone Number", optional: false },
  ],

  brandColor: "#1c5af4",
  buttonLabel: "Pay Securely",
  theme: "light",
  layout: "centered",
  fontStyle: "default",
  buttonStyle: "rounded",
  showLogo: true,

  galleryImages: [],
  termsText: "",

  contactEmail: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactWebsite: "",
  supportLink: "",

  socialTwitter: "",
  socialInstagram: "",
  socialFacebook: "",
  socialLinkedin: "",

  expiryDate: "",
  maxPayments: "",
  maxRevenue: "",
  successMessage: "",
  redirectUrl: "",
  sendReceipt: true,
  webhookUrl: "",
  capturePayment: true,
};

const FIELD_TYPES = [
  { value: "name", label: "Full Name" }, { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" }, { value: "company", label: "Company Name" },
  { value: "gstin", label: "GSTIN" }, { value: "address", label: "Address" },
  { value: "pan", label: "PAN Number" }, { value: "text", label: "Single Line Text" },
  { value: "textarea", label: "Multi-line Text" }, { value: "date", label: "Date" },
  { value: "number", label: "Number" }, { value: "dropdown", label: "Dropdown" },
];

// ── Image Upload ──────────────────────────────────────────────────────────────
function ImageUpload({
  label, value, onChange, hint, ratio = "16:9",
}: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; ratio?: "16:9" | "1:1" | "4:1";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const aspect = ratio === "16:9" ? "16 / 9" : ratio === "4:1" ? "4 / 1" : "1 / 1";

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onChange((e.target?.result as string) ?? "");
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%", aspectRatio: aspect, border: `1.5px dashed ${value ? C.blueMid : C.border}`,
          borderRadius: radius.md, background: value ? "transparent" : C.bg, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          backgroundImage: value ? `url(${value})` : "none", backgroundSize: "cover", backgroundPosition: "center",
          position: "relative", transition: "border-color 0.15s",
        }}
      >
        {!value && (
          <div style={{ textAlign: "center", color: C.textMuted }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
            <p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>Click to upload</p>
            <p style={{ fontSize: 10, margin: "2px 0 0", color: C.textFaint }}>PNG, JPG up to 2MB</p>
          </div>
        )}
        {value && (
          <button
            onClick={e => { e.stopPropagation(); onChange(""); }}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: C.white, border: "none", borderRadius: radius.sm, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {hint && <p style={{ fontSize: 12, color: C.textFaint, margin: "6px 0 0", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

const CURRENCIES = [
  { value: "INR", label: "INR (₹)" }, { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" }, { value: "GBP", label: "GBP (£)" }, { value: "AED", label: "AED (د.إ)" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Shared: Page Info Section (gallery, contact, terms) — used in all Step 1s
// ──────────────────────────────────────────────────────────────────────────────
function PageInfoSection({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const [open, setOpen] = useState(false);

  const addImage = (url: string) => {
    if (data.galleryImages.length < 4) setData({ ...data, galleryImages: [...data.galleryImages, url] });
  };
  const removeImage = (i: number) => setData({ ...data, galleryImages: data.galleryImages.filter((_, idx) => idx !== i) });

  return (
    <SectionCard title="">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
          Page Info <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>(contact, gallery, terms)</span>
        </span>
        <span style={{ fontSize: 16, color: C.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          {/* Contact */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Contact</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Email" value={data.contactEmail} onChange={v => setData({ ...data, contactEmail: v })} placeholder="support@brand.com" type="email" />
              <Inp label="Phone" value={data.contactPhone} onChange={v => setData({ ...data, contactPhone: v })} placeholder="+91 98765 43210" />
            </div>
          </div>

          {/* Gallery */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Image Gallery <span style={{ fontWeight: 400, textTransform: "none" }}>(up to 4)</span></p>
            {data.galleryImages.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
                {data.galleryImages.map((img, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: radius.sm, background: `url(${img}) center/cover`, border: `1px solid ${C.border}` }}>
                    <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10, lineHeight: "18px", textAlign: "center", padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {data.galleryImages.length < 4 && (
              <ImageUpload label="" value="" onChange={addImage} hint="Add a product/service image" ratio="4:3" />
            )}
          </div>

          {/* Terms */}
          <Textarea label="Terms & Conditions" value={data.termsText} onChange={v => setData({ ...data, termsText: v })} placeholder="By completing payment, you agree to..." rows={3} hint="Optional — shown at the bottom of your payment page" />
        </div>
      )}
    </SectionCard>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1: Page Details (per-type)
// ──────────────────────────────────────────────────────────────────────────────

export function StepStandardDetails({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const slugAuto = data.pageSlug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Page Details</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>What are you selling? Add a clear title, description and a banner image.</p>

      <SectionCard title="Basics">
        <Inp label="Page Title" value={data.title} onChange={v => setData({ ...data, title: v })} placeholder="e.g. Bluetooth Headphones" required />
        <Textarea label="Description" value={data.description} onChange={v => setData({ ...data, description: v })} placeholder="Describe what your customers are paying for..." rows={4} hint="Maximum 500 characters" />
      </SectionCard>

      <SectionCard title="Visuals">
        <ImageUpload label="Cover Banner" value={data.coverImage} onChange={v => setData({ ...data, coverImage: v })} ratio="4:1" hint="Recommended size: 1200×300 px. Shown at the top of your page." />
        <ImageUpload label="Product Image" value={data.productImage} onChange={v => setData({ ...data, productImage: v })} ratio="1:1" hint="Square thumbnail shown next to your product title." />
      </SectionCard>

      <SectionCard title="Pricing">
        <div style={{ marginBottom: 14 }}>
          <Label>Amount Type</Label>
          <SegmentedControl
            options={[
              { key: "fixed", label: "Fixed Amount" },
              { key: "customer", label: "Customer Decides" },
              { key: "multiple", label: "Multiple Items" },
            ]}
            value={data.amountType}
            onChange={v => setData({ ...data, amountType: v as "fixed" | "customer" | "multiple" })}
          />
        </div>

        <Sel label="Currency" value={data.currency} onChange={v => setData({ ...data, currency: v as WizardData["currency"] })} options={CURRENCIES} />

        {data.amountType === "fixed" && (
          <Inp label="Amount" value={data.fixedAmount} onChange={v => setData({ ...data, fixedAmount: v })} placeholder="0.00" prefix={getSymbol(data.currency)} type="number" required />
        )}
        {data.amountType === "customer" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Minimum" value={data.minAmount} onChange={v => setData({ ...data, minAmount: v })} placeholder="100" prefix={getSymbol(data.currency)} type="number" />
            <Inp label="Maximum" value={data.maxAmount} onChange={v => setData({ ...data, maxAmount: v })} placeholder="100000" prefix={getSymbol(data.currency)} type="number" />
          </div>
        )}
        {data.amountType === "multiple" && (
          <ItemsEditor data={data} setData={setData} />
        )}
      </SectionCard>

      <PageInfoSection data={data} setData={setData} />

      <SectionCard title="URL">
        <Inp label="Custom URL" value={data.pageSlug} onChange={v => setData({ ...data, pageSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="bluetooth-headphones" prefix="pay.enkash.in/" hint={`Your page will be available at pay.enkash.in/${slugAuto || "your-slug"}`} />
      </SectionCard>
    </div>
  );
}

export function StepDonationDetails({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateSuggested = (i: number, v: string) => {
    const arr = [...data.suggestedAmounts];
    arr[i] = v;
    setData({ ...data, suggestedAmounts: arr });
  };
  const removeSuggested = (i: number) => setData({ ...data, suggestedAmounts: data.suggestedAmounts.filter((_, idx) => idx !== i) });
  const addSuggested = () => setData({ ...data, suggestedAmounts: [...data.suggestedAmounts, ""] });

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Cause Details</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Tell donors about your cause and how their contribution helps.</p>

      <SectionCard title="About the cause">
        <Inp label="Title of the Cause" value={data.title} onChange={v => setData({ ...data, title: v })} placeholder="e.g. Help feed underprivileged children" required />
        <Textarea label="Cause Story" value={data.description} onChange={v => setData({ ...data, description: v })} placeholder="Share your cause's mission, impact and the difference donations make..." rows={5} hint="A compelling story increases donations by up to 60%." />
      </SectionCard>

      <SectionCard title="Visuals">
        <ImageUpload label="Cause Banner" value={data.coverImage} onChange={v => setData({ ...data, coverImage: v })} ratio="4:1" hint="A powerful image that represents your cause." />
      </SectionCard>

      <SectionCard title="Donation amounts">
        <Sel label="Currency" value={data.currency} onChange={v => setData({ ...data, currency: v as WizardData["currency"] })} options={CURRENCIES} />

        <Label>Suggested Amounts</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 8 }}>
          {data.suggestedAmounts.map((amt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Inp value={amt} onChange={v => updateSuggested(i, v)} placeholder="0" prefix={getSymbol(data.currency)} type="number" />
              <button onClick={() => removeSuggested(i)} style={{ background: C.redBg, color: C.red, border: "none", borderRadius: radius.sm, width: 32, height: 38, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 18, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
        <Btn variant="secondary" size="sm" onClick={addSuggested}>+ Add suggested amount</Btn>

        <div style={{ marginTop: 18 }}>
          <Toggle checked={data.allowCustomDonation} onChange={v => setData({ ...data, allowCustomDonation: v })} label="Allow custom amount" desc="Let donors enter any amount of their choice" />
          {data.allowCustomDonation && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Minimum" value={data.minAmount} onChange={v => setData({ ...data, minAmount: v })} placeholder="50" prefix={getSymbol(data.currency)} type="number" />
              <Inp label="Maximum" value={data.maxAmount} onChange={v => setData({ ...data, maxAmount: v })} placeholder="500000" prefix={getSymbol(data.currency)} type="number" />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Compliance (India)">
        <Toggle checked={data.is80G} onChange={v => setData({ ...data, is80G: v, collectPan: v ? true : data.collectPan })} label="80G tax exemption certificate" desc="Generate 80G receipts automatically. Donors enjoy tax benefits." />
        <Toggle checked={data.collectPan} onChange={v => setData({ ...data, collectPan: v })} label="Collect PAN from donors" desc="Required for 80G receipts and donations above ₹50,000" />
      </SectionCard>

      <PageInfoSection data={data} setData={setData} />

      <SectionCard title="URL">
        <Inp label="Custom URL" value={data.pageSlug} onChange={v => setData({ ...data, pageSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="diwali-charity-2024" prefix="pay.enkash.in/" />
      </SectionCard>
    </div>
  );
}

export function StepEventDetails({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateTicket = (i: number, patch: Partial<Ticket>) => {
    const arr = [...data.tickets]; arr[i] = { ...arr[i], ...patch };
    setData({ ...data, tickets: arr });
  };
  const addTicket = () => setData({ ...data, tickets: [...data.tickets, { name: "", price: "", capacity: "", description: "" }] });
  const removeTicket = (i: number) => setData({ ...data, tickets: data.tickets.filter((_, idx) => idx !== i) });

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Event Details</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Set up your event, ticket tiers and capacity.</p>

      <SectionCard title="Event">
        <Inp label="Event Name" value={data.title} onChange={v => setData({ ...data, title: v })} placeholder="e.g. Tech Summit 2025" required />
        <Textarea label="About the Event" value={data.description} onChange={v => setData({ ...data, description: v })} placeholder="Describe what attendees will experience, speakers, agenda..." rows={4} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Inp label="Date" value={data.eventDate} onChange={v => setData({ ...data, eventDate: v })} type="date" required />
          <Inp label="Time" value={data.eventTime} onChange={v => setData({ ...data, eventTime: v })} type="time" />
        </div>
        <Inp label="Venue" value={data.eventVenue} onChange={v => setData({ ...data, eventVenue: v })} placeholder="e.g. JW Marriott, Bengaluru / Online" />
      </SectionCard>

      <SectionCard title="Banner">
        <ImageUpload label="Event Banner" value={data.coverImage} onChange={v => setData({ ...data, coverImage: v })} ratio="16:9" hint="A great banner photo helps boost ticket sales." />
      </SectionCard>

      <SectionCard title="Tickets">
        <Sel label="Currency" value={data.currency} onChange={v => setData({ ...data, currency: v as WizardData["currency"] })} options={CURRENCIES} />

        {data.tickets.map((t, i) => (
          <div key={i} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>Ticket {i + 1}</p>
              {data.tickets.length > 1 && (
                <button onClick={() => removeTicket(i)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>Remove</button>
              )}
            </div>
            <Inp label="Name" value={t.name} onChange={v => updateTicket(i, { name: v })} placeholder="e.g. Early Bird, VIP, General" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Price" value={t.price} onChange={v => updateTicket(i, { price: v })} placeholder="0" prefix={getSymbol(data.currency)} type="number" />
              <Inp label="Capacity" value={t.capacity} onChange={v => updateTicket(i, { capacity: v })} placeholder="100" type="number" hint="Total seats" />
            </div>
            <Inp label="Description" value={t.description ?? ""} onChange={v => updateTicket(i, { description: v })} placeholder="What this ticket includes (optional)" />
          </div>
        ))}
        <Btn variant="secondary" size="sm" onClick={addTicket}>+ Add another ticket type</Btn>
      </SectionCard>

      <PageInfoSection data={data} setData={setData} />

      <SectionCard title="URL">
        <Inp label="Custom URL" value={data.pageSlug} onChange={v => setData({ ...data, pageSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="tech-summit-2025" prefix="pay.enkash.in/" />
      </SectionCard>
    </div>
  );
}

export function StepInvoiceDetails({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateLine = (i: number, patch: Partial<LineItem>) => {
    const arr = [...data.lineItems]; arr[i] = { ...arr[i], ...patch };
    setData({ ...data, lineItems: arr });
  };
  const addLine = () => setData({ ...data, lineItems: [...data.lineItems, { description: "", quantity: "1", unitPrice: "" }] });
  const removeLine = (i: number) => setData({ ...data, lineItems: data.lineItems.filter((_, idx) => idx !== i) });

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Invoice Details</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Bill a specific client. Auto-generate a tax-compliant invoice.</p>

      <SectionCard title="Invoice Info">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Inp label="Invoice Number" value={data.invoiceNumber} onChange={v => setData({ ...data, invoiceNumber: v })} placeholder="INV-2025-001" required />
          <Inp label="Due Date" value={data.dueDate} onChange={v => setData({ ...data, dueDate: v })} type="date" required />
        </div>
        <Inp label="Invoice Title" value={data.title} onChange={v => setData({ ...data, title: v })} placeholder="e.g. Web Development Services - Q4" required />
      </SectionCard>

      <SectionCard title="Bill to">
        <Inp label="Customer Name" value={data.customerName} onChange={v => setData({ ...data, customerName: v })} placeholder="Acme Corp" required />
        <Inp label="Customer Email" value={data.customerEmail} onChange={v => setData({ ...data, customerEmail: v })} placeholder="billing@acme.com" type="email" required />
      </SectionCard>

      <SectionCard title="Line Items">
        <Sel label="Currency" value={data.currency} onChange={v => setData({ ...data, currency: v as WizardData["currency"] })} options={CURRENCIES} />

        {data.lineItems.map((li, i) => (
          <div key={i} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>Item {i + 1}</p>
              {data.lineItems.length > 1 && (
                <button onClick={() => removeLine(i)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Remove</button>
              )}
            </div>
            <Inp label="Description" value={li.description} onChange={v => updateLine(i, { description: v })} placeholder="e.g. Website redesign" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
              <Inp label="Qty" value={li.quantity} onChange={v => updateLine(i, { quantity: v })} placeholder="1" type="number" />
              <Inp label="Unit Price" value={li.unitPrice} onChange={v => updateLine(i, { unitPrice: v })} placeholder="0" prefix={getSymbol(data.currency)} type="number" />
            </div>
          </div>
        ))}
        <Btn variant="secondary" size="sm" onClick={addLine}>+ Add another line item</Btn>

        <div style={{ marginTop: 18 }}>
          <Inp label="Tax Rate (%)" value={data.taxPercent} onChange={v => setData({ ...data, taxPercent: v })} placeholder="18" type="number" suffix="%" hint="Applied on the subtotal of all line items" />
        </div>
      </SectionCard>

      <SectionCard title="Terms & Notes">
        <Textarea label="Terms (optional)" value={data.invoiceTerms} onChange={v => setData({ ...data, invoiceTerms: v })} placeholder="Payment terms, late fees, additional notes..." rows={3} />
      </SectionCard>

      <PageInfoSection data={data} setData={setData} />

      <SectionCard title="URL">
        <Inp label="Custom URL" value={data.pageSlug} onChange={v => setData({ ...data, pageSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="invoice-acme-q4" prefix="pay.enkash.in/" />
      </SectionCard>
    </div>
  );
}

// Reusable items editor for "multiple items" amount type in Standard
function ItemsEditor({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateItem = (i: number, patch: Partial<WizardData["items"][0]>) => {
    const arr = [...data.items]; arr[i] = { ...arr[i], ...patch };
    setData({ ...data, items: arr });
  };
  const addItem = () => setData({ ...data, items: [...data.items, { label: "", amount: "", amountType: "fixed", optional: false }] });
  const removeItem = (i: number) => setData({ ...data, items: data.items.filter((_, idx) => idx !== i) });

  if (data.items.length === 0) {
    return (
      <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: radius.md, padding: 20, textAlign: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 10px" }}>No items added yet</p>
        <Btn variant="secondary" size="sm" onClick={addItem}>+ Add your first item</Btn>
      </div>
    );
  }

  return (
    <div>
      {data.items.map((it, i) => (
        <div key={i} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>Item {i + 1}</p>
            <button onClick={() => removeItem(i)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Remove</button>
          </div>
          <Inp label="Item Name" value={it.label} onChange={v => updateItem(i, { label: v })} placeholder="e.g. T-shirt — Medium" />
          <Inp label="Amount" value={it.amount} onChange={v => updateItem(i, { amount: v })} placeholder="0" prefix={getSymbol(data.currency)} type="number" />
        </div>
      ))}
      <Btn variant="secondary" size="sm" onClick={addItem}>+ Add another item</Btn>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2: Customer Fields
// ──────────────────────────────────────────────────────────────────────────────
export function StepCustomerFields({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateField = (i: number, patch: Partial<typeof data.customerFields[0]>) => {
    const arr = [...data.customerFields]; arr[i] = { ...arr[i], ...patch };
    setData({ ...data, customerFields: arr });
  };
  const addField = () => setData({ ...data, customerFields: [...data.customerFields, { type: "text", label: "Custom Field", optional: true }] });
  const removeField = (i: number) => setData({ ...data, customerFields: data.customerFields.filter((_, idx) => idx !== i) });

  const role = data.pageType === "donation" ? "donor" : data.pageType === "event" ? "attendee" : "customer";
  const heading = data.pageType === "donation" ? "Donor Details" : data.pageType === "event" ? "Attendee Details" : "Customer Details";

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{heading}</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Choose what information to collect from each {role}.</p>

      <InfoBanner type="info">
        Required fields are validated before payment. Optional fields can be skipped by the {role}.
      </InfoBanner>

      {data.customerFields.map((f, i) => (
        <div key={i} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>Field {i + 1}</p>
            <button onClick={() => removeField(i)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Remove</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Sel label="Type" value={f.type} onChange={v => {
              const opt = FIELD_TYPES.find(x => x.value === v);
              updateField(i, { type: v, label: opt?.label ?? f.label });
            }} options={FIELD_TYPES} />
            <Inp label="Label" value={f.label} onChange={v => updateField(i, { label: v })} />
          </div>
          <Toggle checked={f.optional} onChange={v => updateField(i, { optional: v })} label="Optional field" desc={`The ${role} can skip this field`} />
        </div>
      ))}

      <Btn variant="secondary" size="sm" onClick={addField}>+ Add another field</Btn>

      {data.pageType === "donation" && data.is80G && (
        <div style={{ marginTop: 18 }}>
          <InfoBanner type="warning">
            For 80G compliance, PAN is required for donations above ₹50,000. We&apos;ve added it automatically.
          </InfoBanner>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3: Customization
// ──────────────────────────────────────────────────────────────────────────────
export function StepCustomization({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const presets = ["#1c5af4", "#0891b2", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0f172a"];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Customize Look & Feel</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Match the page to your brand. Watch it update live in the preview.</p>

      <SectionCard title="Brand Color">
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {presets.map(p => (
            <button key={p} onClick={() => setData({ ...data, brandColor: p })}
              style={{
                width: 32, height: 32, borderRadius: "50%", border: data.brandColor === p ? `3px solid ${C.text}` : `2px solid ${C.border}`,
                background: p, cursor: "pointer", transition: "all 0.15s",
              }}
              aria-label={`Preset ${p}`}
            />
          ))}
        </div>
        <ColorPicker label="Custom Color" value={data.brandColor} onChange={v => setData({ ...data, brandColor: v })} />
        <Toggle checked={data.showLogo} onChange={v => setData({ ...data, showLogo: v })} label="Show merchant logo on banner" desc="Adds a small logo badge to the top of your page" />
        {data.showLogo && (
          <ImageUpload
            label="Upload Logo"
            value={(data as any).logoImage || ""}
            onChange={v => setData({ ...data, ...({ logoImage: v } as any) })}
            hint="Square image recommended (PNG with transparent background works best)"
            ratio="1:1"
          />
        )}
      </SectionCard>

      <SectionCard title="Theme">
        <div style={{ marginBottom: 14 }}>
          <Label>Mode</Label>
          <SegmentedControl
            options={[{ key: "light", label: "Light" }, { key: "dark", label: "Dark" }]}
            value={data.theme}
            onChange={v => setData({ ...data, theme: v as "light" | "dark" })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Typography & Buttons">
        <div style={{ marginBottom: 14 }}>
          <Label>Font Style</Label>
          <SegmentedControl
            options={[{ key: "default", label: "Sans" }, { key: "serif", label: "Serif" }, { key: "mono", label: "Mono" }]}
            value={data.fontStyle}
            onChange={v => setData({ ...data, fontStyle: v as "default" | "serif" | "mono" })}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <Label>Button Style</Label>
          <SegmentedControl
            options={[{ key: "rounded", label: "Rounded" }, { key: "pill", label: "Pill" }, { key: "sharp", label: "Sharp" }]}
            value={data.buttonStyle}
            onChange={v => setData({ ...data, buttonStyle: v as "rounded" | "sharp" | "pill" })}
          />
        </div>
        <Inp label="Pay Button Label" value={data.buttonLabel} onChange={v => setData({ ...data, buttonLabel: v })} placeholder="Pay Securely" hint="Maximum 24 characters" />
      </SectionCard>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 4: Settings & Publish
// ──────────────────────────────────────────────────────────────────────────────
export function StepSettings({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Settings & Publish</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Add contact info, social links, expiry and post-payment behaviour.</p>

      <SectionCard title="Contact Us (shown on page)">
        <Inp label="Email" value={data.contactEmail} onChange={v => setData({ ...data, contactEmail: v })} placeholder="support@yourbrand.com" type="email" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="Phone Number" value={data.contactPhone} onChange={v => setData({ ...data, contactPhone: v })} placeholder="+91 9876543210" />
          <Inp label="WhatsApp Number" value={data.contactWhatsapp} onChange={v => setData({ ...data, contactWhatsapp: v })} placeholder="+91 9876543210" />
        </div>
        <Inp label="Website URL" value={data.contactWebsite} onChange={v => setData({ ...data, contactWebsite: v })} placeholder="https://yourbrand.com" />
        <Inp label="Support Link" value={data.supportLink} onChange={v => setData({ ...data, supportLink: v })} placeholder="https://yourbrand.com/support" />
      </SectionCard>

      <SectionCard title="Follow Us (optional)">
        <Inp label="Twitter / X" value={data.socialTwitter} onChange={v => setData({ ...data, socialTwitter: v })} placeholder="https://x.com/yourbrand" prefix="X" />
        <Inp label="Instagram" value={data.socialInstagram} onChange={v => setData({ ...data, socialInstagram: v })} placeholder="https://instagram.com/yourbrand" prefix="IG" />
        <Inp label="Facebook" value={data.socialFacebook} onChange={v => setData({ ...data, socialFacebook: v })} placeholder="https://facebook.com/yourbrand" prefix="FB" />
        <Inp label="LinkedIn" value={data.socialLinkedin} onChange={v => setData({ ...data, socialLinkedin: v })} placeholder="https://linkedin.com/company/yourbrand" prefix="IN" />
      </SectionCard>

      <SectionCard title="Limits & Expiry">
        <Inp label="Page Expires On" value={data.expiryDate} onChange={v => setData({ ...data, expiryDate: v })} type="date" hint="Leave blank for no expiry" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Inp label="Max Number of Payments" value={data.maxPayments} onChange={v => setData({ ...data, maxPayments: v })} placeholder="Unlimited" type="number" />
          <Inp label="Max Total Revenue" value={data.maxRevenue} onChange={v => setData({ ...data, maxRevenue: v })} placeholder="Unlimited" prefix={getSymbol(data.currency)} type="number" />
        </div>
      </SectionCard>

      <SectionCard title="After Payment">
        <Toggle checked={data.sendReceipt} onChange={v => setData({ ...data, sendReceipt: v })} label="Send payment receipt by email" desc="A branded receipt is auto-emailed to the customer after a successful payment" />
        <Textarea label="Custom Success Message" value={data.successMessage} onChange={v => setData({ ...data, successMessage: v })} placeholder="Thank you for your payment! We'll be in touch shortly." rows={2} />
        <Inp label="Redirect URL (optional)" value={data.redirectUrl} onChange={v => setData({ ...data, redirectUrl: v })} placeholder="https://yourbrand.com/thank-you" hint="Customer is redirected here after payment instead of seeing the success message" />
      </SectionCard>

      <SectionCard title="Webhooks (advanced)">
        <Inp label="Webhook URL" value={data.webhookUrl} onChange={v => setData({ ...data, webhookUrl: v })} placeholder="https://api.yourbrand.com/webhooks/enkash" hint="Receive payment events on your server" />
      </SectionCard>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
export function getSymbol(currency: WizardData["currency"]) {
  return ({ INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ" } as const)[currency];
}

export function getStepsForType(type: PageType): { key: string; label: string }[] {
  const labelStep1 = type === "donation" ? "Cause Details" : type === "event" ? "Event Details" : type === "invoice" ? "Invoice Details" : "Page Details";
  const labelStep2 = type === "donation" ? "Donor Fields" : type === "event" ? "Attendee Fields" : type === "invoice" ? "Customer Fields" : "Customer Fields";
  return [
    { key: "details", label: labelStep1 },
    { key: "fields", label: labelStep2 },
    { key: "customization", label: "Customization" },
    { key: "settings", label: "Settings & Publish" },
  ];
}
