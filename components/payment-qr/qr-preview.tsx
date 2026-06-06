"use client";
import { useMemo, useState, useEffect } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { QrData } from "./qr-wizard-steps";
import { upiString, genQrRef } from "./qr-mock-data";
import { qrMatrix } from "./qr-encoder";

// ──────────────────────────────────────────────────────────────────────────────
// Real, scannable QR rendered as SVG from the vendored encoder. A centre logo can
// be overlaid because we encode at HIGH error-correction.
// ──────────────────────────────────────────────────────────────────────────────
function QrSvg({
  text, size, fg = "#111827", bg = "#ffffff", logoLetter, logoColor,
}: {
  text: string; size: number; fg?: string; bg?: string; logoLetter?: string; logoColor?: string;
}) {
  const matrix = useMemo(() => {
    try { return qrMatrix(text); } catch { return null; }
  }, [text]);

  if (!matrix) return <div style={{ width: size, height: size, background: bg, borderRadius: 8 }} />;

  const n = matrix.length;
  const quiet = 3;                 // quiet-zone modules around the code
  const dim = n + quiet * 2;
  const cell = 1;                  // module size in viewBox units

  // build a single path string of dark modules (cheap, crisp)
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) {
        const px = (x + quiet) * cell, py = (y + quiet) * cell;
        d += `M${px} ${py}h${cell}v${cell}h-${cell}z`;
      }
    }
  }

  const logoSize = dim * 0.26;
  const logoXY = (dim - logoSize) / 2;

  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} shapeRendering="crispEdges"
      style={{ display: "block", borderRadius: 6 }}>
      <rect width={dim} height={dim} fill={bg} />
      <path d={d} fill={fg} />
      {logoLetter && (
        <>
          <rect x={logoXY} y={logoXY} width={logoSize} height={logoSize} rx={logoSize * 0.22}
            fill={bg} stroke={bg} strokeWidth={1.5} />
          <rect x={logoXY + logoSize * 0.08} y={logoXY + logoSize * 0.08}
            width={logoSize * 0.84} height={logoSize * 0.84} rx={logoSize * 0.18} fill={logoColor || C.blue} />
          <text x={dim / 2} y={dim / 2} dominantBaseline="central" textAnchor="middle"
            fontSize={logoSize * 0.5} fontWeight={800} fill="#fff"
            fontFamily="var(--font-inter, 'Inter', sans-serif)">{logoLetter}</text>
        </>
      )}
    </svg>
  );
}

// ── amount summary line shown on the standee ──────────────────────────────────
function amountLabel(data: QrData): string {
  if (data.priceMode === "fixed") {
    const n = parseFloat(data.fixedAmount || "0");
    return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Set an amount";
  }
  if (data.priceMode === "any") return "Enter any amount";
  return "Choose an item";
}

