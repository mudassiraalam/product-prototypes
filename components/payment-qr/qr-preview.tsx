"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { C } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { QrData, validityMinutes } from "./qr-wizard-steps";
import { upiString, genQrRef } from "./qr-mock-data";
import { qrMatrix } from "./qr-encoder";

// ──────────────────────────────────────────────────────────────────────────────
// Standee layout per NPCI/UPI/OC-100B addendum:
//   BHIM|UPI lockup at one end, partner (+ optional merchant name) at the other,
//   never adjacent · QR ≥60% height on a white tile with quiet zone · issuance
//   date MM/YYYY on the RIGHT of the QR (mandatory) · "UPI ID: <vpa>" line ·
//   "SCAN & PAY WITH ANY UPI APP" strip · brand-coloured card → reverse (white)
//   BHIM|UPI logo · no custom messages/images → the amount is NEVER printed
//   (it rides inside the code as `am`).
// Centre logo (EnKash) is rendered only when toggled — flagged for NPCI
// approval per Annexure B, default off.
// Assets: /logos/bhim.svg · /logos/upi.svg · /logos/enkash.svg (partner).
// ──────────────────────────────────────────────────────────────────────────────

const REVERSE: React.CSSProperties = { filter: "brightness(0) invert(1)" };

function BhimUpiLockup({ reverse, height = 16 }: { reverse?: boolean; height?: number }) {
  const [upiOk, setUpiOk] = useState(true);
  const img = reverse ? REVERSE : undefined;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <img src="/logos/bhim.svg" alt="BHIM" style={{ height, display: "block", ...img }} />
      <span style={{ width: 1, height: height * 1.05, background: reverse ? "rgba(255,255,255,0.65)" : "#a8aeb8" }} />
      {upiOk ? (
        <img src="/logos/upi.svg" alt="UPI" style={{ height: height * 0.95, display: "block", ...img }} onError={() => setUpiOk(false)} />
      ) : (
        <span style={{ fontSize: height * 0.78, fontWeight: 800, letterSpacing: "0.06em", color: reverse ? "#fff" : "#6d6e71", fontStyle: "italic" }}>UPI</span>
      )}
    </span>
  );
}

function PartnerLogo({ reverse, height = 14 }: { reverse?: boolean; height?: number }) {
  return <img src="/logos/enkash.svg" alt="EnKash" style={{ height, display: "block", ...(reverse ? REVERSE : undefined) }} />;
}

// Issuance date — MM/YYYY on the right side of the QR. Mandatory per addendum.
const issuanceDate = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// ── Real, scannable QR rendered as crisp SVG ──────────────────────────────────
function QrSvg({ text, size }: { text: string; size: number }) {
  const matrix = useMemo(() => { try { return qrMatrix(text); } catch { return null; } }, [text]);
  if (!matrix) return <div style={{ width: size, height: size, background: "#fff", borderRadius: 6 }} />;
  const n = matrix.length, quiet = 3, dim = n + quiet * 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (matrix[y][x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} shapeRendering="crispEdges" style={{ display: "block", borderRadius: 6 }}>
      <rect width={dim} height={dim} fill="#fff" />
      <path d={d} fill="#0f172a" />
    </svg>
  );
}

// Stable preview reference: the published QR gets its real unique `tr` at
// creation — the preview only needs to demonstrate that the string carries one.
const PREVIEW_REF = "ENKPREVIEW";
function standeeUpi(data: QrData): string {
  const amount = data.amountMode === "fixed" ? data.fixedAmount : undefined;
  return upiString({ vpa: data.vpa, name: data.merchantName, amount, ref: PREVIEW_REF });
}

// QR tile: centred on the card; the issuance date floats in the right margin
// (absolute) so it never pushes the QR off-centre. Centre logo overlays only
// when toggled.
function QrTile({ text, size, centerLogo }: { text: string; size: number; centerLogo: boolean }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 8, position: "relative", border: "1px solid rgba(15,23,42,0.08)" }}>
        <QrSvg text={text} size={size} />
        {centerLogo && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: 8, background: "#fff", border: "1px solid rgba(15,23,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PartnerLogo height={11} />
          </div>
        )}
      </div>
      <span style={{ position: "absolute", right: -15, top: "50%", transform: "translateY(-50%)", fontSize: 8.5, writingMode: "vertical-rl", letterSpacing: "0.06em", color: "inherit", opacity: 0.75 }}>
        {issuanceDate()}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STANDEE — printed card (reusable), composed strictly per the addendum.
