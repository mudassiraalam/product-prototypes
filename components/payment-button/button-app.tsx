"use client";
import { useState, useEffect, useRef } from "react";
import { TopNav, AppSidebar } from "@/components/payment-pages/layout";
import { Modal } from "@/components/payment-pages/primitives";
import { C, radius } from "@/components/payment-pages/tokens";
import { ButtonDashboard } from "./button-dashboard";
import { ButtonWizard } from "./button-wizard";
import { ButtonDetailView } from "./button-detail";
import { PaymentButton, INITIAL_BUTTONS, ButtonStatus } from "./button-mock-data";
import { ButtonData, DEFAULT_BUTTON } from "./button-wizard-steps";
import { buttonToWizardData, wizardDataToButton } from "./button-mappers";

type Screen = "dashboard" | "wizard" | "detail";

export function ButtonApp({ onNavigateProduct }: { onNavigateProduct: (key: string) => void }) {
  const [buttons, setButtons] = useState<PaymentButton[]>(INITIAL_BUTTONS);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selected, setSelected] = useState<PaymentButton | null>(null);

  const [editing, setEditing] = useState<PaymentButton | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [initialData, setInitialData] = useState<ButtonData>(DEFAULT_BUTTON);
  const [initialStep, setInitialStep] = useState(0);

  const [live, setLive] = useState<{ data: ButtonData; step: number; building: boolean }>({ data: DEFAULT_BUTTON, step: 0, building: false });
  const [snapshot, setSnapshot] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PaymentButton | null>(null);

  const beginSession = (b: PaymentButton | null) => {
    const data = b ? buttonToWizardData(b) : DEFAULT_BUTTON;
    setEditing(b); setInitialData(data); setInitialStep(b?.lastStep ?? 0);
    setLive({ data, step: b?.lastStep ?? 0, building: !!b });
    setSnapshot(JSON.stringify(data)); setSessionKey(k => k + 1); setScreen("wizard");
  };
  const startCreate = () => beginSession(null);
  // API-created buttons aren't editable — open the read-only detail instead.
  const startEdit = (b: PaymentButton) => { if (b.origin === "api") { setSelected(b); setScreen("detail"); return; } beginSession(b); };
  const exitToDashboard = () => { setEditing(null); setSelected(null); setLive({ data: DEFAULT_BUTTON, step: 0, building: false }); setSnapshot(""); setScreen("dashboard"); };

  const genId = () => "PB-ENK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const upsert = (b: PaymentButton) => setButtons(prev => { const i = prev.findIndex(x => x.id === b.id); if (i === -1) return [b, ...prev]; const c = prev.slice(); c[i] = b; return c; });
  const handleSaveDraft = (data: ButtonData, step: number) => { const id = editing?.id ?? genId(); upsert(wizardDataToButton(data, { id, status: "Draft", step, existing: editing })); exitToDashboard(); };
  const handlePublish = (data: ButtonData): string => { const id = editing?.id ?? genId(); upsert(wizardDataToButton(data, { id, status: "Active", step: 0, existing: editing })); return id; };

  // row actions
  const onView = (b: PaymentButton) => { if (b.status === "Draft") startEdit(b); else { setSelected(b); setScreen("detail"); } };
  const onToggleStatus = (b: PaymentButton) => { const next = { ...b, status: (b.status === "Active" ? "Inactive" : "Active") as ButtonStatus }; upsert(next); setSelected(s => (s && s.id === b.id ? next : s)); };
  const confirmDelete = () => { if (toDelete) { setButtons(prev => prev.filter(x => x.id !== toDelete.id)); if (selected?.id === toDelete.id) exitToDashboard(); } setToDelete(null); };

  const dirty = () => live.building && JSON.stringify(live.data) !== snapshot;
  const attemptLeave = () => { if (screen === "wizard" && dirty()) { setLeaveOpen(true); return; } exitToDashboard(); };
  const canDraftFromLeave = live.data.title.trim().length > 0;

  // URL sync (namespaced product=button)
  const suppressPush = useRef(false);
  const currentQuery = () => {
    if (screen === "wizard") return editing ? `?product=button&view=edit&id=${editing.id}` : `?product=button&view=create`;
    if (screen === "detail" && selected) return `?product=button&view=page&id=${selected.id}`;
    return `?product=button`;
  };
  const applyUrl = (search: string) => {
    const p = new URLSearchParams(search); const view = p.get("view"), id = p.get("id");
    suppressPush.current = true;
    if (view === "create") startCreate();
    else if (view === "edit" && id) { const b = buttons.find(x => x.id === id); b ? startEdit(b) : exitToDashboard(); }
    else if (view === "page" && id) { const b = buttons.find(x => x.id === id); if (b) { setSelected(b); setScreen("detail"); } else exitToDashboard(); }
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
    const onPop = () => { const p = new URLSearchParams(window.location.search); if (p.get("product") !== "button") { onNavigateProduct("payment-pages"); return; } applyUrl(window.location.search); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttons]);

  const onNav = (key: string) => { if (key !== "payment-button") onNavigateProduct(key); };

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopNav onHome={attemptLeave} breadcrumb={
        screen === "dashboard" ? [{ label: "Home", icon: "home" }, { label: "Payment Button" }]
        : screen === "wizard" ? [{ label: "Home", icon: "home" }, { label: "Payment Button" }, { label: editing ? "Edit" : "Create" }]
        : [{ label: "Home", icon: "home" }, { label: "Payment Button" }, { label: selected?.title ?? "Button" }]
      } />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {screen !== "wizard" && <AppSidebar active="payment-button" onNavigate={onNav} />}

        {screen === "dashboard" && (
          <ButtonDashboard buttons={buttons} onCreate={startCreate} onView={onView} onEdit={startEdit} onToggleStatus={onToggleStatus} onDelete={setToDelete} />
        )}
        {screen === "wizard" && (
          <ButtonWizard key={sessionKey} initialData={initialData} initialStep={initialStep} editing={!!editing}
            onBack={attemptLeave} onSaveDraft={handleSaveDraft} onPublish={handlePublish}
            onSyncState={(data, step, building) => setLive({ data, step, building })} />
        )}
        {screen === "detail" && selected && <ButtonDetailView button={selected} onBack={exitToDashboard} onEdit={startEdit} onToggleStatus={onToggleStatus} />}
      </div>

      {leaveOpen && (
        <Modal title="Leave button creation?" subtitle="You have unsaved changes." onClose={() => setLeaveOpen(false)} width={460}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>Save your progress as a draft and finish later, or discard your changes and leave.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { if (canDraftFromLeave) { handleSaveDraft(live.data, live.step); setLeaveOpen(false); } }} disabled={!canDraftFromLeave} title={canDraftFromLeave ? undefined : "Name the button first to save a draft"}
              style={{ width: "100%", padding: "11px", background: canDraftFromLeave ? C.blue : C.blueLight, color: canDraftFromLeave ? "#fff" : C.textFaint, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: canDraftFromLeave ? "pointer" : "not-allowed" }}>Save as draft</button>
            <button onClick={() => { setLeaveOpen(false); exitToDashboard(); }} style={{ width: "100%", padding: "11px", background: C.white, color: C.red, border: `1px solid ${C.redMid}`, borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Discard changes</button>
            <button onClick={() => setLeaveOpen(false)} style={{ width: "100%", padding: "11px", background: "transparent", color: C.textMuted, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete this button?" subtitle={toDelete.title} onClose={() => setToDelete(null)} width={440}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
            This removes “{toDelete.title}” from your dashboard. The embed snippet already on your site will stop working. This can't be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setToDelete(null)} style={{ padding: "10px 18px", background: C.white, color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmDelete} style={{ padding: "10px 18px", background: C.red, color: "#fff", border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>Delete button</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
