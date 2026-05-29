import { format } from "date-fns";
import type { PeriodBounds } from "@/lib/period";

export function periodKey(bounds: PeriodBounds): string {
  return `${format(bounds.start, "yyyy-MM-dd")}_${format(bounds.end, "yyyy-MM-dd")}`;
}