// what the standee QR encodes: fixed bakes the amount; any/menu encode VPA only
function standeeUpi(data: QrData): string {
  const amount = data.priceMode === "fixed" ? data.fixedAmount : undefined;
  return upiString({
    vpa: data.vpa, name: data.merchantName, amount,
    ref: data.priceMode === "fixed" ? genQrRef() : undefined,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STANDEE — the printable card that stands on a counter. This is the QR product's
// signature surface (a page builder previews a webpage; a QR previews this).
// ══════════════════════════════════════════════════════════════════════════════
export function Standee({ data }: { data: QrData }) {
  const dark = data.standeeTheme === "dark";
  const cardBg = dark ? "#0f172a" : "#ffffff";
  const text = dark ? "#f8fafc" : C.text;
  const sub = dark ? "#94a3b8" : C.textMuted;
  const frameRadius = data.frameStyle === "sharp" ? 2 : data.frameStyle === "ticket" ? 14 : 20;
  const ticket = data.frameStyle === "ticket";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* the card */}
      <div style={{ position: "relative", width: 300 }}>
        {ticket && <Perforation side="top" bg={C.bg} />}
        <div style={{
          background: cardBg, borderRadius: frameRadius, padding: "26px 24px 22px",
          boxShadow: "0 18px 40px -20px rgba(15,23,42,0.45)", border: dark ? "none" : `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", alignItems: "center",
          borderTop: `5px solid ${data.brandColor}`,
        }}>
          {/* brand row */}
          {data.showLogo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: data.brandColor, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>
                {data.logoLetter || "E"}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{data.merchantName}</span>
            </div>
          )}
          {!data.showLogo && (
            <span style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 10 }}>{data.merchantName}</span>
          )}

          <p style={{ fontSize: 19, fontWeight: 800, color: text, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
            {data.headline || "Scan & Pay"}
          </p>

          <div style={{ background: "#fff", padding: 12, borderRadius: 14, border: `1px solid ${dark ? "#1e293b" : C.border}` }}>
            <QrSvg text={standeeUpi(data)} size={188}
              logoLetter={data.showLogo ? (data.logoLetter || "E") : undefined} logoColor={data.brandColor} />
          </div>

          <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700, color: data.brandColor }}>
            {amountLabel(data)}
          </div>

          {/* menu list on the standee */}
          {data.priceMode === "menu" && data.items.some(i => i.label) && (
            <div style={{ width: "100%", marginTop: 12, borderTop: `1px dashed ${dark ? "#1e293b" : C.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {data.items.filter(i => i.label).slice(0, 5).map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: sub }}>
                  <span>{i.label}</span>
                  <span style={{ fontWeight: 600, color: text }}>₹{i.amount || "0"}</span>
                </div>
              ))}
            </div>
          )}

          {/* UPI apps row */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "flex", gap: 3 }}>
              {["#5f259f", "#00baf2", "#2da94f", "#ea4335"].map(c => (
                <span key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
              ))}
            </span>
            <span style={{ fontSize: 10.5, color: sub, letterSpacing: "0.02em" }}>Works on every UPI app</span>
          </div>
        </div>
        {ticket && <Perforation side="bottom" bg={C.bg} />}
      </div>

      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="qr" size={13} /> Real scannable code — point any UPI app at it
      </p>
    </div>
  );
}

function Perforation({ side, bg }: { side: "top" | "bottom"; bg: string }) {
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, [side]: -6, height: 12, display: "flex",
      justifyContent: "space-between", padding: "0 8px", zIndex: 2, pointerEvents: "none",
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: bg }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER SCAN — the phone-side flow: scan → (pick item) → UPI pay sheet → done.
// This is what makes it unmistakably a QR tool rather than a page.
// ══════════════════════════════════════════════════════════════════════════════
type Phase = "scan" | "pick" | "pay" | "done";

