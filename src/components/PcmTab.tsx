"use client";

import { SUBJECTS } from "@/lib/chapters";
import { formatShort } from "@/lib/dates";

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
      <label className="flex cursor-pointer select-none items-center gap-3.5 rounded-lg py-3 pl-2 pr-2 transition-colors duration-150 hover:bg-paperdeep">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={done}
          onChange={() => onToggle(name)}
          aria-label={date ? `${name}, completed ${formatShort(date)}` : name}
        />
        <span
          className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-pcm/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper ${
            done ? "border-pcm bg-pcm" : "border-hairlinedark bg-card"
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            className={`h-3 w-3 text-white transition-opacity duration-150 ${
              done ? "opacity-100" : "opacity-0"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.25 6.4 4.9 9 9.75 3.2" />
          </svg>
        </span>
        <span className="min-w-0 text-[15px] leading-snug text-ink">{name}</span>
        {done && (
          <span className="ml-auto shrink-0 pl-3 text-[13px] tabular-nums text-muted">
            {formatShort(date)}
          </span>
        )}
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
          <section key={subject.name} aria-label={subject.name} className={i === 0 ? "" : "mt-12"}>
            <div className="flex items-baseline gap-4 border-b border-hairline pb-2.5">
              <h2 className="font-serif text-[21px] font-medium text-ink">{subject.name}</h2>
              <span className="ml-auto text-[13px] tabular-nums text-muted">
                <span className="text-ink">{done}</span> / {subjectChapters.length} chapters
              </span>
            </div>

            {subject.groups.map((group) => (
              <div key={group.label ?? subject.name} className="mt-5">
                {group.label !== null && (
                  <h3 className="mb-1.5 pl-2 font-serif text-[15px] italic text-muted">
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
          </section>
        );
      })}
    </div>
  );
}
