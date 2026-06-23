"use client";
import { useState, useEffect } from "react";
import { C, radius } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn } from "@/components/payment-pages/primitives";
import {
  ButtonData, DEFAULT_BUTTON, getButtonSteps, validateButton, ButtonValidationError,
  StepButtonBasics, StepButtonCheckout,
} from "./button-wizard-steps";
import { EmbeddedButton, MerchantSiteMock, ButtonCheckout } from "./button-preview";
import { embedSnippet } from "./button-mock-data";

const amountHelper = (d: ButtonData): string => {
  if (d.amountMode === "fixed") {
    const n = parseFloat(d.fixedAmount || "0");
    return n > 0 ? `Charges ₹${n.toLocaleString("en-IN")} on every click` : "Charges a fixed amount on every click";
  }
  return "Payer enters the amount in the checkout";
};

function ButtonStepper({ steps, currentStep, onJump }: { steps: { key: string; label: string }[]; currentStep: number; onJump: (i: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "11px 24px", borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, overflowX: "auto" }}>
      <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creating</span>
        <span style={{ fontWeight: 700, color: C.blue, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="button" size={15} /> Payment Button</span>
      </span>
      <div style={{ height: 18, width: 1, background: C.border, flexShrink: 0 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {steps.map((s, i) => {
          const done = i < currentStep, active = currentStep === i, clickable = i <= currentStep;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={() => clickable && onJump(i)} role={clickable ? "button" : undefined} title={clickable ? undefined : "Use Continue to move forward"}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: radius.md, background: active ? C.blue : "transparent", whiteSpace: "nowrap", cursor: clickable ? "pointer" : "not-allowed", opacity: clickable ? 1 : 0.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: done ? C.green : active ? C.white : "transparent", border: `1.5px solid ${done ? C.green : active ? C.white : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: done ? C.white : active ? C.blue : C.textFaint }}>{done ? "✓" : i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.white : done ? C.textSecondary : C.textFaint }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <span style={{ fontSize: 13, color: C.textFaint, flexShrink: 0 }}>›</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ButtonPreviewPane({ data }: { data: ButtonData }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  return (
    <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: "#e9ecf3", minWidth: 0 }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>Live Preview</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Your button, on your site</p>
        </div>
        <span style={{ fontSize: 11.5, color: C.textMuted, background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: radius.full, padding: "5px 12px", whiteSpace: "nowrap", flexShrink: 0 }}>
          {amountHelper(data)}
        </span>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", padding: "36px 20px", minHeight: 0, gap: 18 }}>
        <MerchantSiteMock data={data} onPay={() => setCheckoutOpen(true)} />
        <button onClick={() => setCheckoutOpen(true)}
          style={{ fontSize: 13, fontWeight: 600, color: C.blue, background: C.white, border: `1.5px solid ${C.blueMid}`, borderRadius: radius.md, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Icon name="eye" size={15} /> Preview the checkout
        </button>
      </div>
      {checkoutOpen && <ButtonCheckout data={data} onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}

function EmbedBlock({ id }: { id: string }) {
  const snippet = embedSnippet(id);
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } };
  return (
    <div style={{ width: "100%", maxWidth: 540, background: C.navy, borderRadius: radius.lg, overflow: "hidden", textAlign: "left", boxShadow: "0 10px 30px rgba(15,23,42,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="redirect" size={14} color="#fff" /> HTML embed</span>
        <button onClick={copy} style={{ fontSize: 12, fontWeight: 700, color: copied ? "#86efac" : "#cbd5e1", background: "rgba(255,255,255,0.10)", border: "none", borderRadius: radius.sm, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {copied ? "✓ Copied" : <><Icon name="copy" size={13} color="#cbd5e1" /> Copy code</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.7, color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{snippet}</pre>
    </div>
  );
}

function ButtonSuccessScreen({ data, buttonId, onDone }: { data: ButtonData; buttonId: string; onDone: () => void }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: 32, background: C.bg, overflow: "auto" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.greenBg, display: "grid", placeItems: "center", marginBottom: 18 }}><Icon name="checkCircle" size={38} color={C.green} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Your button is ready</h2>
      <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 22px", textAlign: "center", maxWidth: 440, lineHeight: 1.6 }}>
        "{data.title}" is live. Paste this snippet anywhere on your website and the button appears — clicks open the
        EnKash checkout.
      </p>

      <div style={{ marginBottom: 20 }}><EmbeddedButton data={data} /></div>

      <EmbedBlock id={buttonId} />

      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn variant="secondary" onClick={() => setCheckoutOpen(true)}><Icon name="eye" size={15} /> Preview the checkout</Btn>
        <Btn variant="primary" onClick={onDone}>Back to dashboard</Btn>
      </div>

      <p style={{ fontSize: 12, color: C.textFaint, margin: "18px 0 0", textAlign: "center", maxWidth: 440, lineHeight: 1.5 }}>
        The same code and a copy button are always available from this button's detail page.
      </p>

      {checkoutOpen && <ButtonCheckout data={data} onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}

export function ButtonWizard({
  initialData = DEFAULT_BUTTON, initialStep = 0, editing = false, onBack, onSaveDraft, onPublish, onSyncState,
}: {
  initialData?: ButtonData; initialStep?: number; editing?: boolean;
  onBack: () => void; onSaveDraft?: (data: ButtonData, step: number) => void; onPublish?: (data: ButtonData) => string | void;
  onSyncState?: (data: ButtonData, step: number, building: boolean) => void;
}) {
  const [data, setData] = useState<ButtonData>(initialData);
  const steps = getButtonSteps();
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(Math.min(initialStep, totalSteps - 1));
  const [phase, setPhase] = useState<"wizard" | "success">("wizard");
  const [errors, setErrors] = useState<ButtonValidationError[]>([]);
  const [publishedId, setPublishedId] = useState("PB-ENK-PREVIEW");

  useEffect(() => { onSyncState?.(data, currentStep, phase === "wizard"); /* eslint-disable-next-line */ }, [data, currentStep, phase]);

  const canSaveDraft = !!onSaveDraft && data.title.trim().length > 0;

  const advance = () => {
    if (currentStep === totalSteps - 1) {
      const errs = validateButton(data);
      if (errs.length) { setErrors(errs); setCurrentStep(errs[0].step); return; }
      setErrors([]);
      const id = onPublish?.(data);
      if (typeof id === "string" && id) setPublishedId(id);
      setPhase("success");
    } else setCurrentStep(s => s + 1);
  };
  const back = () => { if (currentStep === 0) onBack(); else setCurrentStep(s => s - 1); };
  const jumpTo = (i: number) => { if (i <= currentStep) setCurrentStep(i); };

  if (phase === "success") return <ButtonSuccessScreen data={data} buttonId={publishedId} onDone={onBack} />;

  const stepComponents = [
    <StepButtonBasics key="basics" data={data} setData={setData} />,
    <StepButtonCheckout key="checkout" data={data} setData={setData} />,
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ButtonStepper steps={steps} currentStep={currentStep} onJump={jumpTo} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 480, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
            {errors.length > 0 && (
              <div style={{ background: C.redBg, border: `1px solid ${C.redMid}`, borderRadius: radius.md, padding: "12px 14px", marginBottom: 18 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: C.red, margin: "0 0 6px" }}>Fix these before creating the button:</p>
                {errors.map((e, i) => (
                  <p key={i} style={{ fontSize: 12.5, color: C.red, margin: "2px 0", display: "flex", gap: 6 }}>• {e.message}
                    <button onClick={() => jumpTo(e.step)} style={{ background: "none", border: "none", padding: 0, color: C.red, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>Step {e.step + 1}</button>
                  </p>
                ))}
              </div>
            )}
            {stepComponents[currentStep]}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, background: C.white, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={back}>{currentStep === 0 ? "Cancel" : "Back"}</Btn>
            {onSaveDraft && (
              <button onClick={() => canSaveDraft && onSaveDraft(data, currentStep)} disabled={!canSaveDraft} title={canSaveDraft ? undefined : "Name the button first to save a draft"}
                style={{ marginLeft: "auto", padding: "9px 18px", background: canSaveDraft ? C.white : C.bg, color: canSaveDraft ? C.blue : C.textFaint, border: `1.5px solid ${canSaveDraft ? C.blueMid : C.border}`, borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: canSaveDraft ? "pointer" : "not-allowed" }}>Save as Draft</button>
            )}
            <div style={{ marginLeft: onSaveDraft ? 0 : "auto" }}>
              <Btn variant="primary" onClick={advance}>{currentStep === totalSteps - 1 ? "Create button" : "Continue →"}</Btn>
            </div>
          </div>
        </div>
        <ButtonPreviewPane data={data} />
      </div>
    </div>
  );
}