// ══════════════════════════════════════════════════════════════════════════════
export function Standee({ data }: { data: QrData }) {
  const brand = data.cardColorMode === "brand";
  const cardBg = brand ? data.brandColor : "#ffffff";
  const reverse = brand; // brand background → reverse logos, per addendum
  const text = reverse ? "#ffffff" : C.text;
  const sub = reverse ? "rgba(255,255,255,0.82)" : C.textMuted;
  const divider = reverse ? "rgba(255,255,255,0.5)" : "#cbd2e0";

  const partnerCluster = (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <PartnerLogo reverse={reverse} height={13} />
      {data.showMerchantName && (
        <>
          <span style={{ width: 1, height: 14, background: divider }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
            {data.merchantName}
          </span>
        </>
      )}
    </div>
  );
  const lockup = <BhimUpiLockup reverse={reverse} height={17} />;
  const bhimTop = data.layoutVariant === "bhimTop";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 300, filter: "drop-shadow(0 16px 30px rgba(15,23,42,0.22))" }}>
        <div style={{ background: cardBg, borderRadius: 18, overflow: "hidden", border: reverse ? "none" : `1px solid ${C.borderLight}` }}>
          <div style={{ padding: "18px 22px 0", display: "flex", flexDirection: "column", alignItems: "center", color: sub }}>
            {bhimTop ? lockup : partnerCluster}

            <div style={{ marginTop: 14, color: sub }}>
              <QrTile text={standeeUpi(data)} size={180} centerLogo={data.centerLogo} />
            </div>

            <div style={{ marginTop: 11, fontSize: 11.5, color: text, fontWeight: 600 }}>
              UPI ID: <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{data.vpa}</span>
            </div>

            <div style={{ margin: "13px 0 14px", paddingTop: 12, borderTop: `1px solid ${divider}`, width: "100%", display: "flex", justifyContent: "center" }}>
              {bhimTop ? partnerCluster : lockup}
            </div>
          </div>

          <div style={{ background: reverse ? "rgba(0,0,0,0.28)" : "#1f2937", color: "#fff", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", textAlign: "center", padding: "8px 6px" }}>
            SCAN &amp; PAY WITH ANY UPI APP
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="qr" size={13} /> Real scannable code — point any UPI app at it
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ONE-TIME COLLECT — the payer-facing collect screen (shown on a device or
// opened from a shared link). Composed per the addendum's Dynamic QR spec:
// QR block · BHIM|UPI lockup · "Merchant Name | UPI ID" line · "Scan & Pay
// with any UPI app" · partner (EnKash) logo. Issuance date + "Pay with Credit
// on UPI" callout: [VERIFY for on-screen dynamic QRs].
// Status-aware: live (countdown) · collected (closed after payment) · expired.
// ══════════════════════════════════════════════════════════════════════════════
// "perBill": an API-minted transaction QR. Each payment gets its own freshly
// minted code with the amount baked in by the merchant system, so this detail
// view shows a representative card: no amount, no countdown, no single ref.
export type CollectMode = "live" | "collected" | "expired" | "perBill";

function Monogram({ name, accent }: { name: string; accent: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "M";
  return (
    <span style={{ width: 34, height: 34, borderRadius: 9, background: accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, letterSpacing: "0.02em" }}>
      {initials}
    </span>
  );
}

export function OneTimeCollect({ data, mode = "live", showCaption = true }: { data: QrData; mode?: CollectMode; showCaption?: boolean }) {
  const totalSecs = validityMinutes(data) * 60;
  const [secs, setSecs] = useState(totalSecs);
  const [ref, setRef] = useState(() => genQrRef());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setSecs(totalSecs); }, [totalSecs]);
  useEffect(() => {
    if (mode !== "live" || !data.expiryEnabled) return;
    timer.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [mode, data.expiryEnabled]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
  };
  const localExpired = mode === "live" && data.expiryEnabled && secs === 0;
  const terminal = (mode !== "live" && mode !== "perBill") || localExpired;
  const regenerate = () => { setRef(genQrRef()); setSecs(totalSecs); };
  const amount = parseFloat(data.oneTimeAmount || "0");
  const accent = data.brandColor || "#1c5af4";
  const text = upiString({ vpa: data.vpa, name: data.merchantName, amount: data.oneTimeAmount, ref });

  // theme
  const dark = data.screenTheme === "dark";
  const cardBg = dark ? "#10182b" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.10)" : C.border;
  const tMain = dark ? "#f4f6fb" : C.text;
  const tSub = dark ? "rgba(244,246,251,0.62)" : C.textMuted;
  const tFaint = dark ? "rgba(244,246,251,0.45)" : C.textFaint;
  const panelBg = dark ? "rgba(255,255,255,0.05)" : "#f7f8fa";
  const panelBorder = dark ? "rgba(255,255,255,0.10)" : C.borderLight;

  const statusBlock = () => {
    if (mode === "perBill") return (
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 10, padding: 10 }}>
        <Icon name="refresh" size={14} color={String(tSub)} />
        <span style={{ fontSize: 12.5, color: tSub, textAlign: "center" }}>A fresh code is minted for every transaction</span>
      </div>
    );
    if (mode === "collected") return (
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 10, padding: 10 }}>
        <Icon name="checkCircle" size={16} color={C.green} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>Collected — closed after payment</span>
      </div>
    );
    if (mode === "expired" || localExpired) return (
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.redBg, border: `1px solid ${C.redMid}`, borderRadius: 10, padding: 10 }}>
        <Icon name="clock" size={15} color={C.red} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>Closed — no payment received</span>
      </div>
    );
    return (
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: dark ? "rgba(255,255,255,0.06)" : `${accent}14`, border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : accent + "44"}`, borderRadius: 10, padding: 9 }}>
        <Icon name="clock" size={15} color={dark ? "#fff" : accent} />
        {data.expiryEnabled ? (
          <>
            <span style={{ fontSize: 13, color: tSub }}>Valid for</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: secs <= 60 ? C.red : dark ? "#fff" : accent, fontVariantNumeric: "tabular-nums" }}>{fmt(secs)}</span>
          </>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "#fff" : accent }}>Awaiting payment</span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 292, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 18, padding: 18, boxShadow: "0 16px 30px rgba(15,23,42,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {data.showMerchantLogo && <Monogram name={data.merchantName} accent={accent} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: tMain, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.merchantName}</p>
            <p style={{ fontSize: 11.5, color: tSub, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.label || "One-time QR"}</p>
          </div>
          <span style={{ fontSize: 10.5, color: tFaint, fontFamily: "monospace", flexShrink: 0 }}>{mode === "perBill" ? "ref per txn" : "ref " + ref}</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
          {mode === "perBill" ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, color: tMain }}>Set per bill</span>
              <span style={{ fontSize: 11, color: tFaint, marginLeft: "auto" }}>amount baked in at mint time</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 28, fontWeight: 800, color: dark ? "#fff" : accent }}>₹{amount > 0 ? amount.toLocaleString("en-IN") : "—"}</span>
              <span style={{ fontSize: 11, color: tFaint, marginLeft: "auto" }}>pre-filled for the payer</span>
            </>
          )}
        </div>

        <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 9, opacity: terminal ? 0.3 : 1, transition: "opacity 0.2s" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 6 }}><QrSvg text={text} size={148} /></div>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: tSub, textAlign: "center" }}>
            {data.merchantName} | UPI ID: <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{data.vpa}</span>
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: tSub, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scan &amp; Pay with any UPI app</span>
        </div>

        {statusBlock()}
        {!terminal && mode !== "perBill" && (
          <p style={{ fontSize: 11, color: tFaint, textAlign: "center", margin: "9px 0 0", lineHeight: 1.5 }}>
            {data.expiryEnabled
              ? "Closes after one successful payment, or at expiry — whichever comes first"
              : "Closes after one successful payment"}
          </p>
        )}

        {localExpired && (
          <button onClick={regenerate} style={{ marginTop: 13, width: "100%", padding: 12, background: accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Icon name="refresh" size={15} color="#fff" /> Generate a fresh code
          </button>
        )}

        <div style={{ marginTop: 13, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
          <BhimUpiLockup reverse={dark} height={13} />
          <span style={{ width: 1, height: 13, background: dark ? "rgba(255,255,255,0.35)" : "#cbd2e0" }} />
          <PartnerLogo reverse={dark} height={11} />
        </div>
      </div>
      {mode === "live" && showCaption && (
        <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16 }}>{data.expiryEnabled ? "Amount & reference are encoded in the code — try the timer." : "Amount & reference are encoded in the code."}</p>
      )}
    </div>
  );
}

// ── exported preview switch ───────────────────────────────────────────────────
export type PreviewDevice = "standee" | "collect";
export function QrPreview({ data, device, collectMode }: { data: QrData; device: PreviewDevice; collectMode?: CollectMode }) {
  if (device === "collect") return <OneTimeCollect data={data} mode={collectMode} />;
  return <Standee data={data} />;
}
