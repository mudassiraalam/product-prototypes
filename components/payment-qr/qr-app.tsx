"use client";
import { useState, useEffect, useRef } from "react";
import { TopNav, AppSidebar } from "@/components/payment-pages/layout";
import { Modal } from "@/components/payment-pages/primitives";
import { C, radius } from "@/components/payment-pages/tokens";
import { QrDashboard } from "./qr-dashboard";
import { QrWizard } from "./qr-wizard";
import { QrDetailView } from "./qr-detail";
import { QrCode, INITIAL_QRS, QrStatus, upiString, downloadQrPng } from "./qr-mock-data";
import { QrData, DEFAULT_QR } from "./qr-wizard-steps";
import { qrToWizardData, wizardDataToQr } from "./qr-mappers";

type Screen = "dashboard" | "wizard" | "detail";

const linkFor = (q: QrCode) => upiString({ vpa: q.vpa, name: q.merchantName, amount: q.amountMode === "fixed" && q.usage === "reusable" ? String(q.amount).replace(/[^\d.]/g, "") : undefined });

export function QrApp({ onNavigateProduct }: { onNavigateProduct: (key: string) => void }) {
  const [codes, setCodes] = useState<QrCode[]>(INITIAL_QRS);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selected, setSelected] = useState<QrCode | null>(null);

  const [editing, setEditing] = useState<QrCode | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [initialData, setInitialData] = useState<QrData>(DEFAULT_QR);
  const [initialStep, setInitialStep] = useState(0);

  const [live, setLive] = useState<{ data: QrData; step: number; building: boolean }>({ data: DEFAULT_QR, step: 0, building: false });
  const [snapshot, setSnapshot] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [toDelete, setToDelete] = useState<QrCode | null>(null);

  const beginSession = (qr: QrCode | null) => {
    const data = qr ? qrToWizardData(qr) : DEFAULT_QR;
    setEditing(qr); setInitialData(data); setInitialStep(qr?.lastStep ?? 0);
    setLive({ data, step: qr?.lastStep ?? 0, building: !!qr });
    setSnapshot(JSON.stringify(data)); setSessionKey(k => k + 1); setScreen("wizard");
  };
  const startCreate = () => beginSession(null);
  const startEdit = (qr: QrCode) => beginSession(qr);
  const exitToDashboard = () => { setEditing(null); setSelected(null); setLive({ data: DEFAULT_QR, step: 0, building: false }); setSnapshot(""); setScreen("dashboard"); };

  const genId = () => "QR-ENK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const upsert = (q: QrCode) => setCodes(prev => { const i = prev.findIndex(x => x.id === q.id); if (i === -1) return [q, ...prev]; const c = prev.slice(); c[i] = q; return c; });
  const commit = (data: QrData, step: number, status: QrStatus) => { const id = editing?.id ?? genId(); upsert(wizardDataToQr(data, { id, status, step, existing: editing })); };
  const handleSaveDraft = (data: QrData, step: number) => { commit(data, step, "Draft"); exitToDashboard(); };
  const handlePublish = (data: QrData) => { commit(data, 0, "Active"); };

  // row actions
  const onView = (qr: QrCode) => { if (qr.status === "Draft") startEdit(qr); else { setSelected(qr); setScreen("detail"); } };
  const onToggleStatus = (qr: QrCode) => upsert({ ...qr, status: qr.status === "Active" ? "Inactive" : "Active" });
  const onDownload = (qr: QrCode) => downloadQrPng(linkFor(qr), qr.label);
  const onCopy = (qr: QrCode) => { try { navigator.clipboard.writeText(linkFor(qr)); } catch { /* */ } };
  const confirmDelete = () => { if (toDelete) { setCodes(prev => prev.filter(x => x.id !== toDelete.id)); if (selected?.id === toDelete.id) exitToDashboard(); } setToDelete(null); };

  const dirty = () => live.building && JSON.stringify(live.data) !== snapshot;
  const attemptLeave = () => { if (screen === "wizard" && dirty()) { setLeaveOpen(true); return; } exitToDashboard(); };
  const canDraftFromLeave = live.data.label.trim().length > 0;

  // URL sync (namespaced product=qr)
  const suppressPush = useRef(false);
  const currentQuery = () => {
    if (screen === "wizard") return editing ? `?product=qr&view=edit&id=${editing.id}` : `?product=qr&view=create`;
    if (screen === "detail" && selected) return `?product=qr&view=page&id=${selected.id}`;
    return `?product=qr`;
  };
  const applyUrl = (search: string) => {
    const p = new URLSearchParams(search); const view = p.get("view"), id = p.get("id");
    suppressPush.current = true;
    if (view === "create") startCreate();
    else if (view === "edit" && id) { const q = codes.find(x => x.id === id); q ? startEdit(q) : exitToDashboard(); }
    else if (view === "page" && id) { const q = codes.find(x => x.id === id); if (q) { setSelected(q); setScreen("detail"); } else exitToDashboard(); }
    else exitToDashboard();
    requestAnimationFrame(() => { suppressPush.current = false; });
  };
  useEffect(() => { applyUrl(window.location.search); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (suppressPush.current) return;
    const qy = currentQuery();
    if (window.location.search !== qy) window.history.pushState({}, "", window.location.pathname + qy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, editing, selected]);
  useEffect(() => {
    const onPop = () => { const p = new URLSearchParams(window.location.search); if (p.get("product") !== "qr") { onNavigateProduct("payment-pages"); return; } applyUrl(window.location.search); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codes]);

  const onNav = (key: string) => { if (key !== "payment-qr") onNavigateProduct(key); };

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopNav onHome={attemptLeave} breadcrumb={
        screen === "dashboard" ? [{ label: "Home", icon: "home" }, { label: "Payment QR" }]
        : screen === "wizard" ? [{ label: "Home", icon: "home" }, { label: "Payment QR" }, { label: editing ? "Edit" : "Create" }]
        : [{ label: "Home", icon: "home" }, { label: "Payment QR" }, { label: selected?.label ?? "QR" }]
      } />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {screen !== "wizard" && <AppSidebar active="payment-qr" onNavigate={onNav} />}

        {screen === "dashboard" && (
          <QrDashboard codes={codes} onCreate={startCreate} onView={onView} onEdit={startEdit}
            onToggleStatus={onToggleStatus} onDownload={onDownload} onCopy={onCopy} onDelete={setToDelete} />
        )}
        {screen === "wizard" && (
          <QrWizard key={sessionKey} initialData={initialData} initialStep={initialStep} editing={!!editing}
            onBack={attemptLeave} onSaveDraft={handleSaveDraft} onPublish={handlePublish}
            onSyncState={(data, step, building) => setLive({ data, step, building })} />
        )}
        {screen === "detail" && selected && <QrDetailView qr={selected} onBack={exitToDashboard} onEdit={startEdit} />}
      </div>

      {leaveOpen && (
        <Modal title="Leave QR creation?" subtitle="You have unsaved changes." onClose={() => setLeaveOpen(false)} width={460}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>Save your progress as a draft and finish later, or discard your changes and leave.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { if (canDraftFromLeave) { handleSaveDraft(live.data, live.step); setLeaveOpen(false); } }} disabled={!canDraftFromLeave} title={canDraftFromLeave ? undefined : "Name the QR first to save a draft"}
              style={{ width: "100%", padding: "11px", background: canDraftFromLeave ? C.blue : C.blueLight, color: canDraftFromLeave ? "#fff" : C.textFaint, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: canDraftFromLeave ? "pointer" : "not-allowed" }}>Save as draft</button>
            <button onClick={() => { setLeaveOpen(false); exitToDashboard(); }} style={{ width: "100%", padding: "11px", background: C.white, color: C.red, border: `1px solid ${C.redMid}`, borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Discard changes</button>
            <button onClick={() => setLeaveOpen(false)} style={{ width: "100%", padding: "11px", background: "transparent", color: C.textMuted, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete this QR?" subtitle={toDelete.label} onClose={() => setToDelete(null)} width={440}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
            This removes “{toDelete.label}” from your dashboard. Any printed standee with this code will stop working. This can't be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setToDelete(null)} style={{ padding: "10px 18px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmDelete} style={{ padding: "10px 18px", background: C.red, color: "#fff", border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Delete QR</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
