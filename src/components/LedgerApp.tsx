"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import HifdhTab from "./HifdhTab";
import PcmTab from "./PcmTab";
import LogTab from "./LogTab";
import Footer from "./Footer";
import {
  emptyState,
  loadState,
  saveState,
  toggleChapter,
  togglePage,
  type LedgerState,
} from "@/lib/state";

type TabId = "hifdh" | "pcm" | "log";

const TABS: { id: TabId; label: string }[] = [
  { id: "hifdh", label: "Hifdh" },
  { id: "pcm", label: "PCM" },
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

  const onRestore = useCallback((restored: LedgerState) => {
    setState(restored);
  }, []);

  const current = state ?? emptyState();
  const hifdhDone = Object.keys(current.pages).length;
  const pcmDone = Object.keys(current.chapters).length;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 sm:px-8">
        <Header hifdhDone={hifdhDone} pcmDone={pcmDone} />

        <nav className="mt-10 flex gap-7 border-b border-hairline" aria-label="Sections">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 pb-3 pt-1 text-[14px] transition-colors duration-150 ${
                  active
                    ? "border-ink font-medium text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <main className="py-10">
          <div key={tab} className="tab-content">
            {tab === "hifdh" && <HifdhTab pages={current.pages} onToggle={onTogglePage} />}
            {tab === "pcm" && <PcmTab chapters={current.chapters} onToggle={onToggleChapter} />}
            {tab === "log" && <LogTab state={current} />}
          </div>
        </main>
      </div>

      <Footer state={state} onRestore={onRestore} />
    </div>
  );
}
