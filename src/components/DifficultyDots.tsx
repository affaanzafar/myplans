import type { Difficulty } from "@/lib/plan";

const FILLED: Record<Difficulty, number> = { hard: 3, medium: 2, easy: 1 };
const DOT: Record<Difficulty, string> = {
  hard: "bg-difficulty-hard",
  medium: "bg-difficulty-medium",
  easy: "bg-difficulty-easy",
};

/** Three quiet dots: hard is full, medium two-thirds, easy one. */
export default function DifficultyDots({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-[5px] w-[5px] rounded-full ${i < FILLED[difficulty] ? DOT[difficulty] : "bg-hairline"}`}
        />
      ))}
    </span>
  );
}
