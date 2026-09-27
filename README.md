# Ledger

A quiet, single-user progress tracker for one person doing two things at once:

- memorizing the remaining **535 pages** of the Qur'an (Hifdh), and
- completing **51 chapters** of Physics, Chemistry and Mathematics for JEE.

It does one thing: it records what actually happened, honestly, on the day it
happened. It is a ledger, not a coach.

There are no streaks, quotas, daily targets, notifications, badges, confetti,
or motivational messages. Nothing in the app asks you for anything.

## Running it

```bash
npm install
npm run dev        # development
npm run build      # static export into ./out — the whole app
npm start          # serves ./out offline at http://localhost:3000
```

The build is a static export: a folder of plain files with no server code,
no network calls, and no accounts. It runs from any static file server (or a
USB stick). All state lives in `localStorage` under the key `ledger`,
auto-saved on every change; corrupt data is handled gracefully by starting
fresh.

Backup and Restore live in the footer. Backup downloads
`ledger-backup-YYYY-MM-DD.json` (the complete state, pretty-printed).
Restore opens a file picker, validates the file strictly (version, page
numbers, chapter names, real calendar dates), and only then loads it.

## The tabs

### Hifdh
All 535 remaining pages (1–292 and 322–564) as tiles under 64 surah cards.
Already memorized, not tracked: pages 293–321 (Al-Kahf, Maryam, Taha) and
565–604 (Surah 68–114). Boundary pages are shared between surahs; each page
belongs to the **first** surah whose range includes it, so page 106 shows
under An-Nisa only. **Invariant: exactly 535 tiles** (Al-Baqarah: 48 tiles,
pages 2–49), asserted at module load in dev/build/runtime and in the tests.

### PCM
The 51 chapters — Physics 17, Chemistry 18 (Physical 7 / Inorganic 6 /
Organic 5), Mathematics 16 — with per-subject counters, completion dates,
and a small three-dot difficulty rating on every chapter.

### Plan
All 51 chapters divided across **28 September – 31 December 2026** — 95 days
— weighted by difficulty:

- **Hard** chapters get 3 days (2 when compact): 14 chapters
- **Medium** chapters get 2 days (1 when compact): 26 chapters
- **Easy** chapters get 1 day: 11 chapters

The windows tile the period exactly: Physics runs 28 Sep – 1 Nov, Chemistry
2 Nov – 3 Dec, Mathematics 4 Dec – 31 Dec. A ribbon at the top shows the
whole quarter at a glance — each segment is a chapter, sized by its days and
coloured by difficulty, filling in as chapters are completed; a small "today"
marker appears on the current window from 28 Sep onwards. Chapters can be
ticked off straight from the plan. It is a reference for pacing, not a
deadline: the app never compares you against it.

### Log
Everything recorded, grouped by day, newest first, with bookish page ranges
(`Pages 322–324, 330 (Hifdh) · Mole Concept (PCM)`).

## Tests

```bash
npm test              # data invariants: Hifdh, PCM, the plan, dates, state
                      # validation, log grouping
npm run test:smoke    # end-to-end against ./out (run after npm run build):
                      # clicks tiles, checkboxes and plan rows in a real DOM,
                      # checks counters, collapse, the Log, reload persistence,
                      # and corrupt-storage recovery
npm run typecheck
```

## Design

Warm paper, modern finish: a sticky glass tab bar with a segmented control,
soft-shadowed stationery cards, self-hosted Fraunces (variable serif, SIL
OFL 1.1 — license in `src/app/fonts/`) over the system sans, tabular
numerals for every counter, hairline borders, and calm ≤200ms motion. Fully
responsive; thumb-sized tiles on a phone. No emoji, no gamification.

## Notes on choices

- Dates are recorded as the user's **local** date (`YYYY-MM-DD`, never UTC)
  and displayed as `19 Feb`.
- Tapping a tile or checkbox records today; tapping again erases it. That is
  the entire interaction model.
- The plan's difficulty ratings are JEE consensus calls, hardcoded in
  `src/lib/plan.ts`; the schedule is derived from them, never stored — so it
  can be tuned in one place and every invariant re-asserts itself.
