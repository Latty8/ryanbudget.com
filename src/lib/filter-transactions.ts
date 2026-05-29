import {
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfYear,
  subDays,
} from "date-fns";
import type { PeriodBounds } from "@/lib/period";
import { isDateInPeriod } from "@/lib/period";
import { transactionMatchesCategoryFilter } from "@/lib/categories";
import type { Category, Transaction, TransactionType } from "@/lib/types";

export type TransactionDatePreset =
  | "all"
  | "budget-period"
  | "30d"
  | "90d"
  | "ytd"
  | "custom";

export interface TransactionFilterOptions {
  search: string;
  type: "all" | TransactionType;
  categoryScope: "all" | "uncategorized" | string;
  datePreset: TransactionDatePreset;
  customFrom?: string;
  customTo?: string;
  /** Required when datePreset is `budget-period`. */
  budgetPeriodBounds?: PeriodBounds | null;
  /** When filtering by parent group, pass the category list. */
  categories?: Category[];
}

function matchesDatePreset(
  iso: string,
  preset: TransactionDatePreset,
  budgetBounds: PeriodBounds | null | undefined,
  customFrom?: string,
  customTo?: string
): boolean {
  const d = parseISO(iso);
  const today = endOfDay(new Date());
  switch (preset) {
    case "all":
      return true;
    case "budget-period":
      return budgetBounds ? isDateInPeriod(iso, budgetBounds) : true;
    case "30d":
      return d >= subDays(new Date(), 30);
    case "90d":
      return d >= subDays(new Date(), 90);
    case "ytd":
      return d >= startOfYear(new Date()) && d <= today;
    case "custom": {
      if (!customFrom?.trim() || !customTo?.trim()) return true;
      const start = parseISO(customFrom);
      const end = endOfDay(parseISO(customTo));
      return isWithinInterval(d, { start, end });
    }
    default:
      return true;
  }
}

export function filterTransactions(
  transactions: Transaction[],
  opts: TransactionFilterOptions
): Transaction[] {
  const q = opts.search.trim().toLowerCase();
  return transactions.filter((t) => {
    if (q && !t.description.toLowerCase().includes(q)) return false;
    if (opts.type !== "all" && t.type !== opts.type) return false;
    if (opts.categoryScope !== "all") {
      const cats = opts.categories ?? [];
      if (
        !transactionMatchesCategoryFilter(
          t.categoryId,
          opts.categoryScope,
          cats
        )
      ) {
        return false;
      }
    }
    if (
      !matchesDatePreset(
        t.date,
        opts.datePreset,
        opts.budgetPeriodBounds ?? null,
        opts.customFrom,
        opts.customTo
      )
    ) {
      return false;
    }
    return true;
  });
}
