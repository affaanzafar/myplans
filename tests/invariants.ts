/**
 * Invariant tests for Ledger. Run with `npm test`.
 *
 * These assert the two hard data invariants — the Hifdh tab shows exactly 535
 * page tiles, and there are exactly 51 PCM chapters — plus the boundary-page
 * assignment rule, date handling, and backup validation. The data modules
 * also assert the core invariants at load time and fail loudly in dev/build.
 */
import assert from "node:assert/strict";

import {
  SURAHS,
  HIFDH_SECTIONS,
  HIFDH_PAGES,
  HIFDH_PAGE_SET,
  isRemainingPage,
} from "../src/lib/surahs";
import { SUBJECTS, ALL_CHAPTERS, CHAPTER_SET, PCM_TOTAL } from "../src/lib/chapters";
import { isValidDateKey, formatShort, formatHeading, toDateKey } from "../src/lib/dates";
import { isValidState, emptyState, togglePage, toggleChapter } from "../src/lib/state";
import { buildLogDays, formatPageList } from "../src/lib/log";

// --- Hifdh: exactly 535 tiles -------------------------------------------------

assert.equal(HIFDH_PAGES.length, 535, "Hifdh must display exactly 535 page tiles");
assert.equal(new Set(HIFDH_PAGES).size, 535, "each page tile must be unique");

const expectedPages = new Set<number>();
for (let p = 1; p <= 292; p += 1) expectedPages.add(p);
for (let p = 322; p <= 564; p += 1) expectedPages.add(p);
assert.equal(expectedPages.size, 535);
for (const p of expectedPages) {
  assert.ok(HIFDH_PAGE_SET.has(p), `remaining page ${p} must have a tile`);
  assert.ok(isRemainingPage(p), `page ${p} should be a remaining page`);
}
for (const p of HIFDH_PAGES) {
  assert.ok(isRemainingPage(p), `tracked page ${p} must be within 1–292 or 322–564`);
}

// Already-memorised pages never appear.
for (const p of [293, 300, 321, 565, 580, 604]) {
  assert.ok(!HIFDH_PAGE_SET.has(p), `memorised page ${p} must not have a tile`);
}

// --- Hifdh: boundary pages go to the FIRST surah whose range includes them ----

const sectionOf = (name: string) => {
  const s = HIFDH_SECTIONS.find((x) => x.name === name);
  assert.ok(s, `surah ${name} must exist`);
  return s;
};

const baqarah = sectionOf("Al-Baqarah");
assert.equal(baqarah.pages.length, 48, "Al-Baqarah shows 48 tiles");
assert.deepEqual(
  baqarah.pages,
  Array.from({ length: 48 }, (_, i) => i + 2),
  "Al-Baqarah shows pages 2–49",
);

assert.ok(sectionOf("An-Nisa").pages.includes(106), "page 106 belongs to An-Nisa");
assert.ok(!sectionOf("Al-Ma'idah").pages.includes(106), "page 106 must not repeat under Al-Ma'idah");
assert.ok(sectionOf("Yunus").pages.includes(221), "page 221 belongs to Yunus");
assert.ok(!sectionOf("Hud").pages.includes(221), "page 221 must not repeat under Hud");
assert.ok(sectionOf("Al-Ankabut").pages.includes(404), "page 404 belongs to Al-Ankabut");
assert.ok(!sectionOf("Ar-Rum").pages.includes(404), "page 404 must not repeat under Ar-Rum");
assert.ok(sectionOf("Ya-Sin").pages.includes(441), "Ya-Sin keeps 441–445 (440 goes to Fatir)");
assert.ok(!sectionOf("Ya-Sin").pages.includes(440), "page 440 belongs to Fatir, not Ya-Sin");
assert.ok(sectionOf("Al-Isra").pages.includes(292), "Al-Isra keeps page 292");
assert.ok(!sectionOf("Al-Isra").pages.includes(293), "page 293 is already memorised");

// Every surah's tiles are within its declared range and are consecutive-ordered.
for (const surah of SURAHS) {
  const section = HIFDH_SECTIONS.find((s) => s.name === surah.name);
  if (section) {
    for (const p of section.pages) {
      assert.ok(p >= surah.start && p <= surah.end, `${surah.name}: page ${p} out of range`);
    }
    assert.deepEqual(section.pages, [...section.pages].sort((a, b) => a - b));
  }
}

// --- PCM: exactly 51 chapters --------------------------------------------------

assert.equal(ALL_CHAPTERS.length, PCM_TOTAL, "there must be exactly 51 chapters");
assert.equal(PCM_TOTAL, 51);
assert.equal(CHAPTER_SET.size, 51, "chapter names must be unique");

const subjectTotal = (name: string) => {
  const s = SUBJECTS.find((x) => x.name === name);
  assert.ok(s, `subject ${name} must exist`);
  return s.groups.reduce((n, g) => n + g.chapters.length, 0);
};
assert.equal(subjectTotal("Physics"), 17);
assert.equal(subjectTotal("Chemistry"), 18);
assert.equal(subjectTotal("Mathematics"), 16);

