"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { C } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { QrData } from "./qr-wizard-steps";
import { upiString, genQrRef } from "./qr-mock-data";
import { qrMatrix } from "./qr-encoder";

// ── Real, scannable QR rendered as crisp SVG ──────────────────────────────────
function QrSvg({ text, size, logoLetter, logoColor }: {
  text: string; size: number; logoLetter?: string; logoColor?: string;
}) {
  const matrix = useMemo(() => { try { return qrMatrix(text); } catch { return null; } }, [text]);
  if (!matrix) return <div style={{ width: size, height: size, background: "#fff", borderRadius: 8 }} />;
  const n = matrix.length, quiet = 3, dim = n + quiet * 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (matrix[y][x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  const logoSize = dim * 0.26, logoXY = (dim - logoSize) / 2;
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} shapeRendering="crispEdges" style={{ display: "block", borderRadius: 6 }}>
      <rect width={dim} height={dim} fill="#fff" />
      <path d={d} fill="#0f172a" />
      {logoLetter && (
        <>
          <rect x={logoXY} y={logoXY} width={logoSize} height={logoSize} rx={logoSize * 0.22} fill="#fff" />
          <rect x={logoXY + logoSize * 0.1} y={logoXY + logoSize * 0.1} width={logoSize * 0.8} height={logoSize * 0.8} rx={logoSize * 0.18} fill={logoColor || C.blue} />
          <text x={dim / 2} y={dim / 2} dominantBaseline="central" textAnchor="middle" fontSize={logoSize * 0.48} fontWeight={800} fill="#fff" fontFamily="var(--font-inter, 'Inter', sans-serif)">{logoLetter}</text>
        </>
      )}
    </svg>
  );
}

function amountLabel(data: QrData): string {
  if (data.amountMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Set an amount";
  }
  return "Enter any amount";
}
// reusable standee encodes amount only when fixed; any-amount stays open
function standeeUpi(data: QrData): string {
  const amount = data.amountMode === "fixed" ? data.fixedAmount : undefined;
  return upiString({ vpa: data.vpa, name: data.merchantName, amount, ref: data.amountMode === "fixed" ? genQrRef() : undefined });
}

