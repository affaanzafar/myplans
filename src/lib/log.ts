/**
 * The log: what was completed, on which day. Pure functions so the grouping
 * and formatting can be tested.
 */

import { ALL_CHAPTERS } from "./chapters";
import type { LedgerState } from "./state";

export interface LogDay {
  date: string; // YYYY-MM-DD
  pages: number[]; // ascending
  chapters: string[]; // curriculum order
}

/** Group all recorded completions by date. */
export function buildLogDays(state: LedgerState): LogDay[] {
  const byDate = new Map<string, LogDay>();
  const day = (date: string): LogDay => {
    let d = byDate.get(date);
    if (!d) {
      d = { date, pages: [], chapters: [] };
      byDate.set(date, d);
    }
    return d;
  };

  for (const [page, date] of Object.entries(state.pages)) {
    day(date).pages.push(Number(page));
  }
  // Chapters in curriculum order, so a day's list reads like the syllabus.
  for (const chapter of ALL_CHAPTERS) {
    const date = state.chapters[chapter];
    if (date !== undefined) day(date).chapters.push(chapter);
  }

  return [...byDate.values()]
    .map((d) => ({ ...d, pages: [...d.pages].sort((a, b) => a - b) }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // reverse-chronological
}

/**
 * A compact, bookish page list: runs of three or more consecutive pages
 * become en-dash ranges. [322, 323, 324, 330] -> "322–324, 330".
 */
export function formatPageList(pages: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < pages.length) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j += 1;
    if (j - i + 1 >= 3) {
      parts.push(`${pages[i]}\u2013${pages[j]}`);
    } else {
      for (let k = i; k <= j; k += 1) parts.push(String(pages[k]));
    }
    i = j + 1;
  }
  return parts.join(", ");
}