const groupTotal = (subject: string, label: string) => {
  const g = SUBJECTS
    .find((x) => x.name === subject)!
    .groups.find((x) => x.label === label);
  assert.ok(g, `${subject} / ${label} must exist`);
  return g.chapters.length;
};
assert.equal(groupTotal("Chemistry", "Physical"), 7);
assert.equal(groupTotal("Chemistry", "Inorganic"), 6);
assert.equal(groupTotal("Chemistry", "Organic"), 5);
assert.equal(groupTotal("Mathematics", "Algebra"), 6);
assert.equal(groupTotal("Mathematics", "Sets, Functions & Calculus"), 6);
assert.equal(groupTotal("Mathematics", "Vectors & Coordinate Geometry"), 4);

assert.ok(CHAPTER_SET.has("Mole Concept"));
assert.ok(CHAPTER_SET.has("Conic Sections, Probability & Statistics"));
assert.ok(CHAPTER_SET.has("Modern Physics & Semiconductors"));

// --- Dates ---------------------------------------------------------------------

assert.ok(isValidDateKey("2026-02-19"));
assert.ok(isValidDateKey("2024-02-29"), "2024 is a leap year");
assert.ok(!isValidDateKey("2026-02-30"), "30 Feb is not a real date");
assert.ok(!isValidDateKey("2026-13-01"));
assert.ok(!isValidDateKey("2026-2-19"), "months must be zero-padded");
assert.ok(!isValidDateKey("19-02-2026"));
assert.ok(!isValidDateKey("2026/02/19"));
assert.ok(!isValidDateKey(null));

assert.equal(toDateKey(new Date(2026, 1, 19)), "2026-02-19");
assert.equal(toDateKey(new Date(2026, 11, 5)), "2026-12-05");
assert.equal(formatShort("2026-02-19"), "19 Feb");
assert.equal(formatShort("2026-12-05"), "5 Dec");
assert.equal(formatHeading("2026-02-19", new Date(2026, 8, 1)), "19 Feb");
assert.equal(formatHeading("2025-02-19", new Date(2026, 8, 1)), "19 Feb 2025");

// --- State validation (also used by Restore) -------------------------------------

assert.ok(isValidState(emptyState()));
assert.ok(
  isValidState({ version: 1, pages: { "322": "2026-02-19" }, chapters: { "Mole Concept": "2026-02-19" } }),
);
assert.ok(!isValidState(null));
assert.ok(!isValidState("nope"));
assert.ok(!isValidState({ version: 2, pages: {}, chapters: {} }), "unknown version rejected");
assert.ok(!isValidState({ version: 1, pages: [], chapters: {} }), "pages must be an object");
assert.ok(
  !isValidState({ version: 1, pages: { "300": "2026-02-19" }, chapters: {} }),
  "page 300 is already memorised, not a tracked page",
);
assert.ok(
  !isValidState({ version: 1, pages: { "322": "2026-02-30" }, chapters: {} }),
  "impossible date rejected",
);
assert.ok(
  !isValidState({ version: 1, pages: {}, chapters: { "Not a chapter": "2026-02-19" } }),
  "unknown chapter rejected",
);

// Toggles record and erase today's local date.
let s = emptyState();
s = togglePage(s, 322);
assert.equal(Object.keys(s.pages).length, 1);
assert.match(s.pages["322"], /^\d{4}-\d{2}-\d{2}$/);
s = togglePage(s, 322);
assert.equal(Object.keys(s.pages).length, 0);
s = toggleChapter(s, "Mole Concept");
assert.equal(Object.keys(s.chapters).length, 1);
s = toggleChapter(s, "Mole Concept");
assert.equal(Object.keys(s.chapters).length, 0);

// --- Log ------------------------------------------------------------------------

assert.equal(formatPageList([]), "");
assert.equal(formatPageList([322]), "322");
assert.equal(formatPageList([322, 324]), "322, 324");
assert.equal(formatPageList([322, 323]), "322, 323");
assert.equal(formatPageList([322, 323, 324]), "322\u2013324");
assert.equal(formatPageList([322, 323, 324, 330, 331, 332, 401]), "322\u2013324, 330\u2013332, 401");

const days = buildLogDays({
  version: 1,
  pages: { "322": "2026-02-19", "323": "2026-02-19", "324": "2026-02-19", "2": "2026-02-10" },
  chapters: { "Mole Concept": "2026-02-19", "Gravitation": "2026-02-18" },
});
assert.equal(days.length, 3);
assert.equal(days[0].date, "2026-02-19");
assert.deepEqual(days[0].pages, [322, 323, 324]);
// chapters listed in curriculum order
assert.deepEqual(days[0].chapters, ["Mole Concept"]);
assert.equal(days[1].date, "2026-02-18");
assert.deepEqual(days[1].chapters, ["Gravitation"]);
assert.deepEqual(days[1].pages, []);
assert.deepEqual(days[2].pages, [2]);
assert.deepEqual(days[2].chapters, []);

console.log(
  "All invariants hold — Hifdh: 535 page tiles across 64 surah sections (Al-Baqarah 2–49, 48 tiles); PCM: 51 chapters (17 + 18 + 16).",
);
