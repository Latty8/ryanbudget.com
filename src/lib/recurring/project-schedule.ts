import { isAfter, parseISO } from "date-fns";
import { formatLocalDate, parseLocalDate } from "@/lib/dates/parse-local-date";
import { advanceCadence } from "@/lib/recurring/advance-cadence";
import type { AppRecurringRule } from "@/types/app-settings";

export type ScheduledOccurrence = {
  id: string;
  ruleId: string;
  name: string;
  date: string;
  amount: number;
  cadence: AppRecurringRule["cadence"];
  skipped: boolean;
};

function isRuleActive(rule: AppRecurringRule, onDate: Date): boolean {
  if (rule.paused) {
    if (rule.pausedUntil) {
      const until = parseISO(rule.pausedUntil);
      if (isAfter(until, onDate)) return false;
    } else {
      return false;
    }
  }
  return true;
}

/** Project upcoming occurrences for calendar-style preview (3–6 months). */
export function projectRecurringSchedule(
  rules: AppRecurringRule[],
  options?: { monthsAhead?: number; maxPerRule?: number }
): ScheduledOccurrence[] {
  const monthsAhead = options?.monthsAhead ?? 4;
  const maxPerRule = options?.maxPerRule ?? 24;
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + monthsAhead);

  const out: ScheduledOccurrence[] = [];

  for (const rule of rules) {
    let cursor = parseLocalDate(rule.nextDate);
    const skipped = new Set(rule.skippedDates ?? []);
    let count = 0;

    while (count < maxPerRule && !isAfter(cursor, horizon)) {
      const dateStr = formatLocalDate(cursor);
      const active = isRuleActive(rule, cursor);
      out.push({
        id: `${rule.id}-${dateStr}`,
        ruleId: rule.id,
        name: rule.name,
        date: dateStr,
        amount: rule.amount,
        cadence: rule.cadence,
        skipped: skipped.has(dateStr),
      });
      if (!active && !skipped.has(dateStr)) {
        // still advance cursor
      }
      cursor = advanceCadence(cursor, rule.cadence);
      count += 1;
    }
  }

  return out
    .filter((o) => !o.skipped)
    .filter((o) => {
      const rule = rules.find((r) => r.id === o.ruleId);
      if (!rule) return false;
      return isRuleActive(rule, parseLocalDate(o.date));
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
