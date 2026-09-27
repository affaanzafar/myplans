/**
 * Ledger state — everything lives in localStorage, auto-saved on every change.
 *
 * Shape:
 *   { version: 1,
 *     pages:    { "322": "2026-02-19", ... },
 *     chapters: { "Mole Concept": "2026-02-19", ... },
 *     planDays: { "Mole Concept#1": "2026-09-29", ... } }  // study-day slots
 *
 * A chapter is complete if and only if all of its plan study days are ticked;
 * the toggles and normalizeState() below keep that true everywhere.
 */

import { HIFDH_PAGE_SET } from "./surahs";
import { ALL_CHAPTERS, CHAPTER_SET } from "./chapters";
import { PLAN_DAY_COUNT } from "./plan";
import { isValidDateKey, todayKey } from "./dates";

export const STORAGE_KEY = "ledger";
export const STATE_VERSION = 1;

export interface LedgerState {
  version: 1;
  /** page number (string) -> completion date */
  pages: Record<string, string>;
  /** chapter name -> completion date */
  chapters: Record<string, string>;
  /** study-day slot ("Chapter#1") -> date that study day was done */
  planDays: Record<string, string>;
}

/** The storage key of a chapter's n-th study day (1-based). */
export function slotKey(chapter: string, index: number): string {
  return `${chapter}#${index}`;
}

function slotsOf(chapter: string): string[] {
  const total = PLAN_DAY_COUNT[chapter] ?? 0;
  return Array.from({ length: total }, (_, i) => slotKey(chapter, i + 1));
}

export function emptyState(): LedgerState {
  return { version: STATE_VERSION, pages: {}, chapters: {}, planDays: {} };
}

/**
 * Strict shape check: version must match, page keys must be tracked Hifdh
 * pages, chapter keys must be known chapters, plan-day keys must be real slots
 * of their chapter, and every date must be a real local date. `planDays` may
 * be absent (older backups). Used for localStorage loads and restore files.
 */
export function isValidState(value: unknown): value is LedgerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== STATE_VERSION) return false;
  if (typeof v.pages !== "object" || v.pages === null || Array.isArray(v.pages)) return false;
  if (typeof v.chapters !== "object" || v.chapters === null || Array.isArray(v.chapters)) {
    return false;
  }
  for (const [page, date] of Object.entries(v.pages)) {
    if (!HIFDH_PAGE_SET.has(Number(page))) return false;
    if (!isValidDateKey(date)) return false;
  }
  for (const [chapter, date] of Object.entries(v.chapters)) {
    if (!CHAPTER_SET.has(chapter)) return false;
    if (!isValidDateKey(date)) return false;
  }
  if (v.planDays !== undefined) {
    if (typeof v.planDays !== "object" || v.planDays === null || Array.isArray(v.planDays)) {
      return false;
    }
    for (const [key, date] of Object.entries(v.planDays)) {
      const match = /^(.+)#(\d+)$/.exec(key);
      if (match === null) return false;
      const index = Number(match[2]);
      const total = PLAN_DAY_COUNT[match[1]];
      if (total === undefined || index < 1 || index > total) return false;
      if (!isValidDateKey(date)) return false;
    }
  }
  return true;
}

/**
 * Make chapter completion and plan-day ticks agree (a chapter is done exactly
 * when all its days are ticked). Backfills older states that predate
 * planDays, and completes chapters whose days were all ticked.
 */
export function normalizeState(state: LedgerState): LedgerState {
  const source = state as Partial<LedgerState>;
  const pages = { ...source.pages };
  const chapters = { ...source.chapters };
  const planDays = { ...(source.planDays ?? {}) };

  for (const chapter of ALL_CHAPTERS) {
    const slots = slotsOf(chapter);
    if (slots.length === 0) continue;
    const allTicked = slots.every((s) => planDays[s] !== undefined);
    if (chapters[chapter] !== undefined && !allTicked) {
      // Completed before plan days existed: fill them with the chapter's date.
      for (const s of slots) planDays[s] = chapters[chapter];
    } else if (chapters[chapter] === undefined && allTicked) {
      // Every study day done: the chapter is done, dated by its last day.
      const dates = slots.map((s) => planDays[s]).sort();
      chapters[chapter] = dates[dates.length - 1];
    }
  }
  return { version: STATE_VERSION, pages, chapters, planDays };
}

/** Load from localStorage; corrupt or unknown data starts fresh. */
export function loadState(): LedgerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return normalizeState(parsed);
    console.warn("Ledger: saved state was unreadable, starting fresh.");
    return emptyState();
  } catch {
    console.warn("Ledger: saved state was corrupt, starting fresh.");
    return emptyState();
  }
}

/** Auto-save on every change. */
export function saveState(state: LedgerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota); the app still works this session.
  }
}

/** Toggle a page: done -> untouched, untouched -> done today. */
export function togglePage(state: LedgerState, page: number): LedgerState {
  const key = String(page);
  const pages = { ...state.pages };
  if (key in pages) delete pages[key];
  else pages[key] = todayKey();
  return { ...state, pages };
}

/**
 * Toggle a chapter: done -> untouched (clears its study days), untouched ->
 * done today (ticks all its study days today).
 */
export function toggleChapter(state: LedgerState, chapter: string): LedgerState {
  const chapters = { ...state.chapters };
  const planDays = { ...state.planDays };
  const slots = slotsOf(chapter);
  if (chapter in chapters) {
    delete chapters[chapter];
    for (const s of slots) delete planDays[s];
  } else {
    const today = todayKey();
    chapters[chapter] = today;
    for (const s of slots) planDays[s] = today;
  }
  return { ...state, chapters, planDays };
}

/**
 * Toggle a single study day of a chapter. Ticking the last remaining day
 * records the chapter complete (dated by its latest day); unticking any day
 * of a complete chapter un-completes it.
 */
export function togglePlanDay(
  state: LedgerState,
  chapter: string,
  index: number,
): LedgerState {
  const key = slotKey(chapter, index);
  const chapters = { ...state.chapters };
  const planDays = { ...state.planDays };
  const slots = slotsOf(chapter);

  if (key in planDays) {
    delete planDays[key];
    delete chapters[chapter];
  } else {
    planDays[key] = todayKey();
    if (slots.every((s) => planDays[s] !== undefined)) {
      const dates = slots.map((s) => planDays[s]).sort();
      chapters[chapter] = dates[dates.length - 1];
    }
  }
  return { ...state, chapters, planDays };
}
