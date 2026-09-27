/**
 * Ledger state — everything lives in localStorage, auto-saved on every change.
 *
 * Shape: { version: 1, pages: { "322": "2026-02-19", ... },
 *          chapters: { "Mole Concept": "2026-02-19", ... } }
 */

import { HIFDH_PAGE_SET } from "./surahs";
import { CHAPTER_SET } from "./chapters";
import { isValidDateKey, todayKey } from "./dates";

export const STORAGE_KEY = "ledger";
export const STATE_VERSION = 1;

export interface LedgerState {
  version: 1;
  /** page number (string) -> completion date */
  pages: Record<string, string>;
  /** chapter name -> completion date */
  chapters: Record<string, string>;
}

export function emptyState(): LedgerState {
  return { version: STATE_VERSION, pages: {}, chapters: {} };
}

/**
 * Strict shape check: version must match, page keys must be tracked Hifdh
 * pages, chapter keys must be known chapters, and every date must be a real
 * local date. Used for localStorage loads and for validating restore files.
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
  return true;
}

/** Load from localStorage; corrupt or unknown data starts fresh. */
export function loadState(): LedgerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return parsed;
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

/** Toggle a chapter: done -> untouched, untouched -> done today. */
export function toggleChapter(state: LedgerState, chapter: string): LedgerState {
  const chapters = { ...state.chapters };
  if (chapter in chapters) delete chapters[chapter];
  else chapters[chapter] = todayKey();
  return { ...state, chapters };
}
