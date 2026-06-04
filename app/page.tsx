"use client";
import { useState } from "react";
import { TopNav, AppSidebar } from "@/components/payment-pages/layout";
import { Dashboard } from "@/components/payment-pages/dashboard";
import { Wizard } from "@/components/payment-pages/wizard";
import { PageDetailView } from "@/components/payment-pages/page-detail";
import { Modal, Btn } from "@/components/payment-pages/primitives";
import { C, radius } from "@/components/payment-pages/tokens";
import { PaymentPage, INITIAL_PAGES, PageStatus } from "@/components/payment-pages/mock-data";
import { WizardData, DEFAULT_WIZARD } from "@/components/payment-pages/wizard-steps";
import { pageToWizardData, wizardDataToPage } from "@/components/payment-pages/page-mappers";

type Screen = "dashboard" | "wizard" | "detail";

export default function Home() {
  const [pages, setPages] = useState<PaymentPage[]>(INITIAL_PAGES);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedPage, setSelectedPage] = useState<PaymentPage | null>(null);

  // Wizard session
  const [editingPage, setEditingPage] = useState<PaymentPage | null>(null); // page being edited/resumed (null = new)
  const [sessionKey, setSessionKey] = useState(0);                          // bump → remount wizard fresh
  const [initialData, setInitialData] = useState<WizardData>(DEFAULT_WIZARD);
  const [initialStep, setInitialStep] = useState(0);

  // Live mirror of the wizard's working state (for the leave prompt)
  const [live, setLive] = useState<{ data: WizardData; step: number; building: boolean }>({
    data: DEFAULT_WIZARD, step: 0, building: false,
  });
  const [snapshot, setSnapshot] = useState(""); // JSON of the data the session started with
  const [leaveOpen, setLeaveOpen] = useState(false);

  // ── Session lifecycle ───────────────────────────────────────────────────────
  const beginSession = (page: PaymentPage | null) => {
    const data = page ? pageToWizardData(page) : DEFAULT_WIZARD;
    setEditingPage(page);
    setInitialData(data);
    setInitialStep(page?.lastStep ?? 0);
    setLive({ data, step: page?.lastStep ?? 0, building: !!page });
    setSnapshot(JSON.stringify(data));
    setSessionKey(k => k + 1);
    setScreen("wizard");
  };
  const startCreate = () => beginSession(null);
  const startEdit = (page: PaymentPage) => beginSession(page);

  const exitToDashboard = () => {
    setEditingPage(null);
    setSelectedPage(null);
    setLive({ data: DEFAULT_WIZARD, step: 0, building: false });
    setSnapshot("");
    setScreen("dashboard");
  };

  // ── Pages list mutations ─────────────────────────────────────────────────────
  const genId = () => "PP-ENK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const upsert = (p: PaymentPage) => setPages(prev => {
    const i = prev.findIndex(x => x.id === p.id);
    if (i === -1) return [p, ...prev];
    const copy = prev.slice(); copy[i] = p; return copy;
  });

  const commit = (data: WizardData, step: number, status: PageStatus) => {
    const id = editingPage?.id ?? genId();
    upsert(wizardDataToPage(data, { id, status, step, existing: editingPage }));
  };

  const handleSaveDraft = (data: WizardData, step: number) => {
    commit(data, step, "Draft");
    exitToDashboard();
  };
  const handlePublish = (data: WizardData) => {
    // Keep the row Active; the wizard shows its own success screen, then exits.
    commit(data, 0, "Active");
  };

  // ── Leaving the builder ──────────────────────────────────────────────────────
  const dirty = () => live.building && JSON.stringify(live.data) !== snapshot;
  const attemptLeave = () => {
    if (screen === "wizard" && dirty()) { setLeaveOpen(true); return; }
    exitToDashboard();
  };

  const canDraftFromLeave = live.data.title.trim().length > 0;

  return (
    <div style={{ height: "100vh", background: "#f4f6fb", fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopNav onHome={attemptLeave} breadcrumb={
        screen === "dashboard" ? [{ label: "Home", icon: "⌂" }, { label: "Payment Pages" }]
        : screen === "wizard" ? [{ label: "Home", icon: "⌂" }, { label: "Payment Pages" }, { label: editingPage ? "Edit" : "Create" }]
        : screen === "detail" ? [{ label: "Home", icon: "⌂" }, { label: "Payment Pages" }, { label: selectedPage?.title ?? "Page" }]
        : undefined
      } />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {screen !== "wizard" && <AppSidebar active="payment-pages" />}

        {screen === "dashboard" && (
          <Dashboard
            pages={pages}
            setPages={setPages}
            onCreate={startCreate}
            onView={page => { setSelectedPage(page); setScreen("detail"); }}
          />
        )}

        {screen === "wizard" && (
          <Wizard
            key={sessionKey}
            initialData={initialData}
            initialStep={initialStep}
            editing={!!editingPage}
            onBack={attemptLeave}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onSyncState={(data, step, building) => setLive({ data, step, building })}
          />
        )}

        {screen === "detail" && selectedPage && (
          <PageDetailView
            page={selectedPage}
            onBack={exitToDashboard}
            onEdit={startEdit}
          />
        )}
      </div>

      {/* Three-way leave prompt — Save as draft / Discard / Cancel */}
      {leaveOpen && (
        <Modal title="Leave page creation?" subtitle="You have unsaved changes." onClose={() => setLeaveOpen(false)} width={460}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
            You can save your progress as a draft and finish later, or discard your changes and leave.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => { if (canDraftFromLeave) { handleSaveDraft(live.data, live.step); setLeaveOpen(false); } }}
              disabled={!canDraftFromLeave}
              title={canDraftFromLeave ? undefined : "Add a page title first to save a draft"}
              style={{
                width: "100%", padding: "11px", background: canDraftFromLeave ? C.blue : C.blueLight,
                color: canDraftFromLeave ? "#fff" : C.textFaint, border: "none", borderRadius: radius.md,
                fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: canDraftFromLeave ? "pointer" : "not-allowed",
              }}
            >
              Save as draft
            </button>
            {!canDraftFromLeave && (
              <p style={{ fontSize: 11, color: C.textFaint, margin: "-4px 0 0", textAlign: "center" }}>
                Add a page title first to save a draft.
              </p>
            )}
            <button
              onClick={() => { setLeaveOpen(false); exitToDashboard(); }}
              style={{ width: "100%", padding: "11px", background: C.white, color: C.red, border: `1px solid ${C.redMid}`, borderRadius: radius.md, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              Discard changes
            </button>
            <button
              onClick={() => setLeaveOpen(false)}
              style={{ width: "100%", padding: "11px", background: "transparent", color: C.textMuted, border: "none", borderRadius: radius.md, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
