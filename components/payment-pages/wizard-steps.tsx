"use client";
import { useRef, useState } from "react";
import { C, radius, shadow } from "./tokens";
import { Inp, Textarea, Sel, Toggle, ColorPicker, SegmentedControl, InfoBanner, SectionCard, Label, Btn } from "./primitives";
import { Icon } from "./icons";
import { brandClashes, suggestedShade } from "./color-utils";

// Unified item shape — covers both "Multiple Items" and "Tickets" cases.
// When itemsAreTickets is true: capacity is shown, min/max qty are hidden.
// When itemsAreTickets is false: min/max qty are shown, capacity is hidden.
export interface MultiItem {
  label: string;
  amount: string;
  description?: string;
  image?: string;
  minQty?: string;
  maxQty?: string;
  capacity?: string;
  optional?: boolean;
}

// Backward-compat alias for any caller still referencing Ticket
export type Ticket = MultiItem;

export interface WizardData {
  // Common
  merchantName: string;
  title: string;
  description: string;
  longDescription: string;
  pageSlug: string;
  coverImage: string;
  coverPosition: number;
  coverZoom: number;
  productImage: string;
  currency: "INR";

  // Recurring billing
  isRecurring: boolean;
  recurringFrequency: "monthly" | "quarterly" | "yearly";
  durationType: "until_cancelled" | "until_date";
  endDate: string;

  // Pricing
  amountType: "fixed" | "customer" | "multiple";
  fixedAmount: string;
  minAmount: string;
  maxAmount: string;
  suggestedAmounts: string[];   // shown whenever amountType === "customer"
  items: MultiItem[];           // unified — covers products AND tickets

  // Donation flag + compliance (only when amountType === "customer")
  isDonation: boolean;
  is80G: boolean;
  collectPan: boolean;

  // Tickets flag + event-level details (only when amountType === "multiple")
  itemsAreTickets: boolean;
  eventDate: string;
  eventTime: string;
  eventVenue: string;

  // Customer fields
  customerFields: { type: string; label: string; optional: boolean }[];

  // Branding / Customization
  brandColor: string;
  buttonLabel: string;
  theme: "light" | "dark" | "system";
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

  // Payment methods offered on the page (merchant-configurable; company-level
  // gating over which merchants may enable which methods is a separate backend concern)
  paymentMethods: PaymentMethod[];
  // Which specific netbanking banks / wallet partners the merchant exposes to customers.
  netbankingBanks: string[];
  wallets: string[];

  // Settings - Publish
  expiryDate: string;
  maxPayments: string;
  successMessage: string;

  // Internal UI state — true once the merchant manually edits the slug, after
  // which we stop auto-syncing it from the title.
  slugTouched?: boolean;
}

export type PaymentMethod = "upi" | "cards" | "netbanking" | "wallets";

export const ALL_PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "upi", label: "UPI" },
  { key: "cards", label: "Cards" },
  { key: "netbanking", label: "Net Banking" },
  { key: "wallets", label: "Wallets" },
];

// Master catalogues the merchant picks from. Customers only ever see the subset
// the merchant has enabled (stored in data.netbankingBanks / data.wallets).
export const NETBANKING_BANKS = [
  "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Yes Bank", "IndusInd Bank", "IDFC First Bank",
  "Canara Bank", "Union Bank of India",
];

export const WALLET_PARTNERS = [
  "Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge", "Airtel Money", "JioMoney", "Ola Money",
];

export const DEFAULT_WIZARD: WizardData = {
  merchantName: "EnKash Demo",
  title: "",
  description: "",
  longDescription: "",
  pageSlug: "",
  coverImage: "",
  coverPosition: 50,
  coverZoom: 100,
  productImage: "",
  currency: "INR",

  isRecurring: false,
  recurringFrequency: "monthly",
  durationType: "until_cancelled",
  endDate: "",

  amountType: "fixed",
  fixedAmount: "",
  minAmount: "",
  maxAmount: "",
  suggestedAmounts: ["100", "500", "1000", "2500"],
  items: [],

  isDonation: false,
  is80G: false,
  collectPan: false,

  itemsAreTickets: false,
  eventDate: "",
  eventTime: "",
  eventVenue: "",

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

  paymentMethods: ["upi", "cards", "netbanking", "wallets"],
  netbankingBanks: ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"],
  wallets: ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik"],

  expiryDate: "",
  maxPayments: "",
  successMessage: "",
};

