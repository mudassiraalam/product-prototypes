"use client";
import { useState, useEffect, useRef } from "react";
import { TopNav, AppSidebar } from "@/components/payment-pages/layout";
import { Dashboard } from "@/components/payment-pages/dashboard";
import { Wizard } from "@/components/payment-pages/wizard";
import { PageDetailView } from "@/components/payment-pages/page-detail";
import { Modal, Btn } from "@/components/payment-pages/primitives";
import { EnkashLogo } from "@/components/payment-pages/icons";
import { C, radius } from "@/components/payment-pages/tokens";
import { PaymentPage, INITIAL_PAGES, PageStatus } from "@/components/payment-pages/mock-data";
import { WizardData, DEFAULT_WIZARD } from "@/components/payment-pages/wizard-steps";
import { pageToWizardData, wizardDataToPage } from "@/components/payment-pages/page-mappers";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // ── URL sync ─────────────────────────────────────────────────────────────────
  // Each section gets its own shareable URL and browser back/forward works,
  // without restructuring the in-memory state machine into real routes:
  //   dashboard → /            wizard (new)  → ?view=create
  //   detail    → ?view=page&id=…   wizard (edit) → ?view=edit&id=…
  // Created pages live in memory only, so their URLs resolve within a session
  // (back/forward) but won't survive a hard reload — seed pages always resolve.
  const suppressPush = useRef(false);

  const currentQuery = () => {
    if (screen === "wizard") return editingPage ? `?view=edit&id=${editingPage.id}` : "?view=create";
    if (screen === "detail" && selectedPage) return `?view=page&id=${selectedPage.id}`;
    return ""; // dashboard
  };

  const applyUrl = (search: string) => {
    const params = new URLSearchParams(search);
    const view = params.get("view");
    const id = params.get("id");
    suppressPush.current = true;
    if (view === "create") startCreate();
    else if (view === "edit" && id) {
      const p = pages.find(x => x.id === id);
      if (p) startEdit(p); else exitToDashboard();
    } else if (view === "page" && id) {
      const p = pages.find(x => x.id === id);
      if (p) { setSelectedPage(p); setScreen("detail"); } else exitToDashboard();
    } else {
      exitToDashboard();
    }
    requestAnimationFrame(() => { suppressPush.current = false; });
  };

  // Restore from URL on first load.
  useEffect(() => {
    applyUrl(window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push a new history entry whenever the section changes (skip during restore).
  useEffect(() => {
    if (suppressPush.current) return;
    const q = currentQuery();
    if (window.location.search !== q) {
      window.history.pushState({}, "", window.location.pathname + q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, editingPage, selectedPage]);

  // Back / forward.
  useEffect(() => {
    const onPop = () => applyUrl(window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  // ── Mobile guard ───────────────────────────────────────────────────────────
  // The merchant dashboard/builder is a desktop workflow (built with fixed-width
  // panels). Rather than ship a half-responsive admin, show a clean notice on
  // small screens. The *customer* payment page is fully mobile-optimised and is
  // demonstrable via the builder's device toggle.
  const isMobile = useIsMobile();
  if (isMobile) return <MobileGuard />;

  return (
    <div style={{ height: "100vh", background: "#f4f6fb", fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopNav onHome={attemptLeave} breadcrumb={
        screen === "dashboard" ? [{ label: "Home", icon: "home" }, { label: "Payment Pages" }]
        : screen === "wizard" ? [{ label: "Home", icon: "home" }, { label: "Payment Pages" }, { label: editingPage ? "Edit" : "Create" }]
        : screen === "detail" ? [{ label: "Home", icon: "home" }, { label: "Payment Pages" }, { label: selectedPage?.title ?? "Page" }]
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

// ──────────────────────────────────────────────────────────────────────────────
// Small-screen notice. Keeps the prototype from looking broken on a phone and
// points to where the genuinely mobile-first surface lives.
// ──────────────────────────────────────────────────────────────────────────────
function MobileGuard() {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px 24px",
      fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)",
    }}>
      <div style={{
        background: C.white, border: `1px solid ${C.border}`, borderRadius: radius.xl,
        padding: "32px 26px", maxWidth: 380, width: "100%", boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <EnkashLogo variant="wordmark" height={30} />
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: C.text, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          Best viewed on desktop
        </h1>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
          The Payment Pages dashboard and builder are designed for a larger screen.
          Open this on a laptop or widen your browser window to use them.
        </p>
        <div style={{ background: C.blueLight, borderRadius: radius.md, padding: "12px 14px" }}>
          <p style={{ fontSize: 12.5, color: C.blueDark, lineHeight: 1.55, margin: 0 }}>
            The <strong>customer payment page</strong> itself is fully mobile-optimised — you can
            preview it on mobile from the builder's device toggle.
          </p>
        </div>
      </div>
    </div>
  );
}