// ══════════════════════════════════════════════════════════════════════════════
// STANDEE — printed card (reusable). Ticket frame now has real side-notches,
// a dashed tear-line, and a stub — no more floating dots.
// ══════════════════════════════════════════════════════════════════════════════
export function Standee({ data, surface = "#e9ecf3" }: { data: QrData; surface?: string }) {
  const dark = data.standeeTheme === "dark";
  const cardBg = dark ? "#0f172a" : "#ffffff";
  const text = dark ? "#f8fafc" : C.text;
  const sub = dark ? "#94a3b8" : C.textMuted;
  const dash = dark ? "#334155" : "#cbd2e0";
  const ticket = data.frameStyle === "ticket";
  const topRadius = data.frameStyle === "sharp" ? 3 : 18;
  const items = (data.amountMode === "any" && data.priceListEnabled) ? data.priceList.filter(i => i.label) : [];

  const body = (
    <div style={{ background: cardBg, padding: "24px 24px 22px", display: "flex", flexDirection: "column", alignItems: "center",
      borderTop: `5px solid ${data.brandColor}`, borderRadius: ticket ? `${topRadius}px ${topRadius}px 0 0` : topRadius }}>
      {data.showLogo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: data.brandColor, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>{data.logoLetter || "E"}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{data.merchantName}</span>
        </div>
      ) : <span style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 10 }}>{data.merchantName}</span>}

      <p style={{ fontSize: 19, fontWeight: 800, color: text, margin: "0 0 14px", letterSpacing: "-0.01em" }}>{data.headline || "Scan & Pay"}</p>

      <div style={{ background: "#fff", padding: 12, borderRadius: 14 }}>
        <QrSvg text={standeeUpi(data)} size={184} logoLetter={data.showLogo ? (data.logoLetter || "E") : undefined} logoColor={data.brandColor} />
      </div>

      <div style={{ marginTop: 13, fontSize: 15, fontWeight: 700, color: data.brandColor }}>{amountLabel(data)}</div>

      {items.length > 0 && (
        <div style={{ width: "100%", marginTop: 12, borderTop: `1px dashed ${dash}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {items.slice(0, 6).map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ color: sub }}>{i.label}</span><span style={{ fontWeight: 600, color: text }}>₹{i.amount || "0"}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "flex", gap: 3 }}>
          {["#5f259f", "#00baf2", "#2da94f", "#ea4335"].map(c => <span key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />)}
        </span>
        <span style={{ fontSize: 10.5, color: sub, letterSpacing: "0.02em" }}>Works on every UPI app</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 300, filter: "drop-shadow(0 16px 30px rgba(15,23,42,0.22))" }}>
        {body}
        {ticket && (
          <>
            <div style={{ position: "relative", height: 0 }}>
              <div style={{ position: "absolute", top: -11, left: -11, width: 22, height: 22, borderRadius: "50%", background: surface }} />
              <div style={{ position: "absolute", top: -11, right: -11, width: 22, height: 22, borderRadius: "50%", background: surface }} />
              <div style={{ position: "absolute", top: -1, left: 14, right: 14, borderTop: `2px dashed ${dash}` }} />
            </div>
            <div style={{ background: cardBg, borderRadius: `0 0 ${topRadius}px ${topRadius}px`, padding: "15px 24px 17px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: text, letterSpacing: "0.04em" }}>{data.merchantName}</span>
              <span style={{ fontSize: 10, color: sub, fontFamily: "monospace" }}>pa: {data.vpa || "your-upi-id"}</span>
            </div>
          </>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="qr" size={13} /> Real scannable code — point any UPI app at it
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLING SCREEN — one-time / per-bill. Fresh code per sale + live countdown.
// ══════════════════════════════════════════════════════════════════════════════
export function BillingScreen({ data }: { data: QrData }) {
  const total = Math.max(1, parseInt(data.timerMinutes || "15")) * 60;
  const [amount, setAmount] = useState("249");
  const [secs, setSecs] = useState(total);
  const [bill, setBill] = useState(1);
  const [ref, setRef] = useState(() => genQrRef());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setSecs(total); }, [total]);
  useEffect(() => {
    timer.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const expired = secs === 0;
  const next = () => { setBill(b => b + 1); setRef(genQrRef()); setSecs(total); };
  const text = upiString({ vpa: data.vpa, name: data.merchantName, amount, ref });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 286, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: "0 16px 30px rgba(15,23,42,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: C.text }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: data.brandColor, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 11 }}>{data.logoLetter || "E"}</span>
            {data.label || "Counter"}
          </span>
          <span style={{ fontSize: 11, color: C.textFaint, fontFamily: "monospace" }}>Bill #{ref}</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: C.text }}>₹</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
            style={{ width: 120, fontSize: 30, fontWeight: 800, border: "none", borderBottom: `2px solid ${C.border}`, background: "none", color: C.text, outline: "none", fontFamily: "inherit", padding: "0 0 2px" }} />
          <span style={{ fontSize: 11, color: C.textFaint, marginLeft: "auto" }}>cashier sets</span>
        </div>

        <div style={{ background: "#f7f8fa", border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: 14, display: "flex", justifyContent: "center", opacity: expired ? 0.25 : 1, transition: "opacity 0.2s" }}>
          <QrSvg text={text} size={150} logoLetter={data.showLogo ? (data.logoLetter || "E") : undefined} logoColor={data.brandColor} />
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: expired ? C.redBg : C.blueLight, border: `1px solid ${expired ? C.redMid : C.blueMid}`, borderRadius: 10, padding: 9 }}>
          <Icon name="qr" size={15} color={expired ? C.red : C.blue} />
          <span style={{ fontSize: 13, color: C.textSecondary }}>{expired ? "Expired —" : "Valid for"}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: secs <= 60 && !expired ? C.red : expired ? C.red : C.blue, fontVariantNumeric: "tabular-nums" }}>{expired ? "regenerate" : fmt(secs)}</span>
        </div>
        <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", margin: "9px 0 0", lineHeight: 1.5 }}>One-time code — closes on payment or when the timer runs out</p>

        <button onClick={next} style={{ marginTop: 13, width: "100%", padding: 12, background: data.brandColor, color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Icon name="copy" size={15} color="#fff" /> Generate next payment
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16 }}>Fresh code each sale — try the timer & “next”.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER SCAN — the phone-side flow (scan → pay → done). No menu step.
// ══════════════════════════════════════════════════════════════════════════════
type Phase = "scan" | "pay" | "done";
export function CustomerScan({ data }: { data: QrData }) {
  const [phase, setPhase] = useState<Phase>("scan");
  const [typed, setTyped] = useState("");
  const [pin, setPin] = useState(0);
  useEffect(() => { setPhase("scan"); setTyped(""); setPin(0); }, [data.amountMode, data.vpa, data.fixedAmount, data.usage]);

  const payAmount = (): number => {
    if (data.usage === "onetime") return 249;
    if (data.amountMode === "fixed") return parseFloat(data.fixedAmount || "0");
    return parseFloat(typed || "0");
  };
  const accent = data.brandColor;
  const typeable = data.usage === "reusable" && data.amountMode === "any";

  const runPin = () => { let i = 0; const t = setInterval(() => { i++; setPin(i); if (i >= 4) { clearInterval(t); setTimeout(() => setPhase("done"), 250); } }, 160); };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 264, background: "#0e0f12", borderRadius: 34, padding: 9, boxShadow: "0 28px 56px -28px rgba(0,0,0,0.55)", border: "2px solid #2a2c32" }}>
        <div style={{ width: 96, height: 18, background: "#0e0f12", borderRadius: "0 0 12px 12px", margin: "0 auto" }} />
        <div style={{ background: C.bg, borderRadius: 26, height: 462, marginTop: -18, paddingTop: 26, overflow: "hidden", position: "relative" }}>
          {phase === "scan" && (
            <ScreenWrap appLabel="Camera · Scan QR">
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, textAlign: "center", margin: "0 0 4px" }}>Scan to pay</p>
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", margin: "0 0 16px" }}>{data.merchantName}</p>
              <div style={{ alignSelf: "center", background: "#fff", padding: 11, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <QrSvg text={standeeUpi(data)} size={150} logoLetter={data.showLogo ? (data.logoLetter || "E") : undefined} logoColor={accent} />
              </div>
              <PhoneBtn accent={accent} onClick={() => setPhase("pay")}>Open in UPI app ↗</PhoneBtn>
            </ScreenWrap>
          )}
          {phase === "pay" && (
            <ScreenWrap appLabel="PhonePe · Confirm payment">
              <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: accent, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>{data.logoLetter || "E"}</div>
                  <div><div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{data.merchantName}</div><div style={{ fontSize: 10.5, color: C.textFaint }}>{data.vpa}</div></div>
                </div>
                <div style={{ textAlign: "center", padding: "16px 0 6px" }}>
                  {typeable ? (
                    <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>₹<input value={typed} onChange={e => setTyped(e.target.value)} type="number" placeholder="0" style={{ width: 120, textAlign: "center", fontSize: 30, fontWeight: 800, border: "none", borderBottom: `2px solid ${accent}`, background: "none", color: C.text, outline: "none", fontFamily: "inherit" }} /></div>
                  ) : <div style={{ fontSize: 34, fontWeight: 800, color: C.text }}>₹{payAmount().toLocaleString("en-IN")}</div>}
                </div>
              </div>
              <div style={{ marginTop: "auto" }}>
                <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", margin: "0 0 8px" }}>{pin === 0 ? "Enter UPI PIN to pay" : "Verifying…"}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                  {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${i < pin ? accent : C.textFaint}`, background: i < pin ? accent : "transparent" }} />)}
                </div>
                <PhoneBtn accent={accent} disabled={typeable && !(parseFloat(typed) > 0)} onClick={runPin}>Pay ₹{payAmount() > 0 ? payAmount().toLocaleString("en-IN") : ""}</PhoneBtn>
              </div>
            </ScreenWrap>
          )}
          {phase === "done" && (
            <ScreenWrap appLabel="Payment receipt">
              <div style={{ margin: "30px auto 16px", width: 78, height: 78, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center" }}><Icon name="checkCircle" size={40} color="#fff" /></div>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.text, textAlign: "center", margin: 0 }}>Payment Successful</p>
              <p style={{ fontSize: 12.5, color: C.textMuted, textAlign: "center", marginTop: 6 }}>₹{payAmount().toLocaleString("en-IN")} paid to {data.merchantName}</p>
              <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", marginTop: 12, padding: "0 14px", lineHeight: 1.5 }}>This success screen is shown by the customer's own UPI app — not the merchant.</p>
              <PhoneBtn accent={accent} ghost onClick={() => { setPhase("scan"); setTyped(""); setPin(0); }}>↺ Run the flow again</PhoneBtn>
            </ScreenWrap>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16 }}>This is what your customer sees — try it.</p>
    </div>
  );
}

function ScreenWrap({ appLabel, children }: { appLabel: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: "22px 18px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textFaint, textAlign: "center", marginBottom: 14 }}>{appLabel}</div>
      {children}
    </div>
  );
}
function PhoneBtn({ children, onClick, accent, disabled, ghost }: { children: React.ReactNode; onClick: () => void; accent: string; disabled?: boolean; ghost?: boolean }) {
  return (
    <button onClick={() => !disabled && onClick()} disabled={disabled}
      style={{ marginTop: ghost ? "auto" : 14, width: "100%", padding: 13, borderRadius: 12, border: ghost ? `1.5px solid ${C.border}` : "none", background: ghost ? "transparent" : accent, color: ghost ? C.textMuted : "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

// ── exported preview switch ───────────────────────────────────────────────────
export type PreviewDevice = "standee" | "billing" | "customer";
export function QrPreview({ data, device }: { data: QrData; device: PreviewDevice }) {
  if (device === "customer") return <CustomerScan data={data} />;
  if (device === "billing") return <BillingScreen data={data} />;
  return <Standee data={data} />;
}
