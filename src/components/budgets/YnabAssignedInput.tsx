"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format-money";
import { useBudgetStore } from "@/store/useBudgetStore";

function parseMoneyInput(raw: string): number {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (t === "" || t === ".") return NaN;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

export function YnabAssignedInput({
  periodKey,
  categoryId,
  assigned,
  maxAssigned,
  halfSlot,
}: {
  periodKey: string;
  categoryId: string;
  assigned: number;
  maxAssigned: number;
  /** When set, edits one paycheck slice; period totals stay first + second. */
  halfSlot?: "first" | "second";
}) {
  const setPeriodAssignment = useBudgetStore((s) => s.setPeriodAssignment);
  const setPeriodAssignmentHalf = useBudgetStore(
    (s) => s.setPeriodAssignmentHalf
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    () => (assigned > 0 ? assigned.toFixed(2) : "0.00")
  );
  const displayValue = editing
    ? draft
    : assigned > 0
      ? assigned.toFixed(2)
      : "0.00";

  function commit() {
    const v = parseMoneyInput(draft);
    if (Number.isNaN(v) || v <= 0) {
      if (halfSlot) {
        setPeriodAssignmentHalf(periodKey, halfSlot, categoryId, 0);
      } else {
        setPeriodAssignment(periodKey, categoryId, 0);
      }
      setDraft("0.00");
      return;
    }
    /** Save the amount the user entered. Do not clamp to maxAssigned — that cap is RTA-based and is often 0 with no income logged, which would wipe every assignment. Overspending RTA is allowed (YNAB-style). */
    if (halfSlot) {
      setPeriodAssignmentHalf(periodKey, halfSlot, categoryId, v);
    } else {
      setPeriodAssignment(periodKey, categoryId, v);
    }
    setDraft(v.toFixed(2));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="field flex min-w-[6.75rem] max-w-[8.5rem] items-center gap-1 py-2 pl-3 pr-2 font-mono tabular-nums transition-[border-color,box-shadow] focus-within:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus-within:shadow-[0_0_0_3px_var(--accent-muted)]"
      >
        <span className="shrink-0 select-none text-[var(--muted)]" aria-hidden>
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={halfSlot ? `Assigned ${halfSlot}` : "Assigned amount"}
          value={displayValue}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => {
            setEditing(true);
            setDraft(displayValue);
          }}
          onBlur={() => {
            commit();
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none ring-0 placeholder:text-[var(--muted)]"
          placeholder="0.00"
        />
      </div>
      {(maxAssigned > 0 || assigned > 0.001) && (
        <span
          className={`text-[10px] ${assigned > maxAssigned + 0.001 ? "text-negative" : "text-[var(--muted)]"}`}
          title="RTA-based suggestion only — you can assign more (Ready to Assign goes negative), same as YNAB."
        >
          {assigned > maxAssigned + 0.001
            ? maxAssigned <= 0.001
              ? "No RTA this period — assignment still saved"
              : `Over RTA (about ${formatMoney(maxAssigned)} available)`
            : `About ${formatMoney(maxAssigned)} free in RTA`}
        </span>
      )}
    </div>
  );
}
