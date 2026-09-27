"use client";

import { useMemo } from "react";
import {
  PLAN,
  PLAN_MONTHS,
  PLAN_STATS,
  PLAN_START,
  PLAN_END,
  PLAN_TOTAL_DAYS,
  formatWindow,
  type Difficulty,
  type PlanEntry,
} from "@/lib/plan";
import { PCM_TOTAL } from "@/lib/chapters";
import { diffDays, formatShort, todayKey } from "@/lib/dates";

interface PlanTabProps {
  chapters: Record<string, string>;
  onToggle: (chapter: string) => void;
}

const DOT: Record<Difficulty, string> = {
  hard: "bg-difficulty-hard",
  medium: "bg-difficulty-medium",
  easy: "bg-difficulty-easy",
};

const TAG: Record<Difficulty, string> = {
  hard: "bg-difficulty-hardtint text-difficulty-hard",
  medium: "bg-difficulty-mediumtint text-difficulty-medium",
  easy: "bg-difficulty-easytint text-difficulty-easy",
};

function PlanRow({
  entry,
  date,
  today,
  onToggle,
}: {
  entry: PlanEntry;
  date: string | undefined;
  today: boolean;
  onToggle: (chapter: string) => void;
}) {
  const done = date !== undefined;
  return (
    <li>
      <label
        className={`flex cursor-pointer select-none flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-xl px-2.5 py-3 transition-colors duration-150 hover:bg-paperdeep/60 ${
          today ? "bg-paperdeep/50" : ""
        }`}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={done}
          onChange={() => onToggle(entry.chapter)}
          aria-label={date ? `${entry.chapter}, completed ${formatShort(date)}` : entry.chapter}
        />
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-pcm/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card ${
            done ? "border-pcm bg-pcm" : "border-hairlinedark bg-card"
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path
              d="M2.25 6.4 4.9 9 9.75 3.2"
              strokeDasharray={12}
              strokeDashoffset={done ? 0 : 12}
              className="transition-[stroke-dashoffset] duration-150"
            />
          </svg>
        </span>
        <span className="min-w-[9.5rem] flex-1 text-[15px] leading-snug text-ink">
          {entry.chapter}
        </span>
        <span className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
          {today && (
            <span className="rounded-full bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper">
              today
            </span>
          )}
          {done && (
            <span className="rounded-full bg-paper px-2.5 py-0.5 text-[12px] tabular-nums text-muted">
              {formatShort(date)}
            </span>
          )}
          <span className="text-[12.5px] tabular-nums text-muted">
            {formatWindow(entry.start, entry.end)}
            <span className="text-muted/60"> · {entry.days}d</span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${TAG[entry.difficulty]}`}
          >
            {entry.difficulty}
          </span>
        </span>
      </label>
    </li>
  );
}

export default function PlanTab({ chapters, onToggle }: PlanTabProps) {
  const todayOffset = diffDays(PLAN_START, todayKey());
  const todayInRange = todayOffset >= 0 && todayOffset < PLAN_TOTAL_DAYS;
  const doneCount = useMemo(
    () => PLAN.filter((e) => chapters[e.chapter] !== undefined).length,
    [chapters],
  );

  const byMonth = useMemo(
    () =>
      PLAN_MONTHS.map((month, i) => {
        const next = PLAN_MONTHS[i + 1];
        return {
          label: month.label,
          entries: PLAN.filter(
            (e) => e.offset >= month.offset && (next === undefined || e.offset < next.offset),
          ),
        };
      }),
    [],
  );

  return (
    <div>
      <section aria-label="Plan summary" className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="font-serif text-[19px] font-medium text-ink">
            {formatWindow(PLAN_START, PLAN_END)} 2026
          </h2>
          <span className="text-[13px] tabular-nums text-muted">
            <span className="text-ink">{doneCount}</span> / {PCM_TOTAL} done · {PLAN_TOTAL_DAYS}{" "}
            days
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Every chapter gets days by weight — harder chapters run longer, lighter ones shorter. A
          reference for pacing, not a deadline.
        </p>

        <div data-ribbon className="relative mt-5" aria-hidden="true">
          <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-paperdeep p-[2px]">
            {PLAN.map((e) => {
              const done = chapters[e.chapter] !== undefined;
              return (
                <span
                  key={e.chapter}
                  style={{ flexGrow: e.days, flexBasis: 0 }}
                  className={`rounded-full transition-opacity duration-150 ${DOT[e.difficulty]} ${
                    done ? "" : "opacity-20"
                  }`}
                />
              );
            })}
          </div>
          {todayInRange && (
            <span
              className="pointer-events-none absolute -bottom-1 -top-1 w-[2px] rounded-full bg-ink/70"
              style={{ left: `${((todayOffset + 0.5) / PLAN_TOTAL_DAYS) * 100}%` }}
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted/80">
          <span>28 Sep</span>
          <span>31 Dec</span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted">
          {(["hard", "medium", "easy"] as Difficulty[]).map((d) => (
            <span key={d} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${DOT[d]}`} />
              <span className="tabular-nums">{PLAN_STATS[d]}</span> {d}
            </span>
          ))}
        </div>
      </section>

      {byMonth.map((month, mi) => (
        <section key={month.label} aria-label={month.label} className={mi === 0 ? "mt-7" : "mt-8"}>
          <div className="flex items-center gap-3.5 px-1">
            <h3 className="font-serif text-[17px] font-medium text-ink">{month.label}</h3>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </div>
          <ul className="card mt-3 px-2.5 py-1.5 sm:px-3">
            {month.entries.map((e) => (
              <PlanRow
                key={e.chapter}
                entry={e}
                date={chapters[e.chapter]}
                today={
                  todayInRange && todayOffset >= e.offset && todayOffset < e.offset + e.days
                }
                onToggle={onToggle}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
