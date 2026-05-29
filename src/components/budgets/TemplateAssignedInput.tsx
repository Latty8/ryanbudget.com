"use client";

import { useState } from "react";
import { useBudgetStore } from "@/store/useBudgetStore";

function parseMoneyInput(raw: string): number {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (t === "" || t === ".") return NaN;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

export function TemplateAssignedInput({
  categoryId,
  assigned,
  halfSlot,
}: {
  categoryId: string;
  assigned: number;
  halfSlot?: "first" | "second";
}) {
  const setTemplateAssignment = useBudgetStore((s) => s.setTemplateAssignment);
  const setTemplateAssignmentHalf = useBudgetStore(
    (s) => s.setTemplateAssignmentHalf
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
        setTemplateAssignmentHalf(halfSlot, categoryId, 0);
      } else {
        setTemplateAssignment(categoryId, 0);
      }
      setDraft("0.00");
      return;
    }
    if (halfSlot) {
      setTemplateAssignmentHalf(halfSlot, categoryId, v);
    } else {
      setTemplateAssignment(categoryId, v);
    }
    setDraft(v.toFixed(2));
  }

  return (
    <div className="field flex min-w-[6.75rem] max-w-[8.5rem] items-center gap-1 py-2 pl-3 pr-2 font-mono tabular-nums">
      <span className="shrink-0 select-none text-[var(--muted)]" aria-hidden>
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={halfSlot ? `Template ${halfSlot}` : "Template amount"}
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
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none ring-0"
        placeholder="0.00"
      />
    </div>
  );
}
