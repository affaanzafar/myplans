"use client";

import { SUBJECTS } from "@/lib/chapters";
import { DIFFICULTY } from "@/lib/plan";
import { formatShort } from "@/lib/dates";
import DifficultyDots from "./DifficultyDots";

interface PcmTabProps {
  chapters: Record<string, string>;
  onToggle: (chapter: string) => void;
}

function ChapterRow({
  name,
  date,
  onToggle,
}: {
  name: string;
  date: string | undefined;
  onToggle: (name: string) => void;
}) {
  const done = date !== undefined;
  return (
    <li>
      <label className="flex cursor-pointer select-none items-center gap-3.5 rounded-xl px-2.5 py-3 transition-colors duration-150 hover:bg-paperdeep/60">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={done}
          onChange={() => onToggle(name)}
          aria-label={date ? `${name}, completed ${formatShort(date)}` : name}
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
        <span className="min-w-0 text-[15px] leading-snug text-ink">{name}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3 pl-2">
          <DifficultyDots difficulty={DIFFICULTY[name]} />
          {done && (
            <span className="rounded-full bg-paper px-2.5 py-0.5 text-[12px] tabular-nums text-muted">
              {formatShort(date)}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}

export default function PcmTab({ chapters, onToggle }: PcmTabProps) {
  return (
    <div>
      {SUBJECTS.map((subject, i) => {
        const subjectChapters = subject.groups.flatMap((g) => g.chapters);
        const done = subjectChapters.filter((c) => chapters[c] !== undefined).length;

        return (
          <section
            key={subject.name}
            aria-label={subject.name}
            className={`card overflow-hidden ${i === 0 ? "" : "mt-6"}`}
          >
            <div className="flex items-baseline gap-4 border-b border-hairline px-5 py-4">
              <h2 className="font-serif text-[20px] font-medium text-ink">{subject.name}</h2>
              <span className="ml-auto text-[13px] tabular-nums text-muted">
                <span className="text-ink">{done}</span> / {subjectChapters.length} chapters
              </span>
            </div>

            <div className="px-2.5 py-3 sm:px-3.5">
              {subject.groups.map((group) => (
                <div key={group.label ?? subject.name} className="mt-4 first:mt-1">
                  {group.label !== null && (
                    <h3 className="mb-0.5 px-2.5 font-serif text-[15px] italic text-muted">
                      {group.label}
                    </h3>
                  )}
                  <ul>
                    {group.chapters.map((name) => (
                      <ChapterRow key={name} name={name} date={chapters[name]} onToggle={onToggle} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
