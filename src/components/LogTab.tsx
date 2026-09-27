"use client";

import { useMemo } from "react";
import type { LedgerState } from "@/lib/state";
import { buildLogDays, formatPageList } from "@/lib/log";
import { formatHeading } from "@/lib/dates";

export default function LogTab({ state }: { state: LedgerState }) {
  const days = useMemo(() => buildLogDays(state), [state]);

  if (days.length === 0) {
    return <p className="font-serif text-[15px] italic text-muted">Nothing recorded yet.</p>;
  }

  return (
    <div>
      {days.map((day, i) => (
        <section
          key={day.date}
          aria-label={`Completions on ${day.date}`}
          className={`card p-5 ${i === 0 ? "" : "mt-4"}`}
        >
          <div className="flex items-center gap-3.5">
            <h2 className="font-serif text-[17px] font-medium text-ink">
              {formatHeading(day.date)}
            </h2>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink/85">
            {day.pages.length > 0 && (
              <>
                Pages <span className="tabular-nums">{formatPageList(day.pages)}</span>{" "}
                <span className="rounded-full bg-hifdh/10 px-2 py-0.5 text-[12px] text-hifdh">
                  (Hifdh)
                </span>
              </>
            )}
            {day.pages.length > 0 && day.chapters.length > 0 && (
              <span className="text-muted"> · </span>
            )}
            {day.chapters.length > 0 && (
              <>
                {day.chapters.join(", ")}{" "}
                <span className="rounded-full bg-pcm/10 px-2 py-0.5 text-[12px] text-pcm">
                  (PCM)
                </span>
              </>
            )}
          </p>
        </section>
      ))}
    </div>
  );
}
