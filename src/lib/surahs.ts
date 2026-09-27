/**
 * Hifdh data — Madani 604-page layout.
 *
 * Already memorised (not tracked in this app): pages 293–321 (Al-Kahf, Maryam,
 * Taha) and pages 565–604 (Surah 68–114). Tracked pages: 1–292 and 322–564,
 * 535 pages in total.
 *
 * Assignment rule: iterate surahs in order; every page number belongs to the
 * FIRST surah whose range includes it, so shared boundary pages (e.g. 106,
 * shared by An-Nisa and Al-Ma'idah) appear exactly once, under the earlier
 * surah.
 */

export interface SurahRange {
  name: string;
  start: number;
  end: number;
}

/** The remaining surahs, in order, with their page ranges. */
export const SURAHS: SurahRange[] = [
  { name: "Al-Fatihah", start: 1, end: 1 },
  { name: "Al-Baqarah", start: 2, end: 49 },
  { name: "Aal Imran", start: 50, end: 76 },
  { name: "An-Nisa", start: 77, end: 106 },
  { name: "Al-Ma'idah", start: 106, end: 127 },
  { name: "Al-An'am", start: 128, end: 150 },
  { name: "Al-A'raf", start: 151, end: 176 },
  { name: "Al-Anfal", start: 177, end: 186 },
  { name: "At-Tawbah", start: 187, end: 207 },
  { name: "Yunus", start: 208, end: 221 },
  { name: "Hud", start: 221, end: 235 },
  { name: "Yusuf", start: 235, end: 248 },
  { name: "Ar-Ra'd", start: 249, end: 255 },
  { name: "Ibrahim", start: 255, end: 261 },
  { name: "Al-Hijr", start: 262, end: 267 },
  { name: "An-Nahl", start: 267, end: 281 },
  { name: "Al-Isra", start: 282, end: 293 },
  { name: "Al-Anbiya", start: 322, end: 331 },
  { name: "Al-Hajj", start: 332, end: 341 },
  { name: "Al-Mu'minun", start: 342, end: 349 },
  { name: "An-Nur", start: 350, end: 359 },
  { name: "Al-Furqan", start: 359, end: 366 },
  { name: "Ash-Shu'ara", start: 367, end: 376 },
  { name: "An-Naml", start: 377, end: 385 },
  { name: "Al-Qasas", start: 385, end: 396 },
  { name: "Al-Ankabut", start: 396, end: 404 },
  { name: "Ar-Rum", start: 404, end: 410 },
  { name: "Luqman", start: 411, end: 414 },
  { name: "As-Sajdah", start: 415, end: 417 },
  { name: "Al-Ahzab", start: 418, end: 427 },
  { name: "Saba", start: 428, end: 434 },
  { name: "Fatir", start: 434, end: 440 },
  { name: "Ya-Sin", start: 440, end: 445 },
  { name: "As-Saffat", start: 446, end: 452 },
  { name: "Sad", start: 453, end: 458 },
  { name: "Az-Zumar", start: 458, end: 467 },
  { name: "Ghafir", start: 467, end: 476 },
  { name: "Fussilat", start: 477, end: 482 },
  { name: "Ash-Shura", start: 483, end: 489 },
  { name: "Az-Zukhruf", start: 489, end: 495 },
  { name: "Ad-Dukhan", start: 496, end: 498 },
  { name: "Al-Jathiyah", start: 499, end: 502 },
  { name: "Al-Ahqaf", start: 502, end: 506 },
  { name: "Muhammad", start: 507, end: 510 },
  { name: "Al-Fath", start: 511, end: 515 },
  { name: "Al-Hujurat", start: 515, end: 517 },
  { name: "Qaf", start: 518, end: 520 },
  { name: "Adh-Dhariyat", start: 520, end: 523 },
  { name: "At-Tur", start: 523, end: 525 },
  { name: "An-Najm", start: 526, end: 528 },
  { name: "Al-Qamar", start: 528, end: 531 },
  { name: "Ar-Rahman", start: 531, end: 534 },
  { name: "Al-Waqi'ah", start: 534, end: 537 },
  { name: "Al-Hadid", start: 537, end: 541 },
  { name: "Al-Mujadilah", start: 542, end: 545 },
  { name: "Al-Hashr", start: 545, end: 548 },
  { name: "Al-Mumtahanah", start: 549, end: 551 },
  { name: "As-Saff", start: 551, end: 552 },
  { name: "Al-Jumu'ah", start: 553, end: 554 },
  { name: "Al-Munafiqun", start: 554, end: 555 },
  { name: "At-Taghabun", start: 556, end: 557 },
  { name: "At-Talaq", start: 558, end: 559 },
  { name: "At-Tahrim", start: 560, end: 561 },
  { name: "Al-Mulk", start: 562, end: 564 },
];