const FIELD_TYPES = [
  { value: "name", label: "Full Name" }, { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" }, { value: "company", label: "Company Name" },
  { value: "gstin", label: "GSTIN" }, { value: "address", label: "Address" },
  { value: "pan", label: "PAN Number" }, { value: "text", label: "Single Line Text" },
  { value: "textarea", label: "Multi-line Text" }, { value: "date", label: "Date" },
  { value: "number", label: "Number" }, { value: "dropdown", label: "Dropdown" },
];

// Add or remove a required PAN field in response to the donation/80G/PAN toggles.
// Deduped: never adds a second PAN field if one already exists; only strips the
// auto-added one (default "PAN Number" label) when PAN collection is turned off.
type CFields = WizardData["customerFields"];
function syncPanField(fields: CFields, wantPan: boolean): CFields {
  const hasPan = fields.some(f => f.type === "pan");
  if (wantPan && !hasPan) {
    return [...fields, { type: "pan", label: "PAN Number", optional: false }];
  }
  if (!wantPan && hasPan) {
    return fields.filter(f => !(f.type === "pan" && f.label === "PAN Number"));
  }
  return fields;
}

// Chip multi-select for choosing which bank / wallet providers appear to customers.
// Keeps at least one selected, and preserves the master-list order in the output.
function PartnerPicker({ title, options, selected, onChange }: {
  title: string; options: string[]; selected: string[]; onChange: (list: string[]) => void;
}) {
  const toggle = (opt: string) => {
    const on = selected.includes(opt);
    if (on && selected.length === 1) return; // keep at least one provider
    const next = on ? selected.filter(x => x !== opt) : [...selected, opt];
    onChange(options.filter(o => next.includes(o)));
  };
  return (
    <div style={{ margin: "0 0 16px", paddingLeft: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>
        {title} <span style={{ color: C.textMuted, fontWeight: 600 }}>({selected.length} of {options.length})</span>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => {
          const on = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px",
              borderRadius: 999, border: `1.5px solid ${on ? C.blue : C.border}`,
              background: on ? C.blueLight : C.white, color: on ? C.blueDark : C.textMuted,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${on ? C.blue : C.border}`, background: on ? C.blue : "transparent",
                color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800,
              }}>{on ? "✓" : ""}</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function CropModal({
  src, ratio, onCancel, onSave,
}: {
  src: string; ratio: "16:9" | "1:1" | "4:1"; onCancel: () => void; onSave: (croppedDataUrl: string) => void;
}) {
  const ar = ratio === "4:1" ? 4 : ratio === "1:1" ? 1 : 16 / 9;
  // The whole modal stage. The keep-frame sits centered inside it.
  const STAGE_W = 460;
  const STAGE_H = 300;
  // Keep-frame: the area that will actually be used, centered in the stage.
  let FRAME_W = STAGE_W - 60;
  let FRAME_H = FRAME_W / ar;
  if (FRAME_H > STAGE_H - 60) { FRAME_H = STAGE_H - 60; FRAME_W = FRAME_H * ar; }
  const frameLeft = (STAGE_W - FRAME_W) / 2;
  const frameTop = (STAGE_H - FRAME_H) / 2;

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image top-left relative to STAGE top-left
  const drag = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const ready = natural.w > 0 && natural.h > 0;

  // Base scale: image must at least cover the keep-FRAME (so the frame is never empty),
  // but we display the whole image, so it can extend beyond the frame into the dimmed area.
  const baseScale = ready ? Math.max(FRAME_W / natural.w, FRAME_H / natural.h) : 1;
  const scale = baseScale * zoom;
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  // Clamp so the keep-frame is always fully covered by the image.
  const clamp = (x: number, y: number) => ({
    x: Math.min(frameLeft, Math.max(frameLeft + FRAME_W - dispW, x)),
    y: Math.min(frameTop, Math.max(frameTop + FRAME_H - dispH, y)),
  });
  const centerPos = (s: number) => ({
    x: (STAGE_W - natural.w * s) / 2,
    y: (STAGE_H - natural.h * s) / 2,
  });

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget; imgRef.current = img;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    setNatural({ w: nw, h: nh });
    const s = Math.max(FRAME_W / nw, FRAME_H / nh);
    setPos({ x: (STAGE_W - nw * s) / 2, y: (STAGE_H - nh * s) / 2 });
  };

  const onDown = (e: React.PointerEvent) => {
    drag.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos(clamp(drag.current.px + (e.clientX - drag.current.mx), drag.current.py + (e.clientY - drag.current.my)));
  };
  const onUp = () => { drag.current = null; };

  const onZoom = (z: number) => {
    const oldS = baseScale * zoom, newS = baseScale * z;
    const cx = STAGE_W / 2, cy = STAGE_H / 2;
    const ix = (cx - pos.x) / oldS, iy = (cy - pos.y) / oldS;
    const ndW = natural.w * newS, ndH = natural.h * newS;
    setZoom(z);
    setPos({
      x: Math.min(frameLeft, Math.max(frameLeft + FRAME_W - ndW, cx - ix * newS)),
      y: Math.min(frameTop, Math.max(frameTop + FRAME_H - ndH, cy - iy * newS)),
    });
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img || !ready) { onSave(src); return; }
    const outScale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(FRAME_W * outScale);
    canvas.height = Math.round(FRAME_H * outScale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { onSave(src); return; }
    // keep-frame top-left in image coords
    const sx = (frameLeft - pos.x) / scale;
    const sy = (frameTop - pos.y) / scale;
    const sw = FRAME_W / scale, sh = FRAME_H / scale;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    onSave(canvas.toDataURL("image/jpeg", 0.92));
  };

  const isCircle = false; // banner/logo use rectangles; ratio 1:1 still rectangular here

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.white, borderRadius: radius.lg, width: "min(540px, 100%)", overflow: "hidden", boxShadow: shadow.lg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Edit photo</p>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted, fontFamily: "inherit", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18 }}>
          <div
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            style={{
              position: "relative", width: STAGE_W, height: STAGE_H, margin: "0 auto",
              overflow: "hidden", borderRadius: radius.md, background: "#e2e8f0",
              cursor: "grab", touchAction: "none", userSelect: "none",
            }}
          >
            {!ready && <img src={src} alt="" onLoad={onImgLoad} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />}
            {ready && (
              <>
                {/* Whole image, fully visible */}
                <img
                  ref={imgRef} src={src} alt="crop" draggable={false}
                  style={{ position: "absolute", left: pos.x, top: pos.y, width: dispW, height: dispH, maxWidth: "none", pointerEvents: "none" }}
                />
                {/* Dim overlay everywhere EXCEPT the keep-frame (4 strips around the frame) */}
                <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: frameTop, background: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: 0, top: frameTop + FRAME_H, width: "100%", bottom: 0, background: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: 0, top: frameTop, width: frameLeft, height: FRAME_H, background: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: frameLeft + FRAME_W, top: frameTop, right: 0, height: FRAME_H, background: "rgba(255,255,255,0.62)", pointerEvents: "none" }} />
                {/* Bright keep-frame outline */}
                <div style={{ position: "absolute", left: frameLeft, top: frameTop, width: FRAME_W, height: FRAME_H, border: `2px solid #ffffff`, boxShadow: "0 0 0 1px rgba(0,0,0,0.25)", borderRadius: isCircle ? "50%" : radius.sm, pointerEvents: "none" }} />
              </>
            )}
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: radius.sm, pointerEvents: "none" }}>⤢ drag · only the framed area is used</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 16, color: C.textMuted }}>−</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => onZoom(parseFloat(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 16, color: C.textMuted }}>+</span>
            <span style={{ fontSize: 12, color: C.textMuted, minWidth: 40, textAlign: "right" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => { setZoom(1); setPos(centerPos(baseScale)); }} style={{ fontSize: 12, padding: "6px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.sm, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Reset</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
          <Btn variant="secondary" size="sm" onClick={onCancel}>Cancel</Btn>
          <Btn size="sm" onClick={handleSave}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Image Upload (opens crop modal, stores the cropped result — WYSIWYG) ────────
function ImageUpload({
  label, value, onChange, hint, ratio = "16:9", noCrop = false,
}: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; ratio?: "16:9" | "1:1" | "4:1";
  noCrop?: boolean;
  // legacy props accepted but unused (crop is baked into the image now)
  position?: number; onPositionChange?: (p: number) => void;
  zoom?: number; onZoomChange?: (z: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const aspect = ratio === "16:9" ? "16 / 9" : ratio === "4:1" ? "4 / 1" : "1 / 1";
  const [error, setError] = useState<string>("");
  const [lowRes, setLowRes] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const MAX_BYTES = 2 * 1024 * 1024;
  const MIN_WIDTH = ratio === "4:1" ? 1200 : ratio === "1:1" ? 256 : 800;

  const handleFile = (file: File) => {
    setError(""); setLowRes(false);
    if (!/^image\/(png|jpe?g)$/.test(file.type)) { setError("Please upload a PNG or JPG image."); return; }
    if (file.size > MAX_BYTES) { setError("Image is larger than 2MB. Please upload a smaller file."); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const src = (e.target?.result as string) ?? "";
      const img = new Image();
      img.onload = () => { if (img.naturalWidth < MIN_WIDTH) setLowRes(true); };
      img.src = src;
      if (noCrop) { onChange(src); }    // gallery: use the whole image as-is
      else { setCropSrc(src); }          // banner/logo: open crop modal
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 18 }}>
      {label && <Label>{label}</Label>}
      <div
        onClick={() => { if (!value) inputRef.current?.click(); }}
        style={{
          width: "100%", aspectRatio: aspect, border: `1.5px dashed ${value ? C.blueMid : C.border}`,
          borderRadius: radius.md, background: value ? "transparent" : C.bg, cursor: value ? "default" : "pointer",
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
          <>
            {!noCrop && (
              <button
                onClick={e => { e.stopPropagation(); setCropSrc(value); }}
                style={{ position: "absolute", top: 8, right: 80, background: "rgba(0,0,0,0.6)", color: C.white, border: "none", borderRadius: radius.sm, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
              >
                Reposition
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onChange(""); setError(""); setLowRes(false); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: C.white, border: "none", borderRadius: radius.sm, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
            >
              Remove
            </button>
          </>
        )}
      </div>

      {error && <p style={{ fontSize: 11, color: C.red, margin: "6px 0 0" }}>{error}</p>}
      {lowRes && !error && (
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 6, padding: "8px 10px", background: C.amberBg, borderRadius: radius.sm }}>
          <span style={{ fontSize: 12 }}>⚠</span>
          <p style={{ fontSize: 11, color: C.amber, margin: 0, lineHeight: 1.5 }}>This image is smaller than recommended and may look blurry. Use a larger image for best results.</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
      {hint && <p style={{ fontSize: 12, color: C.textFaint, margin: "6px 0 0", lineHeight: 1.5 }}>{hint}</p>}

      {cropSrc && (
        <CropModal
          src={cropSrc}
          ratio={ratio}
          onCancel={() => setCropSrc(null)}
          onSave={(cropped) => { onChange(cropped); setCropSrc(null); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared: Page Info Section (gallery, contact, terms) — used in both Step 1s
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
          {/* Full description — features, about the company, anything the merchant wants */}
          <div style={{ marginBottom: 14 }}>
            <Textarea
              label="Full Description"
              value={data.longDescription}
              onChange={v => setData({ ...data, longDescription: v })}
              placeholder={"Tell customers about your product, features, your company — anything you want them to know.\n\n• Feature one\n• Feature two\n• Why choose us"}
              rows={6}
              hint="Shown in the left column of your page. Supports line breaks and lists."
            />
          </div>

          {/* Contact */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Contact (shown on page)</p>
            <Inp label="Email" value={data.contactEmail} onChange={v => setData({ ...data, contactEmail: v })} placeholder="support@brand.com" type="email" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Phone" value={data.contactPhone} onChange={v => setData({ ...data, contactPhone: v })} placeholder="+91 98765 43210" />
              <Inp label="WhatsApp" value={data.contactWhatsapp} onChange={v => setData({ ...data, contactWhatsapp: v })} placeholder="+91 98765 43210" />
            </div>
            <Inp label="Website URL" value={data.contactWebsite} onChange={v => setData({ ...data, contactWebsite: v })} placeholder="https://yourbrand.com" />
            <Inp label="Support Link" value={data.supportLink} onChange={v => setData({ ...data, supportLink: v })} placeholder="https://yourbrand.com/support" />
          </div>

          {/* Follow Us (social) */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Follow Us <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></p>
            <Inp label="Twitter / X" value={data.socialTwitter} onChange={v => setData({ ...data, socialTwitter: v })} placeholder="https://x.com/yourbrand" prefix="X" />
            <Inp label="Instagram" value={data.socialInstagram} onChange={v => setData({ ...data, socialInstagram: v })} placeholder="https://instagram.com/yourbrand" prefix="IG" />
            <Inp label="Facebook" value={data.socialFacebook} onChange={v => setData({ ...data, socialFacebook: v })} placeholder="https://facebook.com/yourbrand" prefix="FB" />
            <Inp label="LinkedIn" value={data.socialLinkedin} onChange={v => setData({ ...data, socialLinkedin: v })} placeholder="https://linkedin.com/company/yourbrand" prefix="IN" />
          </div>

          {/* Gallery */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Image Gallery <span style={{ fontWeight: 400, textTransform: "none" }}>(up to 4)</span></p>
            {data.galleryImages.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
                {data.galleryImages.map((img, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: radius.sm, background: `${C.bg} url(${img}) center/contain no-repeat`, border: `1px solid ${C.border}` }}>
                    <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10, lineHeight: "18px", textAlign: "center", padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {data.galleryImages.length < 4 && (
              <ImageUpload label="" value="" onChange={addImage} hint="Whole image is shown — no cropping." ratio="1:1" noCrop />
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
// Items Editor — improved. Handles both products (Multiple Items) and tickets.
// ──────────────────────────────────────────────────────────────────────────────
function ItemsEditor({
  data, setData, isTickets = false,
}: {
  data: WizardData; setData: (d: WizardData) => void; isTickets?: boolean;
}) {
  const updateItem = (i: number, patch: Partial<MultiItem>) => {
    const arr = [...data.items]; arr[i] = { ...arr[i], ...patch };
    setData({ ...data, items: arr });
  };
  const addItem = () =>
    setData({
      ...data,
      items: [
        ...data.items,
        isTickets
          ? { label: "", amount: "", capacity: "", description: "", image: "" }
          : { label: "", amount: "", description: "", image: "", minQty: "", maxQty: "", optional: false },
      ],
    });
  const removeItem = (i: number) => setData({ ...data, items: data.items.filter((_, idx) => idx !== i) });

  // Empty state
  if (data.items.length === 0) {
    return (
      <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: radius.md, padding: 20, textAlign: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 10px" }}>{isTickets ? "No ticket tiers added yet" : "No items added yet"}</p>
        <Btn variant="secondary" size="sm" onClick={addItem}>+ Add {isTickets ? "ticket tier" : "your first item"}</Btn>
      </div>
    );
  }

  return (
    <div>
      {data.items.map((it, i) => (
        <ItemRow
          key={i}
          item={it}
          index={i}
          isTickets={isTickets}
          onUpdate={patch => updateItem(i, patch)}
          onRemove={() => removeItem(i)}
          currency={data.currency}
        />
      ))}
      <Btn variant="secondary" size="sm" onClick={addItem}>+ Add another {isTickets ? "ticket tier" : "item"}</Btn>
    </div>
  );
}

function ItemRow({
  item, index, isTickets, onUpdate, onRemove, currency,
}: {
  item: MultiItem; index: number; isTickets: boolean;
  onUpdate: (patch: Partial<MultiItem>) => void; onRemove: () => void;
  currency: "INR";
}) {
  const [showImage, setShowImage] = useState(!!item.image);

  return (
    <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          {isTickets ? `Ticket Tier ${index + 1}` : `Item ${index + 1}`}
        </p>
        <button onClick={onRemove} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>Remove</button>
      </div>

      <Inp
        label={isTickets ? "Tier Name" : "Item Name"}
        value={item.label}
        onChange={v => onUpdate({ label: v })}
        placeholder={isTickets ? "e.g. Early Bird, VIP, General" : "e.g. T-shirt — Medium"}
      />

      <div style={{ display: "grid", gridTemplateColumns: isTickets ? "1fr 1fr" : "1fr", gap: 10 }}>
        <Inp
          label="Price"
          value={item.amount}
          onChange={v => onUpdate({ amount: v })}
          placeholder="0"
          prefix={getSymbol(currency)}
          type="number"
        />
        {isTickets && (
          <Inp
            label="Capacity"
            value={item.capacity ?? ""}
            onChange={v => onUpdate({ capacity: v })}
            placeholder="100"
            type="number"
            hint="Max tickets available for this tier — buyers can't select more than this"
          />
        )}
      </div>

      {/* Image — optional thumbnail, replaces the old description field */}
      {!showImage && (
        <button
          onClick={() => setShowImage(true)}
          style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", fontFamily: "inherit", marginBottom: 8 }}
        >
          + Add image
        </button>
      )}
      {showImage && (
        <ImageUpload
          label="Image"
          value={item.image ?? ""}
          onChange={v => onUpdate({ image: v })}
          ratio="1:1"
          hint="Square thumbnail shown beside the item"
        />
      )}

      {!isTickets && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Inp
              label="Min Quantity"
              value={item.minQty ?? ""}
              onChange={v => onUpdate({ minQty: v })}
              placeholder="0"
              type="number"
            />
            <Inp
              label="Max Quantity"
              value={item.maxQty ?? ""}
              onChange={v => onUpdate({ maxQty: v })}
              placeholder="Unlimited"
              type="number"
            />
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1 — Payment Page (unified flow)
// Progressive disclosure driven by pricing choice.
// ──────────────────────────────────────────────────────────────────────────────
export function StepPageDetails({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const slugAuto = data.pageSlug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  // Suggested amounts editing helpers (shown for Customer Decides)
  const updateSuggested = (i: number, v: string) => {
    const arr = [...data.suggestedAmounts];
    arr[i] = v;
    setData({ ...data, suggestedAmounts: arr });
  };
  const removeSuggested = (i: number) => setData({ ...data, suggestedAmounts: data.suggestedAmounts.filter((_, idx) => idx !== i) });
  const addSuggested = () => setData({ ...data, suggestedAmounts: [...data.suggestedAmounts, ""] });

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Page Details</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>
        What are you charging for? The page will adapt based on what you pick below.
      </p>

      <SectionCard title="Basics">
        <Inp label="Page Title" value={data.title} onChange={v => setData({
          ...data,
          title: v,
          // Keep the URL slug in sync with the title until the merchant edits it directly.
          pageSlug: data.slugTouched ? data.pageSlug : v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40),
        })} placeholder="e.g. Bluetooth Headphones" required />
        <Textarea label="Short Description" value={data.description} onChange={v => setData({ ...data, description: v })} placeholder="A one-line summary shown under your page title." rows={2} hint="Keep it short — a sentence or two. Add a full description with features in Page Info below." />
      </SectionCard>

      <SectionCard title="Pricing">
        <div style={{ marginBottom: 14 }}>
          <Label>How are you charging?</Label>
          <SegmentedControl
            options={[
              { key: "fixed", label: "Fixed Amount" },
              { key: "customer", label: "Customer-set Amount" },
              { key: "multiple", label: "Multiple Items" },
            ]}
            value={data.amountType}
            onChange={v => {
              const next = v as "fixed" | "customer" | "multiple";
              setData({
                ...data,
                amountType: next,
                // Donation flags only apply to "customer" — clear when leaving.
                isDonation: next === "customer" ? data.isDonation : false,
                is80G: next === "customer" ? data.is80G : false,
                collectPan: next === "customer" ? data.collectPan : false,
                // Ticket flags only apply to "multiple" — clear when leaving.
                itemsAreTickets: next === "multiple" ? data.itemsAreTickets : false,
                eventDate: next === "multiple" ? data.eventDate : "",
                eventTime: next === "multiple" ? data.eventTime : "",
                eventVenue: next === "multiple" ? data.eventVenue : "",
              });
            }}
          />
        </div>

        {/* ── PAYMENT TYPE (one-time vs recurring) ─────────────────────────── */}
        {/* [VERIFY] Monthly / Quarterly / Yearly are the initial supported
            frequencies. Other options (weekly, bi-annual, custom cadence)
            are TBD with Pallav. */}
        <div style={{ marginBottom: 14 }}>
          <Label>Payment type</Label>
          <SegmentedControl
            options={[
              { key: "one-time", label: "One-time" },
              { key: "recurring", label: "Recurring" },
            ]}
            value={data.isRecurring ? "recurring" : "one-time"}
            onChange={v => setData({ ...data, isRecurring: v === "recurring" })}
          />
        </div>

        {data.isRecurring && (
          <div style={{ marginBottom: 14 }}>
            <Label>Billing frequency</Label>
            <SegmentedControl
              options={[
                { key: "monthly",   label: "Monthly" },
                { key: "quarterly", label: "Quarterly" },
                { key: "yearly",    label: "Yearly" },
              ]}
              value={data.recurringFrequency}
              onChange={v => setData({ ...data, recurringFrequency: v as "monthly" | "quarterly" | "yearly" })}
            />
          </div>
        )}

        {data.isRecurring && (
          <div style={{ marginBottom: 14 }}>
            <Label>Runs for</Label>
            <SegmentedControl
              options={[
                { key: "until_cancelled", label: "Until cancelled" },
                { key: "until_date",      label: "Until a set date" },
              ]}
              value={data.durationType}
              onChange={v => setData({ ...data, durationType: v as "until_cancelled" | "until_date", endDate: "" })}
            />
          </div>
        )}

        {data.isRecurring && data.durationType === "until_date" && (
          <Inp
            label="End date"
            value={data.endDate}
            onChange={v => setData({ ...data, endDate: v })}
            type="date"
            hint="Subscription stops renewing on or after this date"
          />
        )}

        {/* ── FIXED ─────────────────────────────────────────────────────────── */}
        {data.amountType === "fixed" && (
          <Inp
            label="Amount"
            value={data.fixedAmount}
            onChange={v => setData({ ...data, fixedAmount: v })}
            placeholder="0.00"
            prefix={getSymbol(data.currency)}
            type="number"
            required
          />
        )}

        {/* ── CUSTOMER DECIDES ──────────────────────────────────────────────── */}
        {data.amountType === "customer" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Minimum" value={data.minAmount} onChange={v => setData({ ...data, minAmount: v })} placeholder="100" prefix={getSymbol(data.currency)} type="number" />
              <Inp label="Maximum" value={data.maxAmount} onChange={v => setData({ ...data, maxAmount: v })} placeholder="100000" prefix={getSymbol(data.currency)} type="number" />
            </div>
            {data.minAmount && data.maxAmount && parseFloat(data.maxAmount) < parseFloat(data.minAmount) && (
              <p style={{ fontSize: 11, color: C.red, margin: "-6px 0 6px" }}>Maximum must be greater than or equal to the minimum.</p>
            )}

            {/* Suggested amounts — always shown for Customer Decides */}
            <div style={{ marginTop: 6 }}>
              <Label>Suggested Amounts <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span></Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 8 }}>
                {data.suggestedAmounts.map((amt, i) => {
                  const n = parseFloat(amt);
                  const minN = parseFloat(data.minAmount);
                  const maxN = parseFloat(data.maxAmount);
                  const belowMin = amt !== "" && !isNaN(n) && !isNaN(minN) && n < minN;
                  const aboveMax = amt !== "" && !isNaN(n) && !isNaN(maxN) && n > maxN;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Inp value={amt} onChange={v => updateSuggested(i, v)} placeholder="0" prefix={getSymbol(data.currency)} type="number" />
                        <button onClick={() => removeSuggested(i)} style={{ background: C.redBg, color: C.red, border: "none", borderRadius: radius.sm, width: 32, height: 38, cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 18, flexShrink: 0, fontFamily: "inherit" }}>×</button>
                      </div>
                      {(belowMin || aboveMax) && (
                        <p style={{ fontSize: 11, color: C.red, margin: "-14px 0 0" }}>
                          {belowMin ? "Below minimum" : "Above maximum"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <Btn variant="secondary" size="sm" onClick={addSuggested}>+ Add suggested amount</Btn>
              <p style={{ fontSize: 11, color: C.textFaint, margin: "8px 0 0", lineHeight: 1.5 }}>
                Shown as quick-pick chips on the page. Customers can still type any amount within your min/max.
              </p>
            </div>

            {/* Donation toggle — refinement of "Customer Decides" */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
              <Toggle
                checked={data.isDonation}
                onChange={v => setData({ ...data, isDonation: v, is80G: v ? data.is80G : false, collectPan: v ? data.collectPan : false, customerFields: syncPanField(data.customerFields, v ? data.collectPan : false) })}
                label="Donation page (enables 80G)"
                desc="Marks this as a donation, unlocking India-specific compliance options below"
              />

              {data.isDonation && (
                <div style={{ marginTop: 6, paddingLeft: 4 }}>
                  <Toggle
                    checked={data.is80G}
                    onChange={v => setData({ ...data, is80G: v, collectPan: v ? true : data.collectPan, customerFields: syncPanField(data.customerFields, v ? true : data.collectPan) })}
                    label="Generate 80G tax receipts"
                    desc="Donors get automatic 80G receipts and can claim tax benefits"
                  />
                  <Toggle
                    checked={data.collectPan}
                    onChange={v => setData({ ...data, collectPan: v, customerFields: syncPanField(data.customerFields, v) })}
                    label="Collect PAN from donors"
                    desc="Required for 80G receipts and donations above ₹50,000"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── MULTIPLE ITEMS ────────────────────────────────────────────────── */}
        {data.amountType === "multiple" && (
          <>
            <ItemsEditor data={data} setData={setData} isTickets={data.itemsAreTickets} />

            {/* Tickets toggle — refinement of "Multiple Items" */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px dashed ${C.border}` }}>
              <Toggle
                checked={data.itemsAreTickets}
                onChange={v => setData({ ...data, itemsAreTickets: v })}
                label="Items are tickets"
                desc="Adds event date, time, venue and per-tier capacity"
              />

              {data.itemsAreTickets && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Inp label="Event Date" value={data.eventDate} onChange={v => setData({ ...data, eventDate: v })} type="date" required />
                    <Inp label="Event Time" value={data.eventTime} onChange={v => setData({ ...data, eventTime: v })} type="time" />
                  </div>
                  {data.eventDate && data.eventDate < new Date().toISOString().slice(0, 10) && (
                    <p style={{ fontSize: 11, color: C.red, margin: "-12px 0 12px" }}>Event date can't be in the past.</p>
                  )}
                  <Inp label="Venue" value={data.eventVenue} onChange={v => setData({ ...data, eventVenue: v })} placeholder="e.g. JW Marriott, Bengaluru / Online" />
                </div>
              )}
            </div>
          </>
        )}
      </SectionCard>

      <PageInfoSection data={data} setData={setData} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2: Customer Fields
// ──────────────────────────────────────────────────────────────────────────────
export function StepCustomerFields({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const updateField = (i: number, patch: Partial<typeof data.customerFields[0]>) => {
    const arr = [...data.customerFields];
    const merged = { ...arr[i], ...patch };
    if (merged.type === "email") merged.optional = false; // email is always required
    arr[i] = merged;
    setData({ ...data, customerFields: arr });
  };
  const addField = () => setData({ ...data, customerFields: [...data.customerFields, { type: "text", label: "Custom Field", optional: true }] });
  const removeField = (i: number) => {
    // Email is non-removable (required for receipts); never allow zero fields.
    if (data.customerFields[i]?.type === "email") return;
    if (data.customerFields.length <= 1) return;
    setData({ ...data, customerFields: data.customerFields.filter((_, idx) => idx !== i) });
  };
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= data.customerFields.length) return;
    const arr = [...data.customerFields];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setData({ ...data, customerFields: arr });
  };

  // Inline validation: flag empty and duplicate labels
  const labelCounts = data.customerFields.reduce<Record<string, number>>((acc, f) => {
    const key = f.label.trim().toLowerCase();
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  // Determine the role label based on context
  const role = data.isDonation ? "donor" : data.itemsAreTickets ? "attendee" : "customer";
  const heading = data.isDonation ? "Donor Details" : data.itemsAreTickets ? "Attendee Details" : "Customer Details";

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{heading}</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Choose what information to collect from each {role}.</p>

      <InfoBanner type="info">
        Required fields are validated before payment. Optional fields can be skipped by the {role}.
      </InfoBanner>

      {data.customerFields.map((f, i) => {
        const isEmail = f.type === "email";
        const labelKey = f.label.trim().toLowerCase();
        const isEmpty = !f.label.trim();
        const isDuplicate = !!labelKey && labelCounts[labelKey] > 1;
        return (
          <div key={i} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.md, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
                Field {i + 1}{isEmail && <span style={{ fontSize: 11, fontWeight: 500, color: C.textFaint, marginLeft: 6 }}>· required</span>}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => moveField(i, -1)} disabled={i === 0} style={{ background: "transparent", color: i === 0 ? C.textFaint : C.textSecondary, border: `1px solid ${C.border}`, borderRadius: radius.sm, width: 24, height: 24, cursor: i === 0 ? "default" : "pointer", fontSize: 12, fontFamily: "inherit", lineHeight: 1, opacity: i === 0 ? 0.4 : 1 }} title="Move up">↑</button>
                <button onClick={() => moveField(i, 1)} disabled={i === data.customerFields.length - 1} style={{ background: "transparent", color: i === data.customerFields.length - 1 ? C.textFaint : C.textSecondary, border: `1px solid ${C.border}`, borderRadius: radius.sm, width: 24, height: 24, cursor: i === data.customerFields.length - 1 ? "default" : "pointer", fontSize: 12, fontFamily: "inherit", lineHeight: 1, opacity: i === data.customerFields.length - 1 ? 0.4 : 1 }} title="Move down">↓</button>
                {!isEmail && (
                  <button onClick={() => removeField(i)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>Remove</button>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Sel label="Type" value={f.type} onChange={v => {
                const opt = FIELD_TYPES.find(x => x.value === v);
                const prev = FIELD_TYPES.find(x => x.value === f.type);
                // Only auto-fill the label if the user hasn't customized it.
                const labelWasDefault = !f.label.trim() || f.label === prev?.label;
                updateField(i, { type: v, label: labelWasDefault ? (opt?.label ?? f.label) : f.label });
              }} options={FIELD_TYPES} />
              <Inp label="Label" value={f.label} onChange={v => updateField(i, { label: v })} />
            </div>
            {(isEmpty || isDuplicate) && (
              <p style={{ fontSize: 11, color: C.red, margin: "4px 0 0" }}>
                {isEmpty ? "Label can't be empty" : "Another field already uses this label"}
              </p>
            )}
            {isEmail ? (
              <p style={{ fontSize: 12, color: C.textMuted, margin: "10px 0 0" }}>Always required — receipts and payment confirmation are sent here.</p>
            ) : (
              <Toggle checked={f.optional} onChange={v => updateField(i, { optional: v })} label="Optional field" desc={`The ${role} can skip this field`} />
            )}
          </div>
        );
      })}

      <Btn variant="secondary" size="sm" onClick={addField}>+ Add another field</Btn>

      {data.isDonation && data.is80G && (
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

  // Contrast hint — fires only when the brand colour is genuinely too close to
  // the selected theme to read. Dismissal is keyed to colour+theme, so changing
  // either brings the hint back if the new pairing also clashes.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const clashKey = `${data.brandColor}|${data.theme}`;
  const showColorHint = brandClashes(data.brandColor, data.theme) && dismissed !== clashKey;
  const themeWord = data.theme === "light" ? "light" : "dark";

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
        {showColorHint && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, padding: "11px 13px", background: "#fef6e7", border: "1px solid #f3d699", borderRadius: radius.md }}>
            <span style={{ color: "#b45309", flexShrink: 0, marginTop: 1 }}><Icon name="help" size={17} /></span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12.5, color: "#92591a", lineHeight: 1.5, margin: "0 0 10px" }}>
                This shade is very close to the {themeWord} theme you've selected, so your price and buttons may be hard for customers to see.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={() => setData({ ...data, brandColor: suggestedShade(data.brandColor, data.theme) })}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#b45309", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ width: 13, height: 13, borderRadius: 3, background: suggestedShade(data.brandColor, data.theme), display: "inline-block" }} />
                  Use a brighter shade
                </button>
                <button
                  onClick={() => setDismissed(clashKey)}
                  style={{ background: "transparent", color: "#92591a", border: "1px solid #e3c178", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Keep it anyway
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 14, marginBottom: 4 }}>
          <Inp
            label="Merchant / Business Name"
            value={data.merchantName}
            onChange={v => setData({ ...data, merchantName: v })}
            placeholder="Your Brand"
            hint="Shown in the page header. In production this auto-populates from your KYC'd account profile."
          />
        </div>
        <Toggle checked={data.showLogo} onChange={v => setData({ ...data, showLogo: v })} label="Show merchant logo" desc="Appears in your page header" />
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

      <SectionCard title="Cover Banner (optional)">
        <Toggle
          checked={!!data.coverImage || (data as any)._bannerEnabled}
          onChange={v => setData({ ...data, ...(v ? {} : { coverImage: "" }), ...({ _bannerEnabled: v } as any) })}
          label="Add a banner to your page"
          desc="A wide image shown across the top of your page header"
        />
        {(!!data.coverImage || (data as any)._bannerEnabled) && (
          <ImageUpload
            label="Banner image"
            value={data.coverImage}
            onChange={v => setData({ ...data, coverImage: v })}
            ratio="4:1"
            hint="Recommended size: 1200×300 px. You can reposition and zoom after uploading."
          />
        )}
      </SectionCard>

      <SectionCard title="Theme">
        <div style={{ marginBottom: 14 }}>
          <Label>Mode</Label>
          <SegmentedControl
            options={[{ key: "light", label: "Light" }, { key: "dark", label: "Dark" }, { key: "system", label: "System" }]}
            value={data.theme}
            onChange={v => setData({ ...data, theme: v as "light" | "dark" | "system" })}
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
// (Max Total Revenue field removed — no clear competitor parallel or use case.)
// ──────────────────────────────────────────────────────────────────────────────
export function StepSettings({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const slugAuto = data.pageSlug || data.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  // Validation
  const todayStr = new Date().toISOString().slice(0, 10);
  const expiryInPast = !!data.expiryDate && data.expiryDate < todayStr;
  const maxPaymentsInvalid = !!data.maxPayments && (parseInt(data.maxPayments) < 1 || isNaN(parseInt(data.maxPayments)));

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Settings & Publish</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 22px" }}>Set your page address, limits, and what happens after payment.</p>

      <SectionCard title="Page URL">
        <Inp
          label="Custom URL"
          value={data.pageSlug}
          onChange={v => setData({ ...data, pageSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-"), slugTouched: true })}
          placeholder="bluetooth-headphones"
          prefix="pay.enkash.in/"
          hint={`Your page will be available at pay.enkash.in/${slugAuto || "your-slug"}`}
        />
      </SectionCard>

      {/* Payment-method selection removed from the page wizard — the PG account
          owns method configuration centrally, and the checkout surfaces whatever
          the account has enabled. (WizardData.paymentMethods / netbankingBanks /
          wallets stay defined with full defaults for when the real PG checkout is
          stitched in.) */}

      <SectionCard title="Limits & Expiry">
        <Inp label="Page Expires On" value={data.expiryDate} onChange={v => setData({ ...data, expiryDate: v })} type="date" hint="Leave blank for no expiry" />
        {expiryInPast && <p style={{ fontSize: 11, color: C.red, margin: "-12px 0 12px" }}>Expiry date must be in the future.</p>}
        <Inp label="Max Number of Payments" value={data.maxPayments} onChange={v => setData({ ...data, maxPayments: v })} placeholder="Unlimited" type="number" hint="Auto-deactivate the page once this limit is reached" />
        {maxPaymentsInvalid && <p style={{ fontSize: 11, color: C.red, margin: "-12px 0 0" }}>Must be 1 or more (or leave blank for unlimited).</p>}
      </SectionCard>

      <SectionCard title="After Payment">
        <Textarea label="Custom Success Message" value={data.successMessage} onChange={v => setData({ ...data, successMessage: v })} placeholder="Thank you for your payment! We'll be in touch shortly." rows={2} hint="Shown to customers on the hosted page after a successful payment" />
      </SectionCard>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
export function getSymbol(_currency?: string) {
  return "₹";
}

export function getSteps(): { key: string; label: string }[] {
  return [
    { key: "details", label: "Page Details" },
    { key: "fields", label: "Customer Fields" },
    { key: "customization", label: "Customization" },
    { key: "settings", label: "Settings & Publish" },
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// Publish-time validation — runs once when the merchant clicks "Publish Page".
// Returns one error per problem, tagged with the step index it lives on so the
// wizard can jump the user straight to the fix. Per-step "Continue" stays free.
// ──────────────────────────────────────────────────────────────────────────────
export interface ValidationError { step: number; message: string; }

export function validateWizard(data: WizardData): ValidationError[] {
  const errors: ValidationError[] = [];
  const STEP_DETAILS = 0, STEP_FIELDS = 1, STEP_SETTINGS = 3;

  // ── Step 1: Details ──
  if (!data.title.trim()) {
    errors.push({ step: STEP_DETAILS, message: "Add a page title." });
  }

  if (data.amountType === "fixed") {
    if (!(parseFloat(data.fixedAmount || "0") > 0)) {
      errors.push({ step: STEP_DETAILS, message: "Set a fixed amount greater than zero." });
    }
  } else if (data.amountType === "customer") {
    const minN = parseFloat(data.minAmount), maxN = parseFloat(data.maxAmount);
    if (!isNaN(minN) && !isNaN(maxN) && maxN < minN) {
      errors.push({ step: STEP_DETAILS, message: "Maximum amount can't be less than the minimum." });
    }
  } else if (data.amountType === "multiple") {
    const hasItem = data.items.some(it => it.label.trim() && parseFloat(it.amount || "0") > 0);
    if (!hasItem) errors.push({ step: STEP_DETAILS, message: `Add at least one ${data.itemsAreTickets ? "ticket tier" : "item"} with a price.` });
    if (data.itemsAreTickets && !data.eventDate) {
      errors.push({ step: STEP_DETAILS, message: "Set the event date." });
    }
  }

  // ── Step 2: Customer fields ──
  const labelCounts = data.customerFields.reduce<Record<string, number>>((acc, f) => {
    const k = f.label.trim().toLowerCase();
    if (k) acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  if (data.customerFields.some(f => !f.label.trim())) {
    errors.push({ step: STEP_FIELDS, message: "Every customer field needs a label." });
  }
  if (Object.values(labelCounts).some(n => n > 1)) {
    errors.push({ step: STEP_FIELDS, message: "Two customer fields share the same label." });
  }

  // ── Step 4: Settings ──
  const todayStr = new Date().toISOString().slice(0, 10);
  if (data.expiryDate && data.expiryDate < todayStr) {
    errors.push({ step: STEP_SETTINGS, message: "The expiry date is in the past." });
  }
  if (data.maxPayments && (isNaN(parseInt(data.maxPayments)) || parseInt(data.maxPayments) < 1)) {
    errors.push({ step: STEP_SETTINGS, message: "Max payments must be 1 or more (or blank for unlimited)." });
  }

  return errors;
}
