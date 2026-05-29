"use client";

import { useMemo } from "react";
import { plannerSummary } from "@/lib/planner/selectors";
import { usePlannerStore } from "@/store/usePlannerStore";

export function usePlannerView() {
  const state = usePlannerStore((s) => s);
  const summary = useMemo(() => plannerSummary(state), [state]);
  return { ...state, summary };
}
