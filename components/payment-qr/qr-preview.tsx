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
// ONE-TIME COLLECT — a single payment, amount baked in, validity-limited.
// Closes on payment or expiry. Shown on a screen / shared, never printed.
// ══════════════════════════════════════════════════════════════════════════════
export function OneTimeCollect({ data }: { data: QrData }) {
  const totalSecs = validityMinutes(data) * 60;
  const [secs, setSecs] = useState(totalSecs);
  const [ref, setRef] = useState(() => genQrRef());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setSecs(totalSecs); }, [totalSecs]);
  useEffect(() => {
    timer.current = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
  };
  const expired = secs === 0;
  const regenerate = () => { setRef(genQrRef()); setSecs(totalSecs); };
  const amount = parseFloat(data.oneTimeAmount || "0");
  const text = upiString({ vpa: data.vpa, name: data.merchantName, amount: data.oneTimeAmount, ref });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 286, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: "0 16px 30px rgba(15,23,42,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{data.label || "One-time QR"}</span>
          <span style={{ fontSize: 11, color: C.textFaint, fontFamily: "monospace" }}>ref {ref}</span>
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 12px" }}>{data.merchantName}</p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.text }}>₹{amount > 0 ? amount.toLocaleString("en-IN") : "—"}</span>
          <span style={{ fontSize: 11, color: C.textFaint, marginLeft: "auto" }}>pre-filled for the payer</span>
        </div>

        <div style={{ background: "#f7f8fa", border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 9, opacity: expired ? 0.25 : 1, transition: "opacity 0.2s" }}>
          <QrSvg text={text} size={150} />
          <span style={{ fontSize: 10.5, fontWeight: 600, color: C.textSecondary }}>
            UPI ID: <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{data.vpa}</span>
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: C.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scan &amp; Pay with any UPI app</span>
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: expired ? C.redBg : C.blueLight, border: `1px solid ${expired ? C.redMid : C.blueMid}`, borderRadius: 10, padding: 9 }}>
          <Icon name="clock" size={15} color={expired ? C.red : C.blue} />
          <span style={{ fontSize: 13, color: C.textSecondary }}>{expired ? "Expired" : "Valid for"}</span>
          {!expired && (
            <span style={{ fontSize: 15, fontWeight: 800, color: secs <= 60 ? C.red : C.blue, fontVariantNumeric: "tabular-nums" }}>{fmt(secs)}</span>
          )}
        </div>
        <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", margin: "9px 0 0", lineHeight: 1.5 }}>
          Closes after one successful payment, or at expiry — whichever comes first
        </p>

        {expired && (
          <button onClick={regenerate} style={{ marginTop: 13, width: "100%", padding: 12, background: C.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Icon name="refresh" size={15} color="#fff" /> Generate a fresh code
          </button>
        )}

        <div style={{ marginTop: 13, display: "flex", justifyContent: "center" }}>
          <BhimUpiLockup height={13} />
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: C.textFaint, marginTop: 16 }}>Amount &amp; reference are encoded in the code — try the timer.</p>
    </div>
  );
}

// ── exported preview switch ───────────────────────────────────────────────────
export type PreviewDevice = "standee" | "collect";
export function QrPreview({ data, device }: { data: QrData; device: PreviewDevice }) {
  if (device === "collect") return <OneTimeCollect data={data} />;
  return <Standee data={data} />;
}