export function CustomerScan({ data }: { data: QrData }) {
  const [phase, setPhase] = useState<Phase>("scan");
  const [picked, setPicked] = useState<{ label: string; amount: string } | null>(null);
  const [typed, setTyped] = useState("");
  const [pin, setPin] = useState(0);

  // reset the walkthrough whenever the merchant changes the core config
  useEffect(() => { setPhase("scan"); setPicked(null); setTyped(""); setPin(0); },
    [data.priceMode, data.vpa, data.fixedAmount, data.merchantName]);

  const payAmount = (): number => {
    if (data.priceMode === "fixed") return parseFloat(data.fixedAmount || "0");
    if (data.priceMode === "menu") return parseFloat(picked?.amount || "0");
    return parseFloat(typed || "0");
  };

  const afterScan = () => {
    if (data.priceMode === "menu") setPhase("pick");
    else setPhase("pay");
  };

  const runPin = () => {
    let i = 0;
    const t = setInterval(() => {
      i++; setPin(i);
      if (i >= 4) { clearInterval(t); setTimeout(() => setPhase("done"), 250); }
    }, 160);
  };

  const accent = data.brandColor;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 264, background: "#0e0f12", borderRadius: 34, padding: 9, boxShadow: "0 28px 56px -28px rgba(0,0,0,0.55)", border: "2px solid #2a2c32" }}>
        <div style={{ width: 96, height: 18, background: "#0e0f12", borderRadius: "0 0 12px 12px", margin: "0 auto" }} />
        <div style={{ background: C.bg, borderRadius: 26, height: 472, marginTop: -18, paddingTop: 26, overflow: "hidden", position: "relative" }}>

          {/* SCAN */}
          {phase === "scan" && (
            <ScreenWrap appLabel="Camera · Scan QR">
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, textAlign: "center", margin: "0 0 4px" }}>Scan to pay</p>
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", margin: "0 0 16px" }}>{data.merchantName}</p>
              <div style={{ alignSelf: "center", background: "#fff", padding: 11, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <QrSvg text={standeeUpi(data)} size={150}
                  logoLetter={data.showLogo ? (data.logoLetter || "E") : undefined} logoColor={accent} />
              </div>
              <PhoneBtn accent={accent} onClick={afterScan}>Open in UPI app ↗</PhoneBtn>
            </ScreenWrap>
          )}

          {/* PICK (menu) */}
          {phase === "pick" && (
            <ScreenWrap appLabel="Choose an item">
              <p style={{ fontSize: 16, fontWeight: 800, color: C.text, textAlign: "center", margin: "0 0 12px" }}>What are you paying for?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                {data.items.filter(i => i.label && parseFloat(i.amount || "0") > 0).map(i => (
                  <button key={i.id} onClick={() => { setPicked({ label: i.label, amount: i.amount }); setPhase("pay"); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{i.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>₹{i.amount}</span>
                  </button>
                ))}
                {!data.items.some(i => i.label && parseFloat(i.amount || "0") > 0) && (
                  <p style={{ fontSize: 12.5, color: C.textFaint, textAlign: "center", marginTop: 20 }}>Add menu items in Step 1 to see them here.</p>
                )}
              </div>
            </ScreenWrap>
          )}

          {/* PAY SHEET */}
          {phase === "pay" && (
            <ScreenWrap appLabel="PhonePe · Confirm payment">
              <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: accent, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>{data.logoLetter || "E"}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{data.merchantName}</div>
                    <div style={{ fontSize: 10.5, color: C.textFaint }}>{data.vpa}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", padding: "16px 0 6px" }}>
                  {data.priceMode === "any" ? (
                    <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>
                      ₹<input value={typed} onChange={e => setTyped(e.target.value)} type="number" placeholder="0"
                        style={{ width: 120, textAlign: "center", fontSize: 30, fontWeight: 800, border: "none", borderBottom: `2px solid ${accent}`, background: "none", color: C.text, outline: "none", fontFamily: "inherit" }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 34, fontWeight: 800, color: C.text }}>₹{payAmount().toLocaleString("en-IN")}</div>
                  )}
                  {picked && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{picked.label}</div>}
                </div>
              </div>
              <div style={{ marginTop: "auto" }}>
                <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", margin: "0 0 8px" }}>
                  {pin === 0 ? "Enter UPI PIN to pay" : "Verifying…"}
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${i < pin ? accent : C.textFaint}`, background: i < pin ? accent : "transparent" }} />
                  ))}
                </div>
                <PhoneBtn accent={accent} disabled={data.priceMode === "any" && !(parseFloat(typed) > 0)} onClick={runPin}>
                  Pay ₹{payAmount() > 0 ? payAmount().toLocaleString("en-IN") : ""}
                </PhoneBtn>
              </div>
            </ScreenWrap>
          )}

          {/* DONE */}
          {phase === "done" && (
            <ScreenWrap appLabel="Payment receipt">
              <div style={{ margin: "30px auto 16px", width: 78, height: 78, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center" }}>
                <Icon name="checkCircle" size={40} color="#fff" />
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.text, textAlign: "center", margin: 0 }}>Payment Successful</p>
              <p style={{ fontSize: 12.5, color: C.textMuted, textAlign: "center", marginTop: 6 }}>
                ₹{payAmount().toLocaleString("en-IN")} paid to {data.merchantName}
              </p>
              <p style={{ fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 14, padding: "0 10px", fontStyle: "italic" }}>
                "{data.successMessage || "Payment received — thank you!"}"
              </p>
              <PhoneBtn accent={accent} ghost onClick={() => { setPhase("scan"); setPicked(null); setTyped(""); setPin(0); }}>
                ↺ Run the flow again
              </PhoneBtn>
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

function PhoneBtn({ children, onClick, accent, disabled, ghost }: {
  children: React.ReactNode; onClick: () => void; accent: string; disabled?: boolean; ghost?: boolean;
}) {
  return (
    <button onClick={() => !disabled && onClick()} disabled={disabled}
      style={{
        marginTop: ghost ? "auto" : 14, width: "100%", padding: 13, borderRadius: 12, border: ghost ? `1.5px solid ${C.border}` : "none",
        background: ghost ? "transparent" : accent, color: ghost ? C.textMuted : "#fff",
        fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

// ── exported preview switch ───────────────────────────────────────────────────
export function QrPreview({ data, device }: { data: QrData; device: "standee" | "customer" }) {
  return device === "standee" ? <Standee data={data} /> : <CustomerScan data={data} />;
}
