import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { BudgetSettings } from "./types";

export interface PeriodBounds {
  start: Date;
  end: Date;
  label: string;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getPeriodBounds(
  settings: BudgetSettings,
  ref: Date = new Date()
): PeriodBounds {
  switch (settings.periodType) {
    case "weekly": {
      const start = startOfWeek(ref, {
        weekStartsOn: settings.weekStartsOn,
      });
      const end = endOfWeek(ref, {
        weekStartsOn: settings.weekStartsOn,
      });
      return {
        start: startOfDay(start),
        end: endOfDay(end),
        label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
      };
    }
    case "monthly": {
      const start = startOfMonth(ref);
      const end = endOfMonth(ref);
      return {
        start: startOfDay(start),
        end: endOfDay(end),
        label: format(start, "MMMM yyyy"),
      };
    }
    case "biweekly": {
      const anchor = startOfDay(parseLocalDate(settings.biweeklyAnchor));
      const refDay = startOfDay(ref);
      const days = differenceInCalendarDays(refDay, anchor);
      const idx = Math.floor(days / 14);
      const start = addDays(anchor, idx * 14);
      const end = endOfDay(addDays(start, 13));
      return {
        start,
        end,
        label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
      };
    }
  }
}

export function isDateInPeriod(isoDate: string, bounds: PeriodBounds): boolean {
  const d = startOfDay(parseISO(isoDate));
  return d >= bounds.start && d <= bounds.end;
}

/** Walk budget periods: `offset` 0 = period containing `ref`, -1 = previous, +1 = next. */
export function getPeriodBoundsOffset(
  settings: BudgetSettings,
  offset: number,
  ref: Date = new Date()
): PeriodBounds {
  if (offset === 0) {
    return getPeriodBounds(settings, ref);
  }
  let d = new Date(ref);
  const n = Math.abs(offset);
  const dir = offset > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const b = getPeriodBounds(settings, d);
    d = dir > 0 ? addDays(b.end, 1) : addDays(b.start, -1);
  }
  return getPeriodBounds(settings, d);
}
