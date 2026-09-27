"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { isValidState, type LedgerState } from "@/lib/state";
import { todayKey } from "@/lib/dates";

interface FooterProps {
  state: LedgerState | null;
  onRestore: (state: LedgerState) => void;
}

const buttonClass =
  "rounded-full border border-hairline bg-card px-4 py-1.5 text-[13px] text-ink/80 shadow-soft transition-colors duration-150 hover:border-hairlinedark hover:text-ink active:bg-paperdeep disabled:opacity-50";

export default function Footer({ state, onRestore }: FooterProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null);

  const backup = () => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-backup-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus({ error: false, text: "Backup downloaded." });
  };

  const restore = () => {
    setStatus(null);
    fileInput.current?.click();
  };

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (isValidState(parsed)) {
        onRestore(parsed);
        setStatus({ error: false, text: "Backup restored." });
      } else {
        setStatus({ error: true, text: "That file is not a valid Ledger backup." });
      }
    } catch {
      setStatus({ error: true, text: "That file could not be read." });
    }
  };

  return (
    <footer className="mt-14 border-t border-hairline">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={backup} disabled={!state} className={buttonClass}>
            Backup
          </button>
          <button type="button" onClick={restore} disabled={!state} className={buttonClass}>
            Restore
          </button>
          {status && (
            <span
              role="status"
              className={`text-[13px] ${status.error ? "text-ink/75" : "text-muted"}`}
            >
              {status.text}
            </span>
          )}
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onFileChosen}
          />
        </div>
        <p className="mt-4 text-[12px] text-muted/80">saved automatically in this browser</p>
      </div>
      <p className="mt-14 pb-12 text-center font-serif text-[15px] italic text-muted">Go on.</p>
    </footer>
  );
}
