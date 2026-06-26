"use client";
import { useState, useEffect } from "react";
import { C, radius, shadow } from "./tokens";
import { Btn } from "./primitives";
import { Icon, IconName } from "./icons";
import { PagePreview } from "./page-preview";
import {
  WizardData, DEFAULT_WIZARD, getSteps,
  StepPageDetails,
  StepCustomerFields, StepCustomization, StepSettings,
  validateWizard, ValidationError,
} from "./wizard-steps";

// ──────────────────────────────────────────────────────────────────────────────
// AI Entry Screen — merchant describes their page; we fill the wizard for them
// ──────────────────────────────────────────────────────────────────────────────
function AiEntryScreen({
  onGenerate, onSkip, onExit,
}: {
  onGenerate: (config: Partial<WizardData>, assumptions: string[]) => void;
  onSkip: () => void;
  onExit: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      onGenerate(json.config ?? {}, json.assumptions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again or set up manually.");
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Minimal header */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button
          onClick={onExit}
          style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, padding: "4px 0", display: "flex", alignItems: "center", gap: 5 }}
        >
          ← Exit
        </button>
        <div style={{ height: 16, width: 1, background: C.border }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creating</span>
        <span style={{ fontWeight: 700, color: C.blue, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name="page" size={15} /> Payment Page
        </span>
      </div>

      {/* Centered content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Icon */}
          <div style={{ width: 52, height: 52, background: "#eef2ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 22, color: C.blue }}>
            ✦
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Describe your payment page
          </h2>
          <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 28px", lineHeight: 1.65 }}>
            Tell us what you&apos;re selling or collecting payments for and we&apos;ll pre-fill the whole wizard for you.
          </p>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate(); }}
            disabled={loading}
            rows={5}
            placeholder={"e.g. Tickets for our design conference on 20 July in Bengaluru. Early Bird ₹999, VIP ₹4,999. Collect company name.\n\nor: Online bakery — chocolate cake ₹800, cupcakes ₹400. Need delivery address.\n\nor: Monthly SaaS subscription at ₹1,999. Collect name and email."}
            style={{
              width: "100%", padding: "14px 16px", border: `1.5px solid ${C.border}`, borderRadius: radius.lg,
              fontSize: 14, fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none",
              boxSizing: "border-box", color: C.text, background: loading ? C.bg : C.white,
              transition: "border-color 0.15s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = C.blue; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
          />

          {error && (
            <p style={{ fontSize: 12, color: C.red, margin: "8px 0 0", lineHeight: 1.5 }}>{error}</p>
          )}

          <div style={{ marginTop: 14 }}>
            <Btn onClick={handleGenerate} disabled={!prompt.trim() || loading} size="lg" fullWidth>
              {loading ? "Generating…" : "Generate with AI →"}
            </Btn>
          </div>

          <p style={{ fontSize: 11, color: C.textFaint, margin: "10px 0 0", textAlign: "center" }}>
            ⌘↵ to generate · Review everything before publishing
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.textFaint }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button
            onClick={onSkip}
            style={{ width: "100%", padding: "11px", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.md, color: C.textSecondary, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
          >
            Set up manually →
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Wizard Sidebar — vertical step list
// ──────────────────────────────────────────────────────────────────────────────
function WizardStepper({
  steps, currentStep, onJump,
}: {
  steps: { key: string; label: string }[]; currentStep: number; onJump: (i: number) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "11px 24px",
      borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, overflowX: "auto",
    }}>
      {/* Context — what's being created */}
      <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creating</span>
        <span style={{ fontWeight: 700, color: C.blue, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="page" size={15} /> Payment Page</span>
      </span>

      <div style={{ height: 18, width: 1, background: C.border, flexShrink: 0 }} />

      {/* Horizontal steps with chevrons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
        {steps.map((s, i) => {
          const done = i < currentStep;
          const active = currentStep === i;
          // Clickable: the current step or any visited (earlier) step. Forward
          // steps are locked — you advance only via the Continue button.
          const clickable = i <= currentStep;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                onClick={() => clickable && onJump(i)}
                role={clickable ? "button" : undefined}
                title={clickable ? undefined : "Use Continue to move forward"}
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
            { k: "desktop", label: "Desktop", icon: "monitor" as IconName },
            { k: "mobile", label: "Mobile", icon: "smartphone" as IconName },
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
              <Icon name={icon} size={14} />{label}
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
          { id: "qr" as const, icon: <Icon name="qr" size={18} />, label: "Get QR Code", desc: "Print or share" },
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
                    { label: "Total Views", value: "0", icon: <Icon name="eye" size={18} /> },
                    { label: "Payments Made", value: "0", icon: "✓" },
                    { label: "Conversion Rate", value: "—", icon: "%" },
                    { label: "Revenue Collected", value: "₹0", icon: "₹" },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.md, padding: "12px 14px" }}>
                      <p style={{ fontSize: 18, margin: "0 0 2px", color: C.textMuted, display: "flex", alignItems: "center", minHeight: 22 }}>{stat.icon}</p>
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
export function Wizard({
  initialData, initialStep = 0, editing = false,
  onBack, onSaveDraft, onPublish, onSyncState,
}: {
  initialData?: WizardData;
  initialStep?: number;
  editing?: boolean;                               // reopening an existing page/draft
  onBack: () => void;                              // app's "leave the builder" handler (shows leave prompt if dirty)
  onSaveDraft?: (data: WizardData, step: number) => void;
  onPublish?: (data: WizardData) => void;
  onSyncState?: (data: WizardData, step: number, building: boolean) => void;
}) {
  const seed = initialData ?? DEFAULT_WIZARD;
  const [phase, setPhase] = useState<"ai-entry" | "wizard" | "success">(editing ? "wizard" : "ai-entry");
  const [currentStep, setCurrentStep] = useState(editing ? initialStep : 0);
  const [data, setData] = useState<WizardData>(seed);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Publish-time validation errors, keyed by step index. Empty until a blocked publish.
  const [publishErrors, setPublishErrors] = useState<ValidationError[]>([]);
  // AI-generated assumptions — shown as a dismissable banner above the form.
  const [aiAssumptions, setAiAssumptions] = useState<string[]>([]);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Mirror live builder state up to the app so the global home button can offer
  // "save as draft" when the merchant tries to leave with unsaved changes.
  useEffect(() => {
    onSyncState?.(data, currentStep, phase === "wizard");
    // onSyncState intentionally excluded from deps to avoid identity-churn loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currentStep, phase]);

  const handleAiGenerate = (config: Partial<WizardData>, assumptions: string[]) => {
    setData({ ...DEFAULT_WIZARD, ...config });
    setAiAssumptions(assumptions);
    setShowAssumptions(assumptions.length > 0);
    setPhase("wizard");
  };

  if (phase === "ai-entry") {
    return (
      <div style={{ flex: 1, display: "flex" }}>
        <AiEntryScreen
          onGenerate={handleAiGenerate}
          onSkip={() => setPhase("wizard")}
          onExit={onBack}
        />
      </div>
    );
  }

  const steps = getSteps();
  const totalSteps = steps.length;

  const canSaveDraft = !!onSaveDraft && data.title.trim().length > 0;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1);
    } else {
      // Final step → validate the whole page before publishing.
      const errors = validateWizard(data);
      if (errors.length > 0) {
        setPublishErrors(errors);
        setCurrentStep(errors[0].step);
        return;
      }
      setPublishErrors([]);
      onPublish?.(data);     // app upserts the page as Active
      setPhase("success");
    }
  };

  const goBack = () => {
    if (currentStep > 0) { setCurrentStep(s => s - 1); return; }
    // On step 1 → leave the builder (the app decides whether to prompt about
    // unsaved changes via the global leave handler).
    onBack();
  };

  // Pills: jump back to the current step or any visited step. Forward is locked.
  const jumpTo = (i: number) => {
    if (i <= currentStep && i >= 0 && i < totalSteps) setCurrentStep(i);
  };

  const stepComponents = [
    <StepPageDetails key="details" data={data} setData={setData} />,
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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Horizontal stepper — second header row, full width */}
      <WizardStepper steps={steps} currentStep={currentStep} onJump={jumpTo} />

      {/* Form + preview row */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        {/* Form area */}
        <div style={{ width: 460, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
          <div style={{ flex: 1, padding: "26px 28px", overflowY: "auto" }}>
            {/* AI assumptions banner — shown after AI generation until dismissed */}
            {showAssumptions && aiAssumptions.length > 0 && (
              <div style={{ background: "#fffbeb", border: `1px solid #f3d699`, borderRadius: radius.md, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#92591a", margin: "0 0 6px" }}>
                    AI filled this page — review before publishing:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {aiAssumptions.map((a, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#78450f", lineHeight: 1.65 }}>{a}</li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => setShowAssumptions(false)} style={{ background: "none", border: "none", color: "#92591a", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0, fontFamily: "inherit" }}>×</button>
              </div>
            )}

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
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, gap: 10 }}>
            <Btn onClick={goBack} variant="ghost" size="sm">
              ← {currentStep === 0 ? "Exit" : "Back"}
            </Btn>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {onSaveDraft && (
                <button
                  onClick={() => canSaveDraft && onSaveDraft(data, currentStep)}
                  disabled={!canSaveDraft}
                  title={canSaveDraft ? "Save and finish later" : "Add a page title to save a draft"}
                  style={{
                    background: C.white, color: canSaveDraft ? C.textSecondary : C.textFaint,
                    border: `1px solid ${C.border}`, borderRadius: radius.md, padding: "7px 14px",
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    cursor: canSaveDraft ? "pointer" : "not-allowed", opacity: canSaveDraft ? 1 : 0.6,
                  }}
                >
                  Save as Draft
                </button>
              )}
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
