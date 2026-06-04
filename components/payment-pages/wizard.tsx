"use client";
import { useState } from "react";
import { C, radius, shadow } from "./tokens";
import { Btn } from "./primitives";
import { PagePreview } from "./page-preview";
import {
  WizardData, DEFAULT_WIZARD, PageType, getStepsForType,
  StepPageDetails, StepInvoiceDetails,
  StepCustomerFields, StepCustomization, StepSettings,
  validateWizard, ValidationError,
} from "./wizard-steps";

const PAGE_TYPES: { key: PageType; icon: string; title: string; tagline: string; desc: string; color: string }[] = [
  {
    key: "page", icon: "📄", title: "Standard Page",
    tagline: "Accept payments via a shareable link",
    desc: "One flow that adapts to what you're charging for — products, services, donations, events, fees. The page builds itself around your pricing choice.",
    color: "#1c5af4",
  },
  {
    key: "invoice", icon: "📃", title: "Invoice",
    tagline: "Bill a specific client",
    desc: "Tax-compliant invoice with line items, due date, and customer billing details. Best when you already know who you're billing.",
    color: "#7c3aed",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Type Selection - 4 cards in a single row
// ──────────────────────────────────────────────────────────────────────────────
function TypeSelector({ selected, onSelect }: { selected: PageType | null; onSelect: (key: PageType) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, width: "100%" }}>
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
        padding: "28px 26px", cursor: "pointer", background: active ? hexAlpha(pt.color, 0.05) : C.white,
        transition: "all 0.2s", display: "flex", flexDirection: "column",
        boxShadow: active ? `0 10px 30px ${hexAlpha(pt.color, 0.2)}` : shadow.sm,
        transform: hovered && !selected ? "translateY(-3px)" : "translateY(0)",
        minHeight: 260, textAlign: "left",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: radius.md,
        background: active ? pt.color : C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18, transition: "all 0.2s", fontSize: 24,
        filter: active ? "brightness(1.1)" : "none",
      }}>
        <span style={{ filter: active ? "grayscale(0)" : "grayscale(0)" }}>{pt.icon}</span>
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: active ? pt.color : C.text, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{pt.title}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: active ? pt.color : C.textMuted, margin: "0 0 12px" }}>{pt.tagline}</p>
      <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.65, flex: 1 }}>{pt.desc}</p>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>4 quick steps</span>
        <span style={{ fontSize: 13, color: active ? pt.color : C.textMuted, fontWeight: 700 }}>
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
function WizardStepper({
  steps, currentStep, pageType, onJump,
}: {
  steps: { key: string; label: string }[]; currentStep: number; pageType: PageType; onJump: (i: number) => void;
}) {
  const meta = PAGE_TYPES.find(t => t.key === pageType)!;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "11px 24px",
      borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, overflowX: "auto",
    }}>
      {/* Context — what's being created */}
      <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creating</span>
        <span style={{ fontWeight: 700, color: meta.color }}>{meta.icon} {meta.title}</span>
      </span>

      <div style={{ height: 18, width: 1, background: C.border, flexShrink: 0 }} />

      {/* Horizontal steps with chevrons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
        {steps.map((s, i) => {
          const done = i < currentStep;
          const active = currentStep === i;
          // Clickable: any visited step (back) or exactly one ahead. Further stays locked.
          const clickable = i <= currentStep + 1;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                onClick={() => clickable && onJump(i)}
                role={clickable ? "button" : undefined}
                title={clickable ? undefined : "Complete the earlier steps first"}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: radius.md,
                  background: active ? C.blue : "transparent", whiteSpace: "nowrap", transition: "background 0.15s",
                  cursor: clickable ? "pointer" : "not-allowed", opacity: clickable ? 1 : 0.5,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  background: done ? C.green : active ? C.white : "transparent",
                  border: `1.5px solid ${done ? C.green : active ? C.white : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: done ? C.white : active ? C.blue : C.textFaint,
                }}>
                  {done ? "✓" : i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.white : done ? C.textSecondary : C.textFaint }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span style={{ fontSize: 13, color: C.textFaint, flexShrink: 0 }}>›</span>
              )}
            </div>
          );
        })}
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
  const [data, setData] = useState<WizardData>(DEFAULT_WIZARD);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Publish-time validation errors, keyed by step index. Empty until a blocked publish.
  const [publishErrors, setPublishErrors] = useState<ValidationError[]>([]);

  const beginType = (key: PageType) => {
    setSelectedType(key);
    setData({ ...DEFAULT_WIZARD, pageType: key });
    setCurrentStep(0);
    setPublishErrors([]);
    setPhase("wizard");
  };

  // Have any edits been made to the current page vs. a fresh page of this type?
  const isDirty = () =>
    selectedType !== null &&
    JSON.stringify(data) !== JSON.stringify({ ...DEFAULT_WIZARD, pageType: selectedType });

  const handleSelectType = (key: PageType) => beginType(key);

  const steps = selectedType ? getStepsForType(selectedType) : [];
  const totalSteps = steps.length;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
    } else {
      // Final step → validate the whole page before publishing.
      const errors = validateWizard(data);
      if (errors.length > 0) {
        setPublishErrors(errors);
        // Jump to the first step that has a problem so the fix is visible.
        setCurrentStep(errors[0].step);
        return;
      }
      setPublishErrors([]);
      setPhase("success");
    }
  };

  const goBack = () => {
    if (currentStep > 0) { setCurrentStep(s => s - 1); return; }
    // Step 1 → back to type selection. Warn before discarding any work.
    if (isDirty() && !window.confirm("Going back will discard the changes you've made to this page. Continue?")) return;
    setData(DEFAULT_WIZARD);
    setSelectedType(null);
    setPublishErrors([]);
    setCurrentStep(0);
    setPhase("type-select");
  };

  // Pills: jump back to any visited step, or one step ahead. Two-or-more ahead stays locked.
  const jumpTo = (i: number) => {
    if (i <= currentStep + 1 && i >= 0 && i < totalSteps) setCurrentStep(i);
  };

  // Render step 1 based on type
  const renderStep1 = () => {
    if (selectedType === "invoice") return <StepInvoiceDetails data={data} setData={setData} />;
    return <StepPageDetails data={data} setData={setData} />;
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
        <div style={{ width: "100%", maxWidth: 820, margin: "32px auto 0", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>What kind of page do you want to create?</h2>
          <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 36px", lineHeight: 1.5 }}>Pick the one that fits your use case — each flow is tailored for what you need.</p>
          <TypeSelector selected={selectedType} onSelect={handleSelectType} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Horizontal stepper — second header row, full width */}
      <WizardStepper steps={steps} currentStep={currentStep} pageType={selectedType ?? "page"} onJump={jumpTo} />

      {/* Form + preview row */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        {/* Form area */}
        <div style={{ width: 460, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
          <div style={{ flex: 1, padding: "26px 28px", overflowY: "auto" }}>
            {/* Publish-time validation summary — only after a blocked publish */}
            {publishErrors.length > 0 && (
              <div style={{ background: C.redBg, border: `1px solid ${C.redMid}`, borderRadius: radius.md, padding: "12px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.red, margin: "0 0 6px" }}>
                  Fix {publishErrors.length} {publishErrors.length === 1 ? "issue" : "issues"} before publishing
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {publishErrors.map((e, i) => (
                    <li key={i} style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
                      <button onClick={() => jumpTo(e.step)} style={{ background: "none", border: "none", padding: 0, color: C.red, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>
                        Step {e.step + 1}
                      </button>
                      {" — "}{e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
    </div>
  );
}
