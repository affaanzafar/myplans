"use client";

import { useState } from "react";
import { HIFDH_SECTIONS, HIFDH_TOTAL } from "@/lib/surahs";
import { formatShort } from "@/lib/dates";

interface HifdhTabProps {
  pages: Record<string, string>;
  onToggle: (page: number) => void;
}

function PageTile({
  page,
  date,
  onToggle,
}: {
  page: number;
  date: string | undefined;
  onToggle: (page: number) => void;
}) {
  const done = date !== undefined;
  return (
    <span className="group relative">
      <button
        type="button"
        aria-pressed={done}
        aria-label={done ? `Page ${page}, memorised ${formatShort(date)}` : `Page ${page}`}
        onClick={() => onToggle(page)}
        className={`aspect-square w-full rounded-[10px] border text-[13px] tabular-nums transition duration-150 active:scale-[0.96] ${
          done
            ? "border-hifdh bg-hifdh text-white shadow-soft hover:border-hifdhdeep hover:bg-hifdhdeep"
            : "border-hairline bg-card text-muted hover:-translate-y-[1px] hover:border-hairlinedark hover:text-ink hover:shadow-soft active:bg-paperdeep"
        }`}
      >
        {page}
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

export default function HifdhTab({ pages, onToggle }: HifdhTabProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  // The tab must display exactly 535 page tiles. The data module asserts this
  // loudly already; this re-checks it at render time in development.
  if (process.env.NODE_ENV !== "production") {
    const total = HIFDH_SECTIONS.reduce((n, s) => n + s.pages.length, 0);
    if (total !== HIFDH_TOTAL) {
      throw new Error(
        `Hifdh invariant violated: this tab must show exactly ${HIFDH_TOTAL} page tiles, not ${total}.`,
      );
    }
  }

  const toggleCollapse = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div>
      {HIFDH_SECTIONS.map((section, i) => {
        const done = section.pages.filter((p) => pages[String(p)] !== undefined).length;
        const complete = done === section.pages.length;
        const open = !collapsed.has(section.name);

        return (
          <section
            key={section.name}
            aria-label={section.name}
            className={`card p-4 transition-colors duration-200 sm:p-5 ${i === 0 ? "" : "mt-4"} ${
              complete ? "border-hifdh/30" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggleCollapse(section.name)}
              aria-expanded={open}
              aria-controls={`surah-${i}`}
              className="flex w-full items-baseline gap-3 rounded-lg px-1.5 py-1 text-left transition-colors duration-150 hover:bg-paperdeep/60"
            >
              <span className="font-serif text-[19px] font-medium leading-snug text-ink">
                {section.name}
              </span>
              {section.first !== section.last && (
                <span className="text-[12px] tabular-nums text-muted/80">
                  pages {section.first}–{section.last}
                </span>
              )}
              <span className="ml-auto flex items-center gap-2.5 pl-2">
                <span
                  className={`text-[13px] tabular-nums transition-colors duration-150 ${
                    complete ? "text-hifdh" : "text-muted"
                  }`}
                >
                  {done}/{section.pages.length}
                </span>
                <svg
                  viewBox="0 0 12 12"
                  className={`h-3 w-3 shrink-0 text-muted transition-transform duration-150 ${
                    open ? "" : "-rotate-90"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.75 4.5 6 7.75 9.25 4.5" />
                </svg>
              </span>
            </button>

            {open && (
              <div
                id={`surah-${i}`}
                className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5"
              >
                {section.pages.map((p) => (
                  <PageTile key={p} page={p} date={pages[String(p)]} onToggle={onToggle} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
