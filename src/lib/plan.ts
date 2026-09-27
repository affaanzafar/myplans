/**
 * The plan: all 51 PCM chapters divided across 28 September – 31 December 2026
 * (95 days), weighted by difficulty — harder chapters get more days, lighter
 * ones fewer. It is a reference for pacing, not a deadline: nothing in the app
 * ever nags about it.
 *
 * Day weights: hard = 3, medium = 2, easy = 1; a handful of chapters that sit
 * lighter within their tier (a compact hard chapter, a formula-driven medium)
 * step down one day, so the 51 windows tile 28 Sep – 31 Dec exactly.
 */

import { ALL_CHAPTERS, CHAPTER_SET, PCM_TOTAL, SUBJECTS } from "./chapters";
import { addDaysKey, dayOfMonth, diffDays, monthShort } from "./dates";

export type Difficulty = "hard" | "medium" | "easy";

export const PLAN_START = "2026-09-28";
export const PLAN_END = "2026-12-31";
export const PLAN_TOTAL_DAYS = 95;

/** Difficulty of each of the 51 chapters (JEE consensus). */
export const DIFFICULTY: Record<string, Difficulty> = {
  // Physics
  "Kinematics 1D & Vectors": "easy",
  "Kinematics 2D & Relative Motion": "medium",
  "Laws of Motion & Friction": "medium",
  "Work, Power & Energy": "medium",
  "System of Particles & Centre of Mass": "hard",
  "Circular Motion": "medium",
  "Rotational Motion (Rigid Bodies)": "hard",
  Gravitation: "medium",
  "Properties of Solids & Fluids": "medium",
  "Thermal Properties & Thermodynamics": "hard",
  "SHM & Sound Waves": "medium",
  "Electrostatics, Gauss Law & Capacitance": "hard",
  "Current Electricity": "medium",
  "Magnetic Effects of Current & Magnetism": "medium",
  "Electromagnetic Induction & AC": "hard",
  "Ray Optics & Wave Optics": "medium",
  "Modern Physics & Semiconductors": "easy",
  // Chemistry — Physical
  "Mole Concept": "medium",
  "Structure of Atom": "easy",
  "Chemical Thermodynamics": "hard",
  "Chemical & Ionic Equilibrium": "hard",
  "Dilute Solutions & Colligative Properties": "medium",
  Electrochemistry: "medium",
  "Chemical Kinetics": "medium",
  // Chemistry — Inorganic
  "Periodic Table & Periodic Properties": "easy",
  "Chemical Bonding": "medium",
  "Coordination Compounds": "medium",
  "P-Block & D/F-Block Elements": "hard",
  "IUPAC & Redox Reactions": "easy",
  "Amines, Biomolecules & Inorganic Polish": "medium",
  // Chemistry — Organic
  "General Organic Chemistry (GOC)": "hard",
  "Isomerism & Hydrocarbons": "medium",
  "Haloalkanes & Haloarenes": "medium",
  "Alcohols, Phenols & Ethers": "easy",
  "Aldehydes, Ketones & Carboxylic Acids": "hard",
  // Mathematics — Algebra
  "Quadratic Equations": "easy",
  "Complex Numbers": "medium",
  "Sequence & Series": "medium",
  "Permutations & Combinations": "hard",
  "Binomial Theorem": "medium",
  "Matrices & Determinants": "easy",
  // Mathematics — Sets, Functions & Calculus
  "Sets & Relations": "easy",
  "Functions & Inverse Trig": "medium",
  "Limits, Continuity & Differentiability": "hard",
  "Application of Derivatives": "medium",
  "Indefinite & Definite Integration": "hard",
  "Differential Equations & Area Under Curve": "medium",
  // Mathematics — Vectors & Coordinate Geometry
  "Vector Algebra": "easy",
  "3D Geometry": "medium",
  "Straight Lines & Circles": "easy",
  "Conic Sections, Probability & Statistics": "hard",
};

const TIER_DAYS: Record<Difficulty, number> = { hard: 3, medium: 2, easy: 1 };

/**
 * Chapters that sit lighter within their tier and step down one day:
 * compact hard chapters get 2, compact mediums get 1. With these, the 51
 * windows sum to exactly 95 days, 28 Sep – 31 Dec 2026.
 */
const COMPACT_DAYS: Record<string, number> = {
  "System of Particles & Centre of Mass": 2,
  "Chemical Thermodynamics": 2,
  "General Organic Chemistry (GOC)": 2,
  "Limits, Continuity & Differentiability": 2,
  "SHM & Sound Waves": 1,
  "Dilute Solutions & Colligative Properties": 1,
  Electrochemistry: 1,
  "Chemical Kinetics": 1,
  "Binomial Theorem": 1,
  "3D Geometry": 1,
};

const SUBJECT_OF: ReadonlyMap<string, string> = new Map(
  SUBJECTS.flatMap((s) => s.groups.flatMap((g) => g.chapters.map((c) => [c, s.name] as const))),
);

