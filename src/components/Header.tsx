import { HIFDH_TOTAL } from "@/lib/surahs";
import { PCM_TOTAL } from "@/lib/chapters";

interface StatProps {
  dataStat: string;
  label: string;
  done: number;
  total: number;
  barClassName: string;
}

function Stat({ dataStat, label, done, total, barClassName }: StatProps) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  return (
    <div data-stat={dataStat} className="card min-w-[140px] flex-1 p-4 sm:min-w-[176px] sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-[14px] tracking-wide text-muted [font-variant:small-caps]">
          {label}
        </span>
        <span className="tabular-nums text-[13px] text-muted">
          <span className="font-serif text-[26px] font-medium leading-none text-ink">{done}</span> /{" "}
          {total}
        </span>
      </div>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-hairline/80">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ease-out ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Header({ hifdhDone, pcmDone }: { hifdhDone: number; pcmDone: number }) {
  return (
    <header className="pt-12 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
        <div>
          <div className="flex items-center gap-3.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-[7px] bg-hifdh" />
              <span className="h-2.5 w-2.5 rounded-[7px] bg-pcm" />
            </span>
            <h1 className="font-serif text-[40px] font-medium leading-none tracking-tight text-ink">
              Ledger
            </h1>
          </div>
          <p className="mt-3 font-serif text-[15px] italic text-muted">
            pages and chapters as they actually happen
          </p>
        </div>
        <div className="flex w-full gap-4 sm:w-auto">
          <Stat
            dataStat="hifdh"
            label="Hifdh"
            done={hifdhDone}
            total={HIFDH_TOTAL}
            barClassName="bg-hifdh"
          />
          <Stat
            dataStat="pcm"
            label="PCM"
            done={pcmDone}
            total={PCM_TOTAL}
            barClassName="bg-pcm"
          />
        </div>
      </div>
    </header>
  );
}
