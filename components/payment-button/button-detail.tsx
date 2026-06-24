"use client";
import { useState } from "react";
import { C, radius, shadow } from "@/components/payment-pages/tokens";
import { Icon } from "@/components/payment-pages/icons";
import { Btn, StatusBadge, Modal } from "@/components/payment-pages/primitives";
import { PaymentButton, txnsForButton, successRateForButton, embedSnippet, SETTLEMENT_ACCOUNT } from "./button-mock-data";
import { buttonToWizardData } from "./button-mappers";
import { MerchantSiteMock, ButtonCheckout } from "./button-preview";
import { RecordDrawer, DrawerRecord } from "@/components/payment-pages/record-drawer";
import { FieldRow, EmptyTab } from "@/components/payment-pages/page-detail";
import { SUBSCRIBERS, CHARGES, PLANS } from "@/components/subscriptions/mock-data";
import { SubscriberDetail } from "@/components/subscriptions/subscriber-detail";
import type { Subscriber } from "@/components/subscriptions/types";

// ── The embed snippet block — copy-to-clipboard, reused on the page and in the
//    "Get code" modal. THE artifact a merchant pastes into their own site. ──
function EmbedBlock({ id }: { id: string }) {
  const snippet = embedSnippet(id);
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } };
  return (
    <div style={{ background: C.navy, borderRadius: radius.md, overflow: "hidden", border: `1px solid ${C.navy}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Embed code</span>
        <button onClick={copy} style={{ fontSize: 11.5, fontWeight: 600, color: copied ? "#4ade80" : "#fff", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: radius.sm, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
          {copied ? "✓ Copied" : <><Icon name="copy" size={13} /> Copy</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.6, color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Courier New', monospace", overflowX: "auto", whiteSpace: "pre" }}>{snippet}</pre>
    </div>
  );
}

function SubscribersTab({ subscribers, onOpen }: {
  subscribers: Subscriber[];
  onOpen: (sub: Subscriber) => void;
}) {
  if (subscribers.length === 0) {
    return (
      <EmptyTab
        icon="receipt"
        title="No subscribers yet"
        body="When customers subscribe through this button, their subscription details appear here."
      />
    );
  }
  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Subscriber", "Plan", "Frequency", "Status", "Started"].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.map(sub => {
              const plan = PLANS.find(p => p.id === sub.planId);
              const capStatus = sub.status.charAt(0).toUpperCase() + sub.status.slice(1);
              return (
                <tr
                  key={sub.id}
                  onClick={() => onOpen(sub)}
                  style={{ borderTop: `1px solid ${C.borderLight}`, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, margin: "0 0 2px" }}>{sub.name}</p>
                    <p style={{ fontSize: 11, color: C.textFaint, margin: 0 }}>{sub.email}</p>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.textSecondary }}>{plan?.name ?? "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.textMuted, textTransform: "capitalize" }}>{plan?.frequency ?? "—"}</td>
                  <td style={{ padding: "13px 16px" }}><StatusBadge status={capStatus} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: C.textFaint, whiteSpace: "nowrap" }}>{sub.startDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.borderLight}` }}>
        <span style={{ fontSize: 12, color: C.textFaint }}>
          {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function ButtonDetailView({ button, onBack, onEdit, onToggleStatus }: {
  button: PaymentButton; onBack: () => void; onEdit: (b: PaymentButton) => void; onToggleStatus: (b: PaymentButton) => void;
}) {
  const data = buttonToWizardData(button);
  const viaApi = button.origin === "api";
  const amountDisplay = button.amountValue ? `₹${button.amountValue.toLocaleString("en-IN")}` : button.amount;
  const typeLabel = button.amountMode === "fixed" ? "Fixed amount" : "Customer decides";

  const txns = txnsForButton(button.id);
  const rate = successRateForButton(button.id);

  const buttonSubscribers = SUBSCRIBERS.filter(s => s.source.ref === button.id);

  const [idCopied, setIdCopied] = useState(false);
  const copyId = () => { try { navigator.clipboard.writeText(button.id); setIdCopied(true); setTimeout(() => setIdCopied(false), 1500); } catch { /* */ } };
  const [codeOpen, setCodeOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [record, setRecord] = useState<DrawerRecord | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [tab, setTab] = useState<"details" | "payments" | "subscribers" | "refunds" | "settlements">("details");

  const txnRecord = (t: (typeof txns)[number]): DrawerRecord => ({
    id: t.payId,
    amount: t.amount,
    status: t.status,
    date: t.time,
    source: { kind: "button", name: button.title, ref: button.reference },
    party: [{ label: "Customer", value: t.customer }],
    details: [{ label: "Payment ID", value: t.payId }, { label: "Method", value: t.method }, { label: "Time", value: t.time }],
  });

  const statusColor = button.status === "Active" ? C.green : button.status === "Draft" ? C.amber : C.textMuted;
  const TABS: { key: "details" | "payments" | "subscribers" | "refunds" | "settlements"; label: string }[] = [
    { key: "details",      label: "Button details" },
    { key: "payments",     label: "Payments" },
    ...(button.isRecurring ? [{ key: "subscribers" as const, label: "Subscribers" }] : []),
    { key: "refunds",      label: "Refunds" },
    { key: "settlements",  label: "Settlements" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
      <div style={{ padding: "22px 30px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ fontSize: 13, color: C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>‹ Back to all buttons</button>

        <div style={{ display: "flex", gap: 18, alignItems: "stretch", paddingBottom: 18 }}>
          <div style={{ width: 132, flexShrink: 0, background: statusColor + "14", borderRadius: radius.md, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "18px 10px" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{button.status}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{button.title}</h1>
                  <StatusBadge status={button.status} />
                  {viaApi && <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, background: C.bg, border: `1px solid ${C.border}`, borderRadius: radius.full, padding: "3px 10px", whiteSpace: "nowrap" }}>via API</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>Button ID</span>
                  <span style={{ fontSize: 12.5, fontFamily: "monospace", color: C.blue }}>{button.id}</span>
                  <button onClick={copyId} title="Copy button ID" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, display: "inline-flex", alignItems: "center" }}>
                    {idCopied ? <span style={{ color: C.green, fontSize: 13 }}>✓</span> : <Icon name="copy" size={13} />}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>Created on {button.created}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 2 }}>Amount</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{amountDisplay}</div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.borderLight}`, margin: "14px 0" }} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px 18px" }}>
              <FieldRow label="Reference" value={<span style={{ fontFamily: "monospace", color: C.text }}>{button.reference}</span>} />
              <FieldRow label="Settles to" value={SETTLEMENT_ACCOUNT} />
              <FieldRow label="Type" value={typeLabel} />
              <FieldRow label="Button label" value={`“${button.buttonLabel}”`} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Btn variant="secondary" size="sm" onClick={() => setCodeOpen(true)}><Icon name="redirect" size={14} /> Get code</Btn>
              <Btn variant="ghost" size="sm" onClick={copyId}><Icon name="copy" size={14} /> {idCopied ? "Copied!" : "Copy ID"}</Btn>
              {button.status !== "Draft" && (
                <Btn variant="ghost" size="sm" onClick={() => onToggleStatus(button)}>
                  {button.status === "Active" ? <><Icon name="pause" size={14} /> Deactivate</> : <><Icon name="play" size={14} /> Activate</>}
                </Btn>
              )}
              {viaApi
                ? <span style={{ fontSize: 12, color: C.textFaint, maxWidth: 420, lineHeight: 1.5 }}>Created via the buttons API — not editable here.</span>
                : <Btn variant="secondary" size="sm" onClick={() => onEdit(button)}><Icon name="edit" size={14} /> Edit button</Btn>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedSubscriber(null); }} style={{ background: "none", border: "none", padding: "0 2px 11px", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? C.blue : C.textMuted, borderBottom: `2px solid ${active ? C.blue : "transparent"}`, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t.label}
                {t.key === "payments" && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: active ? C.blueLight : C.bg, color: active ? C.blueDark : C.textMuted, borderRadius: radius.full, padding: "1px 8px" }}>
                    {button.payments.toLocaleString("en-IN")}
                  </span>
                )}
                {t.key === "subscribers" && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: active ? C.blueLight : C.bg, color: active ? C.blueDark : C.textMuted, borderRadius: radius.full, padding: "1px 8px" }}>
                    {buttonSubscribers.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: (tab === "subscribers" && selectedSubscriber) ? 0 : "24px 30px" }}>
        {tab === "details" && (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ background: "#e9ecf3", borderRadius: radius.xl, padding: "26px 24px", flexShrink: 0 }}>
              <MerchantSiteMock data={data} onPay={() => setCheckoutOpen(true)} />
            </div>
            <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: radius.lg, padding: "20px 22px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Button details</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 18 }}>
                  <FieldRow label="Type" value={typeLabel} />
                  <FieldRow label="Amount" value={amountDisplay} />
                  <FieldRow label="Settles to" value={SETTLEMENT_ACCOUNT} />
                  <FieldRow label="Reference" value={<span style={{ fontFamily: "monospace" }}>{button.reference}</span>} />
                  <FieldRow label="Payments" value={button.payments.toLocaleString("en-IN")} />
                  <FieldRow label="Collected" value={button.revenue} />
                  <FieldRow label="Success rate" value={rate === null ? "—" : `${rate}%`} />
                  <FieldRow label="Origin" value={viaApi ? "API" : "Dashboard"} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Add to your website</p>
                <EmbedBlock id={button.id} />
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.lg, overflow: "hidden", boxShadow: shadow.sm, maxWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Payments through this button</p>
              <span style={{ fontSize: 11.5, color: C.textFaint }}>matched by ref {button.reference}</span>
            </div>
            {txns.length === 0 && <p style={{ fontSize: 13, color: C.textFaint, margin: 0, padding: "18px" }}>No payments through this button yet.</p>}
            {txns.map((t, i) => (
              <div key={t.id} onClick={() => setRecord(txnRecord(t))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", borderBottom: i < txns.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafbfd"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 600 }}>{t.payId}</span>
                  <span style={{ fontSize: 11, color: C.textFaint }}>{t.customer} · {t.method}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 11.5, color: C.textMuted, whiteSpace: "nowrap" }}>{t.time}</span>
                  <span style={{ fontWeight: 700, color: C.text, minWidth: 64, textAlign: "right" }}>{t.amount}</span>
                  <StatusBadge status={t.status} />
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "subscribers" && (
          selectedSubscriber ? (
            <SubscriberDetail
              subscriber={selectedSubscriber}
              plan={PLANS.find(p => p.id === selectedSubscriber.planId)}
              charges={CHARGES[selectedSubscriber.id] ?? []}
              onBack={() => setSelectedSubscriber(null)}
            />
          ) : (
            <SubscribersTab subscribers={buttonSubscribers} onOpen={setSelectedSubscriber} />
          )
        )}

        {tab === "refunds" && <EmptyTab icon="refresh" title="No refunds yet" body="Refunds raised against payments through this button will appear here." />}
        {tab === "settlements" && <EmptyTab icon="receipt" title="No settlements yet" body={`Once payments settle to ${SETTLEMENT_ACCOUNT}, settlement records show up here.`} />}
      </div>

      {codeOpen && (
        <Modal title="Embed this button" subtitle="Paste this snippet where you want the button to appear on your site." onClose={() => setCodeOpen(false)} width={520}>
          <EmbedBlock id={button.id} />
          <p style={{ fontSize: 12, color: C.textFaint, margin: "14px 0 0", lineHeight: 1.55 }}>
            The button renders wherever the snippet sits. Clicking it opens the EnKash checkout for this button.
          </p>
        </Modal>
      )}
      {checkoutOpen && <ButtonCheckout data={data} onClose={() => setCheckoutOpen(false)} />}
      {record && <RecordDrawer record={record} onClose={() => setRecord(null)} />}
    </div>
  );
}