export interface PlanEntry {
  chapter: string;
  subject: string;
  difficulty: Difficulty;
  days: number;
  /** Inclusive window, local dates. */
  start: string;
  end: string;
  /** 0-based day index within the plan. */
  offset: number;
}

function buildPlan(): PlanEntry[] {
  const entries: PlanEntry[] = [];
  let cursor = PLAN_START;
  let offset = 0;
  for (const chapter of ALL_CHAPTERS) {
    const difficulty = DIFFICULTY[chapter];
    const days = COMPACT_DAYS[chapter] ?? TIER_DAYS[difficulty];
    entries.push({
      chapter,
      subject: SUBJECT_OF.get(chapter) ?? "",
      difficulty,
      days,
      start: cursor,
      end: addDaysKey(cursor, days - 1),
      offset,
    });
    cursor = addDaysKey(cursor, days);
    offset += days;
  }
  return entries;
}

/** The 51 chapters, in curriculum order, as contiguous date windows. */
export const PLAN: PlanEntry[] = buildPlan();

export const PLAN_STATS: { hard: number; medium: number; easy: number } = {
  hard: PLAN.filter((e) => e.difficulty === "hard").length,
  medium: PLAN.filter((e) => e.difficulty === "medium").length,
  easy: PLAN.filter((e) => e.difficulty === "easy").length,
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Months the plan crosses, with the day offset at which each begins. */
export const PLAN_MONTHS: { label: string; offset: number }[] = (() => {
  const months: { label: string; offset: number }[] = [];
  let last = "";
  for (const entry of PLAN) {
    const key = entry.start.slice(0, 7);
    if (key !== last) {
      months.push({ label: MONTH_NAMES[Number(key.slice(5, 7)) - 1], offset: entry.offset });
      last = key;
    }
  }
  return months;
})();

/** "28 Sep" / "14–16 Oct" / "30 Sep – 2 Oct". */
export function formatWindow(start: string, end: string): string {
  if (start === end) return `${dayOfMonth(start)} ${monthShort(start)}`;
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${dayOfMonth(start)}\u2013${dayOfMonth(end)} ${monthShort(end)}`;
  }
  return `${dayOfMonth(start)} ${monthShort(start)} \u2013 ${dayOfMonth(end)} ${monthShort(end)}`;
}

/**
 * Invariants of the plan. Runs wherever the module is loaded and fails
 * loudly if the data is ever wrong.
 */
function assertPlanInvariants(): void {
  for (const chapter of ALL_CHAPTERS) {
    if (DIFFICULTY[chapter] === undefined) {
      throw new Error(`Plan invariant violated: no difficulty rating for "${chapter}".`);
    }
  }
  for (const name of Object.keys(DIFFICULTY)) {
    if (!CHAPTER_SET.has(name)) {
      throw new Error(`Plan invariant violated: difficulty rating for unknown chapter "${name}".`);
    }
  }

  if (PLAN.length !== PCM_TOTAL) {
    throw new Error(
      `Plan invariant violated: expected ${PCM_TOTAL} planned chapters, got ${PLAN.length}.`,
    );
  }

  let total = 0;
  for (let i = 0; i < PLAN.length; i += 1) {
    const entry = PLAN[i];
    total += entry.days;

    // Difficulty must map to time: hard 2–3 days, medium 1–2, easy 1.
    if (entry.difficulty === "hard" && (entry.days < 2 || entry.days > 3)) {
      throw new Error(`Plan invariant violated: hard chapter "${entry.chapter}" has ${entry.days} days.`);
    }
    if (entry.difficulty === "medium" && (entry.days < 1 || entry.days > 2)) {
      throw new Error(`Plan invariant violated: medium chapter "${entry.chapter}" has ${entry.days} days.`);
    }
    if (entry.difficulty === "easy" && entry.days !== 1) {
      throw new Error(`Plan invariant violated: easy chapter "${entry.chapter}" has ${entry.days} days.`);
    }
    if (diffDays(entry.start, entry.end) !== entry.days - 1) {
      throw new Error(`Plan invariant violated: window length mismatch for "${entry.chapter}".`);
    }
    if (i > 0 && PLAN[i - 1].end !== addDaysKey(entry.start, -1)) {
      throw new Error(`Plan invariant violated: windows must be contiguous at "${entry.chapter}".`);
    }
  }

  if (total !== PLAN_TOTAL_DAYS) {
    throw new Error(
      `Plan invariant violated: the plan must span exactly ${PLAN_TOTAL_DAYS} days, got ${total}.`,
    );
  }
  if (PLAN[0].start !== PLAN_START || PLAN[PLAN.length - 1].end !== PLAN_END) {
    throw new Error("Plan invariant violated: the plan must run 28 Sep – 31 Dec 2026.");
  }
  if (PLAN_STATS.hard + PLAN_STATS.medium + PLAN_STATS.easy !== PCM_TOTAL) {
    throw new Error("Plan invariant violated: difficulty counts must sum to 51.");
  }
}

assertPlanInvariants();
