/**
 * PCM data — 51 chapters for JEE, grouped and in order.
 * Physics 17, Chemistry 18 (Physical 7 / Inorganic 6 / Organic 5),
 * Mathematics 16 (Algebra 6 / Sets, Functions & Calculus 6 /
 * Vectors & Coordinate Geometry 4).
 */

export interface ChapterGroup {
  /** Subgroup label, or null when the subject has no subgroups (Physics). */
  label: string | null;
  chapters: string[];
}

export interface Subject {
  name: string;
  groups: ChapterGroup[];
}

export const SUBJECTS: Subject[] = [
  {
    name: "Physics",
    groups: [
      {
        label: null,
        chapters: [
          "Kinematics 1D & Vectors",
          "Kinematics 2D & Relative Motion",
          "Laws of Motion & Friction",
          "Work, Power & Energy",
          "System of Particles & Centre of Mass",
          "Circular Motion",
          "Rotational Motion (Rigid Bodies)",
          "Gravitation",
          "Properties of Solids & Fluids",
          "Thermal Properties & Thermodynamics",
          "SHM & Sound Waves",
          "Electrostatics, Gauss Law & Capacitance",
          "Current Electricity",
          "Magnetic Effects of Current & Magnetism",
          "Electromagnetic Induction & AC",
          "Ray Optics & Wave Optics",
          "Modern Physics & Semiconductors",
        ],
      },
    ],
  },
  {
    name: "Chemistry",
    groups: [
      {
        label: "Physical",
        chapters: [
          "Mole Concept",
          "Structure of Atom",
          "Chemical Thermodynamics",
          "Chemical & Ionic Equilibrium",
          "Dilute Solutions & Colligative Properties",
          "Electrochemistry",
          "Chemical Kinetics",
        ],
      },
      {
        label: "Inorganic",
        chapters: [
          "Periodic Table & Periodic Properties",
          "Chemical Bonding",
          "Coordination Compounds",
          "P-Block & D/F-Block Elements",
          "IUPAC & Redox Reactions",
          "Amines, Biomolecules & Inorganic Polish",
        ],
      },
      {
        label: "Organic",
        chapters: [
          "General Organic Chemistry (GOC)",
          "Isomerism & Hydrocarbons",
          "Haloalkanes & Haloarenes",
          "Alcohols, Phenols & Ethers",
          "Aldehydes, Ketones & Carboxylic Acids",
        ],
      },
    ],
  },
  {
    name: "Mathematics",
    groups: [
      {
        label: "Algebra",
        chapters: [
          "Quadratic Equations",
          "Complex Numbers",
          "Sequence & Series",
          "Permutations & Combinations",
          "Binomial Theorem",
          "Matrices & Determinants",
        ],
      },
      {
        label: "Sets, Functions & Calculus",
        chapters: [
          "Sets & Relations",
          "Functions & Inverse Trig",
          "Limits, Continuity & Differentiability",
          "Application of Derivatives",
          "Indefinite & Definite Integration",
          "Differential Equations & Area Under Curve",
        ],
      },
      {
        label: "Vectors & Coordinate Geometry",
        chapters: [
          "Vector Algebra",
          "3D Geometry",
          "Straight Lines & Circles",
          "Conic Sections, Probability & Statistics",
        ],
      },
    ],
  },
];

/** The number of chapters. */
export const PCM_TOTAL = 51;

/** All chapters in curriculum order. */
export const ALL_CHAPTERS: string[] = SUBJECTS.flatMap((s) => s.groups.flatMap((g) => g.chapters));

export const CHAPTER_SET: ReadonlySet<string> = new Set(ALL_CHAPTERS);

/**
 * Invariants of the PCM data. Runs wherever the module is loaded and fails
 * loudly if the data is ever wrong.
 */
function assertChapterInvariants(): void {
  if (ALL_CHAPTERS.length !== PCM_TOTAL) {
    throw new Error(
      `PCM invariant violated: there must be exactly ${PCM_TOTAL} chapters, but the data yields ${ALL_CHAPTERS.length}.`,
    );
  }
  if (CHAPTER_SET.size !== PCM_TOTAL) {
    throw new Error("PCM invariant violated: chapter names must be unique.");
  }
  const expectedSubjectTotals: Record<string, number> = {
    Physics: 17,
    Chemistry: 18,
    Mathematics: 16,
  };
  for (const subject of SUBJECTS) {
    const total = subject.groups.reduce((n, g) => n + g.chapters.length, 0);
    if (total !== expectedSubjectTotals[subject.name]) {
      throw new Error(
        `PCM invariant violated: ${subject.name} must have ${expectedSubjectTotals[subject.name]} chapters, but has ${total}.`,
      );
    }
  }
}

assertChapterInvariants();