/** The number of pages still to be memorised. */
export const HIFDH_TOTAL = 535;

/** A page is tracked iff it has not already been memorised. */
export function isRemainingPage(page: number): boolean {
  return (page >= 1 && page <= 292) || (page >= 322 && page <= 564);
}

export interface SurahSection {
  name: string;
  /** First and last page actually shown under this surah. */
  first: number;
  last: number;
  /** Pages shown under this surah, in order (first-surah rule applied). */
  pages: number[];
}

function buildSections(): SurahSection[] {
  const taken = new Set<number>();
  const sections: SurahSection[] = [];

  for (const surah of SURAHS) {
    const pages: number[] = [];
    for (let page = surah.start; page <= surah.end; page += 1) {
      if (!isRemainingPage(page)) continue; // already memorised
      if (taken.has(page)) continue; // belongs to an earlier surah
      taken.add(page);
      pages.push(page);
    }
    if (pages.length > 0) {
      sections.push({
        name: surah.name,
        first: pages[0],
        last: pages[pages.length - 1],
        pages,
      });
    }
  }
  return sections;
}

export const HIFDH_SECTIONS: SurahSection[] = buildSections();

export const HIFDH_PAGES: number[] = HIFDH_SECTIONS.flatMap((s) => s.pages);
export const HIFDH_PAGE_SET: ReadonlySet<number> = new Set(HIFDH_PAGES);

/**
 * Invariants of the Hifdh data. This runs whenever the module is loaded —
 * in `next dev`, during `next build`, in the browser, and in `npm test` —
 * and fails loudly if the data is ever wrong.
 */
function assertHifdhInvariants(): void {
  if (HIFDH_PAGES.length !== HIFDH_TOTAL) {
    throw new Error(
      `Hifdh invariant violated: the tab must show exactly ${HIFDH_TOTAL} page tiles, but the data yields ${HIFDH_PAGES.length}.`,
    );
  }
  if (new Set(HIFDH_PAGES).size !== HIFDH_TOTAL) {
    throw new Error("Hifdh invariant violated: duplicate pages across surah sections.");
  }

  const expected = new Set<number>();
  for (let p = 1; p <= 292; p += 1) expected.add(p);
  for (let p = 322; p <= 564; p += 1) expected.add(p);
  const everyRemainingPageShown =
    expected.size === HIFDH_PAGE_SET.size && [...expected].every((p) => HIFDH_PAGE_SET.has(p));
  if (!everyRemainingPageShown) {
    throw new Error(
      "Hifdh invariant violated: the shown pages must be exactly 1–292 and 322–564, each once.",
    );
  }

  const baqarah = HIFDH_SECTIONS.find((s) => s.name === "Al-Baqarah");
  if (
    !baqarah ||
    baqarah.pages.length !== 48 ||
    baqarah.pages[0] !== 2 ||
    baqarah.pages[baqarah.pages.length - 1] !== 49
  ) {
    throw new Error("Hifdh invariant violated: Al-Baqarah must show 48 tiles, pages 2–49.");
  }
}

assertHifdhInvariants();
