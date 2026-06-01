import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";
import { computeWhatIfProjection, type WhatIfProjection } from "@/lib/ai/what-if-projection";

export type WhatIfInput =
  | { mode: "percent"; category: string; reductionPct: number }
  | { mode: "dollars"; category: string; monthlyDollars: number };

export function simulateWhatIfProjection(
  context: AnonymizedBudgetContext,
  scenario: WhatIfInput
): WhatIfProjection | null {
  return computeWhatIfProjection(context, scenario);
}

/** Encouraging, rules-based what-if copy — works offline and for all users. */
export function simulateWhatIfLocal(
  context: AnonymizedBudgetContext,
  scenario: WhatIfInput
): string {
  const projection = computeWhatIfProjection(context, scenario);
  if (!projection) {
    return `We don't have much ${scenario.category} spending this month yet — try another category or add a few transactions first.`;
  }
  return projection.summary;
}

export const WHAT_IF_PRESETS = [
  { label: "Dining −$100/mo", category: "Dining", dollars: 100 },
  { label: "Shopping −$75/mo", category: "Shopping", dollars: 75 },
  { label: "Dining −20%", category: "Dining", percent: 20 },
] as const;
