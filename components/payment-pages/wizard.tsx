"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { Btn } from "./primitives";
import { PagePreview } from "./page-preview";
import {
  WizardData, DEFAULT_WIZARD, PageType, getStepsForType,
  StepStandardDetails, StepDonationDetails, StepEventDetails, StepInvoiceDetails,
  StepCustomerFields, StepCustomization, StepSettings,
} from "./wizard-steps";

const PAGE_TYPES: { key: PageType; icon: string; title: string; tagline: string; desc: string; color: string }[] = [
  {
    key: "standard", icon: "💳", title: "Standard",
    tagline: "Sell products or services",
    desc: "Fixed price, customer-decides, or multiple items. Best for courses, subscriptions, services.",
    color: "#1c5af4",
  },
  {
    key: "donation", icon: "❤", title: "Donation",
    tagline: "Accept contributions",
    desc: "Suggested amounts + custom donations, with optional 80G tax certificate generation.",
    color: "#ea580c",
  },
  {
    key: "event", icon: "🎟", title: "Event",
    tagline: "Sell tickets",
    desc: "Multiple ticket tiers, capacity limits, attendee details. Perfect for conferences and workshops.",
    color: "#0891b2",
  },
  {
    key: "invoice", icon: "📃", title: "Invoice",
    tagline: "Bill a client",
    desc: "Tax-compliant invoice with line items, due date, and customer billing details.",
    color: "#7c3aed",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Type Selection - 4 cards in a single row
// ──────────────────────────────────────────────────────────────────────────────
function TypeSelector({ selected, onSelect }: { selected: PageType | null; onSelect: (key: PageType) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {PAGE_TYPES.map(pt => (
        <TypeOption key={pt.key} pt={pt} selected={selected === pt.key} onClick={() => onSelect(pt.key)} />
      ))}
    </div>
  );
}

function TypeOption({ pt, selected, onClick }: { pt: typeof PAGE_TYPES[number]; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${active ? pt.color : C.border}`, borderRadius: radius.lg,
        padding: "20px 18px", cursor: "pointer", background: active ? hexAlpha(pt.color, 0.05) : C.white,
        transition: "all 0.2s", display: "flex", flexDirection: "column",
        boxShadow: active ? `0 8px 24px ${hexAlpha(pt.color, 0.18)}` : shadow.sm,
        transform: hovered && !selected ? "translateY(-2px)" : "translateY(0)",
        minHeight: 220,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: radius.md,
        background: active ? pt.color : C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14, transition: "all 0.2s", fontSize: 20,
        filter: active ? "brightness(1.1)" : "none",
      }}>
        <span style={{ filter: active ? "grayscale(0)" : "grayscale(0)" }}>{pt.icon}</span>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: active ? pt.color : C.text, margin: "0 0 3px", letterSpacing: "-0.01em" }}>{pt.title}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: active ? pt.color : C.textMuted, margin: "0 0 10px" }}>{pt.tagline}</p>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.6, flex: 1 }}>{pt.desc}</p>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>4 quick steps</span>
        <span style={{ fontSize: 12, color: active ? pt.color : C.textMuted, fontWeight: 700 }}>
          {selected ? "✓ Selected" : "Choose →"}
        </span>
      </div>
    </div>
  );
}

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Wizard Sidebar — vertical step list
// ──────────────────────────────────────────────────────────────────────────────
function WizardSidebar({
  steps, currentStep, completedSteps, pageType, brandColor,
}: {
  steps: { key: string; label: string }[]; currentStep: number; completedSteps: number[]; pageType: PageType; brandColor: string;
}) {
  const meta = PAGE_TYPES.find(t => t.key === pageType)!;
  return (
    <div style={{ width: 220, background: C.white, borderRight: `1px solid ${C.border}`, padding: "26px 18px", flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ background: hexAlpha(meta.color, 0.08), border: `1px solid ${hexAlpha(meta.color, 0.25)}`, borderRadius: radius.md, padding: "10px 12px", marginBottom: 22 }}>
        <p style={{ fontSize: 10, color: C.textMuted, margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Creating</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: meta.color, margin: 0 }}>{meta.icon} {meta.title} Page</p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: 11, color: C.blue, fontWeight: 700 }}>{Math.min(currentStep + 1, steps.length)} / {steps.length}</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((currentStep + 1) / steps.length) * 100}%`, background: C.blue, borderRadius: 4, transition: "width 0.35s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 22 }}>
        {steps.map((s, i) => {
          const done = completedSteps.includes(i);
          const active = currentStep === i;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: radius.md, background: active ? C.blueLight : "transparent", transition: "background 0.15s" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: done ? C.green : active ? C.blue : C.white,
                border: `2px solid ${done ? C.green : active ? C.blue : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: (done || active) ? C.white : C.textFaint, fontWeight: 700,
                transition: "all 0.2s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <p style={{ fontSize: 13, fontWeight: active ? 700 : done ? 600 : 500, color: active ? C.blue : done ? C.textSecondary : C.textFaint, margin: 0, lineHeight: 1.2 }}>
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ background: C.amberBg, border: `1px solid ${C.amberMid}`, borderRadius: radius.md, padding: "10px 12px" }}>
        <p style={{ fontSize: 11, color: C.amber, margin: "0 0 2px", fontWeight: 700 }}>Tip</p>
        <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
          Watch the live preview update as you fill in your details on the right.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Live preview pane — wider, no scaling, real webpage layout
// ──────────────────────────────────────────────────────────────────────────────
function PreviewPane({ data, device, onDeviceChange }: {
  data: WizardData; device: "desktop" | "mobile"; onDeviceChange: (d: "desktop" | "mobile") => void;
}) {
  return (
    <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: "#e9ecf3", minWidth: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>Live Preview</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>
            pay.enkash.in/{data.pageSlug || "your-slug"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: radius.md, padding: 3 }}>
          {([
            { k: "desktop", label: "Desktop", icon: "🖥" },
            { k: "mobile", label: "Mobile", icon: "📱" },
          ] as const).map(({ k, label, icon }) => (
            <button key={k} onClick={() => onDeviceChange(k)}
              style={{
                padding: "6px 12px", border: "none", borderRadius: radius.sm, cursor: "pointer",
                background: device === k ? C.white : "transparent",
                color: device === k ? C.text : C.textMuted,
                boxShadow: device === k ? shadow.sm : "none", fontSize: 12, fontWeight: 600,
                fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5,
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 12 }}>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview viewport */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: device === "mobile" ? "32px 16px" : "0", minHeight: 0 }}>
        {device === "mobile" ? (
          <div style={{
            width: 300, height: "calc(100vh - 160px)", maxHeight: 620,
            border: `8px solid #0f172a`, borderRadius: 36, boxShadow: `0 20px 60px rgba(0,0,0,0.25)`,
            background: C.white, display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div style={{ height: 24, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 60, height: 6, background: "#1e293b", borderRadius: 4 }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <PagePreview data={data} device="mobile" />
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", minHeight: "100%" }}>
            <PagePreview data={data} device="desktop" />
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Success Screen
// ──────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ data, onDone }: { data: WizardData; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<"qr" | "email" | "analytics" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const pageId = "PP-ENK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const url = `pay.enkash.in/${data.pageSlug || "your-page"}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setEmailInput(""); }, 2500);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", textAlign: "center", overflow: "auto" }}>
      <div style={{ width: 64, height: 64, background: C.greenBg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
        ✓
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Page Published!</h2>
      <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 4px" }}>Your payment page is now live and ready to accept payments.</p>
      <code style={{ fontSize: 12, color: C.textFaint, margin: "0 0 32px", display: "block" }}>{pageId}</code>

      <div style={{ width: "100%", maxWidth: 500, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "18px 20px", marginBottom: 24, textAlign: "left", boxShadow: shadow.md }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>Your Payment Page URL</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.md, padding: "9px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 13, color: C.blue, fontWeight: 500 }}>https://{url}</span>
          </div>
          <button onClick={copy} style={{ background: copied ? C.green : C.blue, color: C.white, border: "none", borderRadius: radius.md, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", flexShrink: 0, transition: "background 0.2s" }}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, width: "100%", maxWidth: 500, marginBottom: 32 }}>
        {[
          { id: "qr" as const, icon: "▦", label: "Get QR Code", desc: "Print or share" },
          { id: "email" as const, icon: "@", label: "Send via Email", desc: "Direct to customers" },
          { id: "analytics" as const, icon: "↗", label: "View Analytics", desc: "Track performance" },
        ].map(item => (
          <div key={item.id} onClick={() => setModal(item.id)}
            style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "14px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.blue; (e.currentTarget as HTMLDivElement).style.boxShadow = shadow.md; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
            <p style={{ fontSize: 16, margin: "0 0 4px", fontWeight: 800, color: C.blue }}>{item.icon}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{item.label}</p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <Btn onClick={onDone} size="lg">← Back to Dashboard</Btn>

      {/* ── Modal overlay ── */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: radius.lg, boxShadow: shadow.lg, padding: "28px 32px", width: "100%", maxWidth: 420, position: "relative" }}>
            <button onClick={() => setModal(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textMuted, lineHeight: 1 }}>✕</button>

            {modal === "qr" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>QR Code</h3>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px" }}>Scan to open your payment page. Download and print for offline sharing.</p>
                {/* Simulated QR code */}
                <div style={{ width: 180, height: 180, margin: "0 auto 20px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, padding: 12 }}>
                    {Array.from({ length: 49 }).map((_, i) => {
                      const corner = (r: number, c: number) => (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
                      const row = Math.floor(i / 7); const col = i % 7;
                      const filled = corner(row, col) || Math.random() > 0.55;
                      return <div key={i} style={{ width: 10, height: 10, background: filled ? "#111" : "transparent", borderRadius: 1 }} />;
                    })}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: C.textFaint, margin: "0 0 16px", textAlign: "center" }}>https://{url}</p>
                <button style={{ width: "100%", padding: "11px", background: C.blue, color: C.white, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  ↓ Download QR Code (PNG)
                </button>
              </>
            )}

            {modal === "email" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Send via Email</h3>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Share your payment page link directly with a customer.</p>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Recipient Email</label>
                <input
                  value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  placeholder="customer@example.com"
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: radius.sm, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12, outline: "none" }}
                />
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Message (optional)</label>
                <textarea
                  placeholder={`Hi, here's the link to make your payment: https://${url}`}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: radius.sm, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16, resize: "none", outline: "none" }}
                />
                <button onClick={sendEmail} style={{ width: "100%", padding: "11px", background: emailSent ? C.green : C.blue, color: C.white, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" }}>
                  {emailSent ? "✓ Email Sent!" : "Send Email"}
                </button>
              </>
            )}

            {modal === "analytics" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Analytics</h3>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Performance snapshot for this payment page since it went live.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Total Views", value: "0", icon: "👁" },
                    { label: "Payments Made", value: "0", icon: "✓" },
                    { label: "Conversion Rate", value: "—", icon: "%" },
                    { label: "Revenue Collected", value: "₹0", icon: "₹" },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.md, padding: "12px 14px" }}>
                      <p style={{ fontSize: 18, margin: "0 0 2px" }}>{stat.icon}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 2px" }}>{stat.value}</p>
                      <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.md, padding: "12px 14px", fontSize: 12, color: C.textMuted, textAlign: "center" }}>
                  Full analytics available in the <strong style={{ color: C.blue }}>EnKash Dashboard</strong> → Payment Links → Transactions
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main wizard
// ──────────────────────────────────────────────────────────────────────────────
export function Wizard({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"type-select" | "wizard" | "success">("type-select");
  const [selectedType, setSelectedType] = useState<PageType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [data, setData] = useState<WizardData>(DEFAULT_WIZARD);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const handleSelectType = (key: PageType) => {
    setSelectedType(key);
    setData({ ...DEFAULT_WIZARD, pageType: key });
    setCurrentStep(0);
    setCompletedSteps([]);
    setPhase("wizard");
  };

  const steps = selectedType ? getStepsForType(selectedType) : [];
  const totalSteps = steps.length;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(s => s + 1);
    } else {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setPhase("success");
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else setPhase("type-select");
  };

  // Render step 1 based on type
  const renderStep1 = () => {
    if (selectedType === "donation") return <StepDonationDetails data={data} setData={setData} />;
    if (selectedType === "event") return <StepEventDetails data={data} setData={setData} />;
    if (selectedType === "invoice") return <StepInvoiceDetails data={data} setData={setData} />;
    return <StepStandardDetails data={data} setData={setData} />;
  };

  const stepComponents = [
    renderStep1(),
    <StepCustomerFields key="fields" data={data} setData={setData} />,
    <StepCustomization key="custom" data={data} setData={setData} />,
    <StepSettings key="settings" data={data} setData={setData} />,
  ];

  if (phase === "success") {
    return (
      <div style={{ flex: 1, display: "flex" }}>
        <SuccessScreen data={data} onDone={onBack} />
      </div>
    );
  }

  if (phase === "type-select") {
    return (
      <div style={{ flex: 1, padding: "44px 40px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0, marginBottom: 24, display: "flex", alignItems: "center", gap: 6, fontWeight: 500, alignSelf: "flex-start" }}>
          ← Back to dashboard
        </button>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>What kind of page do you want to create?</h2>
        <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 32px", lineHeight: 1.5 }}>Each type has its own creation flow tailored to the use case.</p>
        <TypeSelector selected={selectedType} onSelect={handleSelectType} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
      <WizardSidebar steps={steps} currentStep={currentStep} completedSteps={completedSteps} pageType={selectedType ?? "standard"} brandColor={data.brandColor} />

      {/* Form area — narrower */}
      <div style={{ width: 460, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
        <div style={{ flex: 1, padding: "26px 28px", overflowY: "auto" }}>
          {stepComponents[currentStep]}
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Btn onClick={goBack} variant="ghost" size="sm">
            ← {currentStep === 0 ? "Type" : "Back"}
          </Btn>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: C.textFaint }}>Step {currentStep + 1} of {totalSteps}</span>
            <Btn onClick={goNext} size="sm">
              {currentStep === totalSteps - 1 ? "Publish Page" : "Continue →"}
            </Btn>
          </div>
        </div>
      </div>

      {/* Live preview — takes the rest */}
      <PreviewPane data={data} device={device} onDeviceChange={setDevice} />
    </div>
  );
}
