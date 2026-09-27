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

## The data, and its invariants

### Hifdh

Already memorized, and therefore not tracked: pages 293–321 (Al-Kahf, Maryam,
Taha) and 565–604 (Surah 68–114). Tracked: pages 1–292 and 322–564 — exactly
**535 pages**, shown as tiles grouped under 64 surah headings (Madani
604-page layout).

Boundary pages are shared between surahs (Al-Baqarah ends on 49 and Aal Imran
begins... on 50; An-Nisa and Al-Ma'idah both touch 106). The rule: pages are
assigned to the **first** surah whose range includes them, so every page
appears exactly once — page 106 shows under An-Nisa only.

**Invariant: the Hifdh tab displays exactly 535 tiles** (Al-Baqarah shows 48,
pages 2–49). This is asserted at module load in `src/lib/surahs.ts` — in dev,
at build time, in the browser, and in the test suite — and the app fails
loudly if it is ever wrong.

### PCM

Exactly **51 chapters**: Physics 17; Chemistry 18 (Physical 7, Inorganic 6,
Organic 5); Mathematics 16 (Algebra 6, Sets-Functions-Calculus 6,
Vectors-Coordinate Geometry 4). Asserted the same way in
`src/lib/chapters.ts`.

## Tests

```bash
npm test              # data invariants, dates, state validation, log grouping
npm run test:smoke    # end-to-end against ./out (run after npm run build):
                      # clicks tiles and checkboxes in a real DOM, checks
                      # counters, collapse, the Log, reload persistence,
                      # and corrupt-storage recovery
npm run typecheck
```

## Notes on choices

- Dates are recorded as the user's **local** date (`YYYY-MM-DD`, never UTC)
  and displayed as `19 Feb`. The Log groups by day, newest first, and
  compresses runs of pages bookishly: `Pages 322–324, 330`.
- The serif is [Fraunces](https://github.com/undercasetype/Fraunces) (SIL
  OFL 1.1; license in `src/app/fonts/`), self-hosted as a variable font via
  `next/font/local` so builds and the app itself work with no network.
  System sans carries the UI text; all counters use tabular numerals.
- Tapping a tile or checkbox records today; tapping again erases it. That is
  the entire interaction model.
