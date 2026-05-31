"use client";

import { useMemo } from "react";
import { getEffectiveBudgetPeriod, type BudgetPeriod } from "@/lib/budget/period";
import { useDeviceUiStore } from "@/store/useDeviceUiStore";
import type { AppRecurringRule } from "@/types/app-settings";

/** Device-local budget viewing period (monthly / bi-weekly / weekly). */
export function useBudgetViewPeriod(recurring: AppRecurringRule[] = []): BudgetPeriod {
  const budgetPeriod = useDeviceUiStore((s) => s.budgetPeriod);
  return useMemo(
    () => getEffectiveBudgetPeriod(budgetPeriod, recurring),
    [budgetPeriod, recurring]
  );
}

export function useBudgetPeriodPreference() {
  return useDeviceUiStore((s) => s.budgetPeriod);
}

export function useSetBudgetPeriodPreference() {
  return useDeviceUiStore((s) => s.setBudgetPeriod);
}
