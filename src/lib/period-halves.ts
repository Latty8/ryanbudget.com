import { addDays, endOfDay, format, startOfDay } from "date-fns";
import type { BudgetSettings } from "@/lib/types";
import type { PeriodBounds } from "@/lib/period";

export type PeriodHalfSlot = "first" | "second";

export interface PeriodHalfBounds {
  slot: PeriodHalfSlot;
  start: Date;
  end: Date;
  /** Short label for UI, e.g. "Week 1 · Jan 1 – Jan 7" */
  label: string;
  /** Compact title for cards and headers, e.g. "Week 1" */
  title: string;
  /** Date range only, e.g. "Jan 1 – Jan 7" */
  rangeText: string;
}

export function halfBoundsAsPeriodBounds(
  half: PeriodHalfBounds
): PeriodBounds {
  return { start: half.start, end: half.end, label: half.label };
}

/** Bi-weekly → two 7-day halves; monthly → 1st–15th vs 16th–end (semi-monthly style). */
export function supportsPeriodHalves(settings: BudgetSettings): boolean {
  return settings.periodType === "biweekly" || settings.periodType === "monthly";
}

export function getPeriodHalves(
  settings: BudgetSettings,
  bounds: PeriodBounds
): [PeriodHalfBounds, PeriodHalfBounds] | null {
  if (!supportsPeriodHalves(settings)) return null;

  if (settings.periodType === "biweekly") {
    const h1End = endOfDay(addDays(bounds.start, 6));
    const h2Start = startOfDay(addDays(bounds.start, 7));
    return [
      {
        slot: "first",
        start: bounds.start,
        end: h1End,
        title: "Week 1",
        rangeText: `${format(bounds.start, "MMM d")} – ${format(h1End, "MMM d")}`,
        label: `Week 1 · ${format(bounds.start, "MMM d")} – ${format(h1End, "MMM d")}`,
      },
      {
        slot: "second",
        start: h2Start,
        end: bounds.end,
        title: "Week 2",
        rangeText: `${format(h2Start, "MMM d")} – ${format(bounds.end, "MMM d")}`,
        label: `Week 2 · ${format(h2Start, "MMM d")} – ${format(bounds.end, "MMM d")}`,
      },
    ];
  }

  const y = bounds.start.getFullYear();
  const m = bounds.start.getMonth();
  const firstEnd = endOfDay(new Date(y, m, 15));
  const secondStart = startOfDay(new Date(y, m, 16));
  return [
    {
      slot: "first",
      start: bounds.start,
      end: firstEnd,
      title: "1st – 15th",
      rangeText: `${format(bounds.start, "MMM d")} – ${format(firstEnd, "MMM d")}`,
      label: `Half 1 · ${format(bounds.start, "MMM d")} – ${format(firstEnd, "MMM d")}`,
    },
    {
      slot: "second",
      start: secondStart,
      end: bounds.end,
      title: "16th – end",
      rangeText: `${format(secondStart, "MMM d")} – ${format(bounds.end, "MMM d")}`,
      label: `Half 2 · ${format(secondStart, "MMM d")} – ${format(bounds.end, "MMM d")}`,
    },
  ];
}
