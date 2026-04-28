"use client";
import { useState } from "react";
import { TopNav, AppSidebar } from "@/components/payment-pages/layout";
import { Dashboard } from "@/components/payment-pages/dashboard";
import { Wizard } from "@/components/payment-pages/wizard";
import { PageDetailView } from "@/components/payment-pages/page-detail";
import { PaymentPage } from "@/components/payment-pages/mock-data";

type Screen = "dashboard" | "wizard" | "detail";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedPage, setSelectedPage] = useState<PaymentPage | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)", display: "flex", flexDirection: "column" }}>
      <TopNav />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {screen !== "wizard" && <AppSidebar active="payment-pages" />}
        {screen === "dashboard" && (
          <Dashboard
            onCreate={() => setScreen("wizard")}
            onView={page => { setSelectedPage(page); setScreen("detail"); }}
          />
        )}
        {screen === "wizard" && (
          <Wizard onBack={() => setScreen("dashboard")} />
        )}
        {screen === "detail" && selectedPage && (
          <PageDetailView
            page={selectedPage}
            onBack={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
}
