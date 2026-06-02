"use client";

import { useMemo, useRef } from "react";
import { getEffectiveBudgetPeriod, type BudgetPeriod } from "@/lib/budget/period";
import { useDeviceUiStore } from "@/store/useDeviceUiStore";
import type { AppRecurringRule } from "@/types/app-settings";

/** Device-local budget viewing period (monthly / bi-weekly / weekly). */
export function useBudgetViewPeriod(recurring: AppRecurringRule[] = []): BudgetPeriod {
  const budgetPeriod = useDeviceUiStore((s) => s.budgetPeriod);
  const recurringRef = useRef(recurring);
  recurringRef.current = recurring;
  const recurringSig = useMemo(
    () =>
      recurring
        .map((r) => `${r.id}:${r.paused ? 1 : 0}:${r.nextDate}:${r.cadence}`)
        .join("\n"),
    [recurring]
  );
  return useMemo(
    () => getEffectiveBudgetPeriod(budgetPeriod, recurringRef.current),
    [budgetPeriod, recurringSig]
  );
}

export function useBudgetPeriodPreference() {
  return useDeviceUiStore((s) => s.budgetPeriod);
}

export function useSetBudgetPeriodPreference() {
  return useDeviceUiStore((s) => s.setBudgetPeriod);
}
