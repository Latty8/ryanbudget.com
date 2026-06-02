import { isAfter } from "date-fns";
import { formatLocalDate, parseLocalDate } from "@/lib/dates/parse-local-date";
import { advanceCadence } from "@/lib/recurring/advance-cadence";
import type { RecurringFrequency } from "@/types/finance";

export type RecurringRuleInput = {
  id: string;
  name: string;
  amount: number;
  cadence: RecurringFrequency;
  nextDate: string;
  active?: boolean;
  paused?: boolean;
  pausedUntil?: string;
  skippedDates?: string[];
  endDate?: string;
};

export type ProjectedRun = {
  id: string;
  ruleId: string;
  name: string;
  date: string;
  amount: number;
  cadence: RecurringFrequency;
};

export type ProjectRunsOptions = {
  /** Occurrences generated per active rule (default 5). */
  runsPerRule?: number;
  /** Max runs returned after global sort (default 5). */
  maxResults?: number;
};

/**
 * Project upcoming recurring occurrences across active rules.
 * Used by the Recurring page and cash-flow previews.
 */
let cacheKey = "";
let cacheValue: ProjectedRun[] | null = null;

export function clearRecurringProjectionCache() {
  cacheKey = "";
  cacheValue = null;
}

export function projectRecurringRuns(
  rules: RecurringRuleInput[],
  options: ProjectRunsOptions = {}
): ProjectedRun[] {
  const runsPerRule = options.runsPerRule ?? 5;
  const maxResults = options.maxResults ?? 5;
  const key = JSON.stringify({ rules, runsPerRule, maxResults });
  if (key === cacheKey && cacheValue) return cacheValue;

  const generated: ProjectedRun[] = [];

  const today = new Date();

  for (const rule of rules.filter((r) => r.active !== false && !r.paused)) {
    if (rule.pausedUntil && isAfter(parseLocalDate(rule.pausedUntil), today)) continue;

    let cursor = parseLocalDate(rule.nextDate);
    const end = rule.endDate ? parseLocalDate(rule.endDate) : null;
    const skipped = new Set(rule.skippedDates ?? []);
    for (let i = 0; i < runsPerRule; i += 1) {
      if (end && isAfter(cursor, end)) break;
      const dateStr = formatLocalDate(cursor);
      if (skipped.has(dateStr)) {
        cursor = advanceCadence(cursor, rule.cadence);
        continue;
      }
      generated.push({
        id: `${rule.id}-${i}`,
        ruleId: rule.id,
        name: rule.name,
        date: formatLocalDate(cursor),
        amount: rule.amount,
        cadence: rule.cadence,
      });
      cursor = advanceCadence(cursor, rule.cadence);
    }
  }

  const result = generated
    .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    .slice(0, maxResults);

  cacheKey = key;
  cacheValue = result;
  return result;
}
