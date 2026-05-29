import { addMonths, addWeeks } from "date-fns";
import type { RecurringFrequency } from "@/types/finance";

/** Advance a recurring schedule cursor by one occurrence. */
export function advanceCadence(date: Date, cadence: RecurringFrequency): Date {
  switch (cadence) {
    case "weekly":
      return addWeeks(date, 1);
    case "bi-weekly":
      return addWeeks(date, 2);
    case "yearly":
      return addMonths(date, 12);
    case "monthly":
    default:
      return addMonths(date, 1);
  }
}
