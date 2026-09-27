"use client";

import { useMemo } from "react";
import {
  PLAN,
  PLAN_DAYS,
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
import { slotKey } from "@/lib/state";

interface PlanTabProps {
  chapters: Record<string, string>;
  planDays: Record<string, string>;
  onToggleDay: (chapter: string, index: number) => void;
}

const DOT: Record<Difficulty, string> = {
  hard: "bg-difficulty-hard",
  medium: "bg-difficulty-medium",
  easy: "bg-difficulty-easy",
};

const CHIP_DONE: Record<Difficulty, string> = {
  hard: "border-difficulty-hard bg-difficulty-hard hover:border-difficulty-harddeep hover:bg-difficulty-harddeep",
  medium:
    "border-difficulty-medium bg-difficulty-medium hover:border-difficulty-mediumdeep hover:bg-difficulty-mediumdeep",
  easy: "border-difficulty-easy bg-difficulty-easy hover:border-difficulty-easydeep hover:bg-difficulty-easydeep",
};

const TAG: Record<Difficulty, string> = {
  hard: "bg-difficulty-hardtint text-difficulty-hard",
  medium: "bg-difficulty-mediumtint text-difficulty-medium",
  easy: "bg-difficulty-easytint text-difficulty-easy",
};

interface DayChipProps {
  entry: PlanEntry;
  index: number;
  date: string | undefined;
  suggested: boolean;
  onToggle: (chapter: string, index: number) => void;
}

function DayChip({ entry, index, date, suggested, onToggle }: DayChipProps) {
  const done = date !== undefined;
  return (
    <span className="group relative">
      <button
        type="button"
        aria-pressed={done}
        aria-label={`${entry.chapter}, day ${index} of ${entry.days}`}
        onClick={() => onToggle(entry.chapter, index)}
        className={`h-9 w-9 rounded-[9px] border text-[11px] tabular-nums transition duration-150 active:scale-[0.96] ${
          suggested && !done ? "ring-2 ring-ink/25 ring-offset-1 ring-offset-card" : ""
        } ${
          done
            ? `${CHIP_DONE[entry.difficulty]} text-white shadow-soft`
            : "border-hairline bg-card text-muted hover:border-hairlinedark hover:text-ink"
        }`}
      >
        {index}/{entry.days}
      </button>
      {done && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-[3px] text-[11px] tabular-nums text-paper opacity-0 shadow-soft transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100"
        >
          {formatShort(date)}
        </span>
      )}
    </span>
  );
}

interface PlanRowProps {
  entry: PlanEntry;
  planDays: Record<string, string>;
  chapterDate: string | undefined;
  todayIndex: number | null;
  onToggleDay: (chapter: string, index: number) => void;
}

function PlanRow({ entry, planDays, chapterDate, todayIndex, onToggleDay }: PlanRowProps) {
  const ticked = Array.from(
    { length: entry.days },
    (_, i) => planDays[slotKey(entry.chapter, i + 1)] !== undefined,
  ).filter(Boolean).length;
  const complete = ticked === entry.days;

  return (
    <li
      className={`rounded-xl px-2.5 py-3 transition-colors duration-150 hover:bg-paperdeep/50 ${
        complete ? "bg-paperdeep/40" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-[15px] leading-snug text-ink">{entry.chapter}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {Array.from({ length: entry.days }, (_, i) => {
            const index = i + 1;
            return (
              <DayChip
                key={index}
                entry={entry}
                index={index}
                date={planDays[slotKey(entry.chapter, index)]}
                suggested={todayIndex === index}
                onToggle={onToggleDay}
              />
            );
          })}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-0.5 text-[12px] text-muted">
        <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${TAG[entry.difficulty]}`}>
          {entry.difficulty}
        </span>
        <span className="tabular-nums">{formatWindow(entry.start, entry.end)}</span>
        {todayIndex !== null && (
          <span className="rounded-full bg-ink/85 px-2 py-0.5 text-[10px] uppercase tracking-wide text-paper">
            today
          </span>
        )}
        {chapterDate && (
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-[12px] tabular-nums text-muted">
            {formatShort(chapterDate)}
          </span>
        )}
      </div>
    </li>
  );
}

export default function PlanTab({ chapters, planDays, onToggleDay }: PlanTabProps) {
  const todayOffset = diffDays(PLAN_START, todayKey());
  const todayInRange = todayOffset >= 0 && todayOffset < PLAN_TOTAL_DAYS;
  const daysDone = useMemo(() => Object.keys(planDays).length, [planDays]);
  const chaptersDone = useMemo(
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

  const todayIndexOf = (entry: PlanEntry): number | null =>
    todayInRange && todayOffset >= entry.offset && todayOffset < entry.offset + entry.days
      ? todayOffset - entry.offset + 1
      : null;

  return (
    <div>
      <section aria-label="Plan summary" className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="font-serif text-[19px] font-medium text-ink">
            {formatWindow(PLAN_START, PLAN_END)} 2026
          </h2>
          <div className="text-right">
            <div className="text-[13px] tabular-nums text-muted">
              <span className="font-serif text-[26px] font-medium leading-none text-ink">
                {daysDone}
              </span>{" "}
              / {PLAN_TOTAL_DAYS} days
            </div>
            <div className="mt-1 text-[12px] tabular-nums text-muted/80">
              {chaptersDone} / {PCM_TOTAL} chapters
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Divided into single study days — a hard chapter gets 3, a medium 2, an easy 1. Tick each
          day as it happens; when all of a chapter&apos;s days are ticked, it counts as done.
        </p>

        <div data-ribbon className="relative mt-5" aria-hidden="true">
          <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-paperdeep p-[2px] sm:h-3 sm:gap-[2px]">
            {PLAN_DAYS.map((d) => {
              const done = planDays[slotKey(d.chapter, d.index)] !== undefined;
              return (
                <span
                  key={d.offset}
                  style={{ flexGrow: 1, flexBasis: 0 }}
                  className={`rounded-full transition-opacity duration-150 ${DOT[d.difficulty]} ${
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
                planDays={planDays}
                chapterDate={chapters[e.chapter]}
                todayIndex={todayIndexOf(e)}
                onToggleDay={onToggleDay}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
