"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { projectRecurringSchedule } from "@/lib/recurring/project-schedule";
import { isIncomeRecurring } from "@/lib/recurring/cadence-display";
import { fintechDivide, fintechForeground, fintechMuted, fintechSurface } from "@/components/fintech/ui";
import { formatMoney } from "@/store/useAppDataStore";
import type { AppRecurringRule } from "@/types/app-settings";
import type { CurrencyCode } from "@/types/app-settings";
import { cn } from "@/lib/utils";

export function RecurringUpcomingPreview({
  rules,
  currency,
  monthsAhead = 4,
}: {
  rules: AppRecurringRule[];
  currency: CurrencyCode;
  monthsAhead?: number;
}) {
  const schedule = useMemo(
    () => projectRecurringSchedule(rules, { monthsAhead }),
    [rules, monthsAhead]
  );

  const byMonth = useMemo(() => {
    const map = new Map<string, typeof schedule>();
    for (const item of schedule) {
      const key = item.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 6);
  }, [schedule]);

  if (schedule.length === 0) {
    return (
      <p className={cn("text-sm", fintechMuted)}>
        No upcoming occurrences — add recurring items or resume paused rules.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {byMonth.map(([monthKey, items]) => (
        <div key={monthKey}>
          <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", fintechMuted)}>
            {format(parseISO(`${monthKey}-01`), "MMMM yyyy")}
          </p>
          <ul className={cn(fintechSurface, fintechDivide, "divide-y overflow-hidden rounded-[var(--radius-card)]")}>
            {items.slice(0, 12).map((item) => {
              const income = isIncomeRecurring(item.name);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className={cn("truncate font-medium", fintechForeground)}>{item.name}</p>
                    <p className={cn("text-xs", fintechMuted)}>
                      {format(parseISO(item.date), "EEE, MMM d")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular-nums",
                      income ? "text-[var(--positive)]" : fintechForeground
                    )}
                  >
                    {income ? "+" : "−"}
                    {formatMoney(Math.abs(item.amount), currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
