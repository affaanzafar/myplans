import { HIFDH_TOTAL } from "@/lib/surahs";
import { PCM_TOTAL } from "@/lib/chapters";

interface StatProps {
  label: string;
  done: number;
  total: number;
  barClassName: string;
}

function Stat({ label, done, total, barClassName }: StatProps) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <div className="w-36 sm:w-44">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[15px] tracking-wide text-muted [font-variant:small-caps]">
          {label}
        </span>
        <span className="tabular-nums text-[13px] text-muted">
          <span className="text-ink">{done}</span> / {total}
        </span>
      </div>
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-hairline">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-out ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Header({ hifdhDone, pcmDone }: { hifdhDone: number; pcmDone: number }) {
  return (
    <header className="pt-12 sm:pt-16">
      <h1 className="font-serif text-[38px] font-medium leading-none tracking-tight text-ink">
        Ledger
      </h1>
      <p className="mt-3 font-serif text-[15px] italic text-muted">
        pages and chapters as they actually happen
      </p>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-6 sm:gap-x-12">
        <Stat label="Hifdh" done={hifdhDone} total={HIFDH_TOTAL} barClassName="bg-hifdh" />
        <Stat label="PCM" done={pcmDone} total={PCM_TOTAL} barClassName="bg-pcm" />
      </div>
    </header>
  );
}
