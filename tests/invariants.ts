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
import {
  isValidDateKey,
  formatShort,
  formatHeading,
  toDateKey,
  addDaysKey,
  diffDays,
} from "../src/lib/dates";
import {
  PLAN,
  PLAN_START,
  PLAN_END,
  PLAN_TOTAL_DAYS,
  PLAN_STATS,
  DIFFICULTY,
  PLAN_MONTHS,
  formatWindow,
} from "../src/lib/plan";
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

// --- The plan: 51 chapters across 28 Sep – 31 Dec 2026 (95 days) ---------------

assert.equal(PLAN_START, "2026-09-28");
assert.equal(PLAN_END, "2026-12-31");
assert.equal(PLAN_TOTAL_DAYS, 95);
assert.equal(diffDays(PLAN_START, PLAN_END), 94, "95 days inclusive");
assert.equal(addDaysKey("2026-09-30", 1), "2026-10-01");
assert.equal(addDaysKey("2026-12-31", 1), "2027-01-01");
assert.equal(diffDays("2026-02-28", "2026-03-01"), 1, "2026 is not a leap year");

// every chapter rated, and nothing extra
assert.equal(Object.keys(DIFFICULTY).length, 51, "51 difficulty ratings");
assert.deepEqual(Object.keys(DIFFICULTY).sort(), [...ALL_CHAPTERS].sort(), "ratings match chapters exactly");

// the difficulty mix
assert.equal(PLAN_STATS.hard, 14);
assert.equal(PLAN_STATS.medium, 26);
assert.equal(PLAN_STATS.easy, 11);
assert.equal(PLAN_STATS.hard + PLAN_STATS.medium + PLAN_STATS.easy, 51);

// the windows
assert.equal(PLAN.length, 51);
let plannedDays = 0;
for (let i = 0; i < PLAN.length; i += 1) {
  const e = PLAN[i];
  plannedDays += e.days;
  assert.ok(e.days >= 1 && e.days <= 3, `${e.chapter}: ${e.days} days out of range`);
  assert.equal(diffDays(e.start, e.end), e.days - 1, `window length for ${e.chapter}`);
  if (i > 0) {
    assert.equal(PLAN[i - 1].end, addDaysKey(e.start, -1), `windows contiguous at ${e.chapter}`);
  }
  if (e.difficulty === "easy") assert.equal(e.days, 1, `easy chapters get 1 day: ${e.chapter}`);
  if (e.difficulty === "medium") assert.ok(e.days <= 2, `medium chapters get at most 2: ${e.chapter}`);
  if (e.difficulty === "hard") assert.ok(e.days >= 2, `hard chapters get at least 2: ${e.chapter}`);
}
assert.equal(plannedDays, 95, "the plan spans exactly 95 days");
assert.equal(PLAN[0].start, "2026-09-28", "plan starts 28 Sep");
assert.equal(PLAN[PLAN.length - 1].end, "2026-12-31", "plan ends 31 Dec");

// harder chapters get more time, thoroughly
const avgDays = (d: "hard" | "medium" | "easy") => {
  const es = PLAN.filter((e) => e.difficulty === d);
  return es.reduce((s, e) => s + e.days, 0) / es.length;
};
assert.ok(avgDays("hard") > avgDays("medium"), "hard > medium on average");
assert.ok(avgDays("medium") > avgDays("easy"), "medium > easy on average");

// spot-checks of the schedule
const entryOf = (name: string) => {
  const e = PLAN.find((x) => x.chapter === name);
  assert.ok(e, `chapter planned: ${name}`);
  return e;
};
const first = entryOf("Kinematics 1D & Vectors");
assert.equal(first.start, "2026-09-28");
assert.equal(first.end, "2026-09-28");
assert.equal(first.days, 1);
assert.equal(first.difficulty, "easy");

const rotation = entryOf("Rotational Motion (Rigid Bodies)");
assert.equal(rotation.days, 3);
assert.equal(rotation.start, "2026-10-09");
assert.equal(rotation.end, "2026-10-11");

assert.equal(entryOf("Modern Physics & Semiconductors").end, "2026-11-01", "physics finishes 1 Nov");
assert.equal(
  entryOf("Aldehydes, Ketones & Carboxylic Acids").end,
  "2026-12-03",
  "chemistry finishes 3 Dec",
);
const last = entryOf("Conic Sections, Probability & Statistics");
assert.equal(last.start, "2026-12-29");
assert.equal(last.end, "2026-12-31", "the plan ends exactly on 31 Dec");

// months crossed
assert.deepEqual(
  PLAN_MONTHS.map((m) => m.label),
  ["September", "October", "November", "December"],
);
assert.equal(PLAN_MONTHS[0].offset, 0);

// window formatting
assert.equal(formatWindow("2026-09-28", "2026-09-28"), "28 Sep");
assert.equal(formatWindow("2026-10-14", "2026-10-16"), "14\u201316 Oct");
assert.equal(formatWindow("2026-09-30", "2026-10-02"), "30 Sep \u2013 2 Oct");

console.log(
  "All invariants hold — Hifdh: 535 page tiles across 64 surah sections (Al-Baqarah 2–49, 48 tiles); PCM: 51 chapters (17 + 18 + 16); Plan: 51 chapters across 95 days, 28 Sep – 31 Dec 2026 (14 hard · 26 medium · 11 easy).",
);
