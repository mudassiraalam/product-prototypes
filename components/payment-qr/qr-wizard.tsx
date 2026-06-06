"use client";
import { useState, useEffect } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon, IconName } from "@/components/payment-pages/icons";
import { Btn } from "@/components/payment-pages/primitives";
import {
  QrData, DEFAULT_QR, getQrSteps, validateQr, QrValidationError,
  StepQrSetup, StepQrCollect, StepQrStandee, StepQrRules,
} from "./qr-wizard-steps";
import { QrPreview } from "./qr-preview";

type QrStatus = "Active" | "Inactive" | "Draft" | "Expired";
type Device = "standee" | "customer";

// ── Stepper (forward-locked, like the page builder) ───────────────────────────
function QrStepper({ steps, currentStep, onJump }: {
  steps: { key: string; label: string }[]; currentStep: number; onJump: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "11px 24px", borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0, overflowX: "auto" }}>
      <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creating</span>
        <span style={{ fontWeight: 700, color: C.blue, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="qr" size={15} /> Payment QR</span>
      </span>
      <div style={{ height: 18, width: 1, background: C.border, flexShrink: 0 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
        {steps.map((s, i) => {
          const done = i < currentStep, active = currentStep === i, clickable = i <= currentStep;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={() => clickable && onJump(i)} role={clickable ? "button" : undefined}
                title={clickable ? undefined : "Use Continue to move forward"}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: radius.md, background: active ? C.blue : "transparent", whiteSpace: "nowrap", cursor: clickable ? "pointer" : "not-allowed", opacity: clickable ? 1 : 0.5, transition: "background 0.15s" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: done ? C.green : active ? C.white : "transparent", border: `1.5px solid ${done ? C.green : active ? C.white : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: done ? C.white : active ? C.blue : C.textFaint }}>
                  {done ? "✓" : i + 1}
                </span>
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

// ── Preview pane — Standee / Customer toggle (QR-native, not Desktop/Mobile) ───
function QrPreviewPane({ data, device, onDeviceChange }: {
  data: QrData; device: Device; onDeviceChange: (d: Device) => void;
}) {
  return (
    <div style={{ flex: 1, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: "#e9ecf3", minWidth: 0 }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>Live Preview</p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>
            upi://pay → {data.vpa || "your-upi-id"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 2, background: C.bg, borderRadius: radius.md, padding: 3 }}>
          {([
            { k: "standee", label: "Standee", icon: "qr" as IconName },
            { k: "customer", label: "Customer scan", icon: "smartphone" as IconName },
          ] as const).map(({ k, label, icon }) => (
            <button key={k} onClick={() => onDeviceChange(k)}
              style={{ padding: "6px 12px", border: "none", borderRadius: radius.sm, cursor: "pointer", background: device === k ? C.white : "transparent", color: device === k ? C.text : C.textMuted, boxShadow: device === k ? shadow.sm : "none", fontSize: 12, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
              <Icon name={icon} size={14} />{label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "36px 20px", minHeight: 0 }}>
        <QrPreview data={data} device={device} />
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function QrSuccessScreen({ data, onDone }: { data: QrData; onDone: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: C.bg, overflow: "auto" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.greenBg, display: "grid", placeItems: "center", marginBottom: 18 }}>
        <Icon name="checkCircle" size={38} color={C.green} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Your QR is live</h2>
      <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 22px", textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
        "{data.label}" is published. Download the standee to print it, or share the code — it opens any UPI app directly.
      </p>
      <div style={{ marginBottom: 24 }}>
        <QrPreview data={data} device="standee" />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="secondary" onClick={() => {}}>Download standee (PNG)</Btn>
        <Btn variant="primary" onClick={onDone}>Back to dashboard</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QR Wizard
// ══════════════════════════════════════════════════════════════════════════════
export function QrWizard({
  initialData = DEFAULT_QR, initialStep = 0, editing = false,
  onBack, onSaveDraft, onPublish, onSyncState,
}: {
  initialData?: QrData; initialStep?: number; editing?: boolean;
  onBack: () => void;
  onSaveDraft?: (data: QrData, step: number) => void;
  onPublish?: (data: QrData) => void;
  onSyncState?: (data: QrData, step: number, building: boolean) => void;
}) {
  const [data, setData] = useState<QrData>(initialData);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [device, setDevice] = useState<Device>("standee");
  const [phase, setPhase] = useState<"wizard" | "success">("wizard");
  const [errors, setErrors] = useState<QrValidationError[]>([]);

  useEffect(() => {
    onSyncState?.(data, currentStep, phase === "wizard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, currentStep, phase]);

  const steps = getQrSteps();
  const totalSteps = steps.length;
  const canSaveDraft = !!onSaveDraft && data.label.trim().length > 0;

  const advance = () => {
    if (currentStep === totalSteps - 1) {
      const errs = validateQr(data);
      if (errs.length) { setErrors(errs); setCurrentStep(errs[0].step); return; }
      setErrors([]);
      onPublish?.(data);
      setPhase("success");
    } else {
      setCurrentStep(s => s + 1);
    }
  };
  const back = () => { if (currentStep === 0) onBack(); else setCurrentStep(s => s - 1); };
  const jumpTo = (i: number) => { if (i <= currentStep) setCurrentStep(i); };

  if (phase === "success") return <QrSuccessScreen data={data} onDone={onBack} />;

  const stepComponents = [
    <StepQrSetup key="setup" data={data} setData={setData} />,
    <StepQrCollect key="collect" data={data} setData={setData} />,
    <StepQrStandee key="standee" data={data} setData={setData} />,
    <StepQrRules key="rules" data={data} setData={setData} />,
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <QrStepper steps={steps} currentStep={currentStep} onJump={jumpTo} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* form column */}
        <div style={{ width: 480, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
            {errors.length > 0 && (
              <div style={{ background: C.redBg, border: `1px solid ${C.redMid}`, borderRadius: radius.md, padding: "12px 14px", marginBottom: 18 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: C.red, margin: "0 0 6px" }}>Fix these before publishing:</p>
                {errors.map((e, i) => (
                  <p key={i} style={{ fontSize: 12.5, color: C.red, margin: "2px 0", display: "flex", gap: 6 }}>
                    • {e.message}
                    <button onClick={() => jumpTo(e.step)} style={{ background: "none", border: "none", padding: 0, color: C.red, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>
                      Step {e.step + 1}
                    </button>
                  </p>
                ))}
              </div>
            )}
            {stepComponents[currentStep]}
          </div>
          {/* footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, background: C.white, flexShrink: 0 }}>
            <Btn variant="ghost" onClick={back}>{currentStep === 0 ? "Cancel" : "Back"}</Btn>
            {onSaveDraft && (
              <button onClick={() => canSaveDraft && onSaveDraft(data, currentStep)} disabled={!canSaveDraft}
                title={canSaveDraft ? undefined : "Name the QR first to save a draft"}
                style={{ marginLeft: "auto", padding: "9px 18px", background: canSaveDraft ? C.white : C.bg, color: canSaveDraft ? C.blue : C.textFaint, border: `1.5px solid ${canSaveDraft ? C.blueMid : C.border}`, borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: canSaveDraft ? "pointer" : "not-allowed" }}>
                Save as Draft
              </button>
            )}
            <div style={{ marginLeft: onSaveDraft ? 0 : "auto" }}>
              <Btn variant="primary" onClick={advance}>
                {currentStep === totalSteps - 1 ? "Publish QR" : "Continue →"}
              </Btn>
            </div>
          </div>
        </div>
        {/* preview column */}
        <QrPreviewPane data={data} device={device} onDeviceChange={setDevice} />
      </div>
    </div>
  );
}
