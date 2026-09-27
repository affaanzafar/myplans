"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import HifdhTab from "./HifdhTab";
import PcmTab from "./PcmTab";
import PlanTab from "./PlanTab";
import LogTab from "./LogTab";
import Footer from "./Footer";
import {
  emptyState,
  loadState,
  normalizeState,
  saveState,
  toggleChapter,
  togglePage,
  togglePlanDay,
  type LedgerState,
} from "@/lib/state";

type TabId = "hifdh" | "pcm" | "plan" | "log";

const TABS: { id: TabId; label: string }[] = [
  { id: "hifdh", label: "Hifdh" },
  { id: "pcm", label: "PCM" },
  { id: "plan", label: "Plan" },
  { id: "log", label: "Log" },
];

export default function LedgerApp() {
  const [state, setState] = useState<LedgerState | null>(null);
  const [tab, setTab] = useState<TabId>("hifdh");

  // Load once, on mount, from localStorage. Corrupt data starts fresh.
  useEffect(() => {
    setState(loadState());
  }, []);

  // Auto-save on every change.
  useEffect(() => {
    if (state !== null) saveState(state);
  }, [state]);

  const onTogglePage = useCallback((page: number) => {
    setState((prev) => (prev === null ? prev : togglePage(prev, page)));
  }, []);

  const onToggleChapter = useCallback((chapter: string) => {
    setState((prev) => (prev === null ? prev : toggleChapter(prev, chapter)));
  }, []);

  const onTogglePlanDay = useCallback((chapter: string, index: number) => {
    setState((prev) => (prev === null ? prev : togglePlanDay(prev, chapter, index)));
  }, []);

  const onRestore = useCallback((restored: LedgerState) => {
    setState(normalizeState(restored));
  }, []);

  const current = state ?? emptyState();
  const hifdhDone = Object.keys(current.pages).length;
  const pcmDone = Object.keys(current.chapters).length;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 sm:px-8">
        <Header hifdhDone={hifdhDone} pcmDone={pcmDone} />
      </div>

      <nav
        className="sticky top-0 z-30 border-b border-hairline/70 bg-paper/85 py-2.5 backdrop-blur-md"
        aria-label="Sections"
      >
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <div className="inline-flex gap-1 rounded-full border border-hairline bg-paperdeep p-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-[13.5px] transition-all duration-150 ${
                    active
                      ? "bg-card font-medium text-ink shadow-soft"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 sm:px-8">
        <main className="py-8 sm:py-10">
          <div key={tab} className="tab-content">
            {tab === "hifdh" && <HifdhTab pages={current.pages} onToggle={onTogglePage} />}
            {tab === "pcm" && <PcmTab chapters={current.chapters} onToggle={onToggleChapter} />}
            {tab === "plan" && (
              <PlanTab
                chapters={current.chapters}
                planDays={current.planDays}
                onToggleDay={onTogglePlanDay}
              />
            )}
            {tab === "log" && <LogTab state={current} />}
          </div>
        </main>
      </div>

      <Footer state={state} onRestore={onRestore} />
    </div>
  );
}
