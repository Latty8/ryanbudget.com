import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type WhatIfScenario = {
  id: string;
  label: string;
  category: string;
  reductionPct: number;
};

export type WhatIfScenarioResult = WhatIfScenario & {
  monthlySavings: number;
  newSafeToSpend: number;
  summary: string;
};

/** Run multiple what-if scenarios locally (privacy-safe, no LLM required). */
export function runMultiWhatIfScenarios(
  context: AnonymizedBudgetContext,
  scenarios: WhatIfScenario[]
): WhatIfScenarioResult[] {
  return scenarios.map((scenario) => {
    const row = context.categoryTotals.find(
      (c) => c.name.toLowerCase() === scenario.category.toLowerCase()
    );
    const monthlySavings = row ? Math.round((row.spent * scenario.reductionPct) / 100) : 0;
    const newSafeToSpend = context.moneyLeftToSpend + monthlySavings;

    return {
      ...scenario,
      monthlySavings,
      newSafeToSpend,
      summary: `Cutting ${scenario.category} by ${scenario.reductionPct}% frees ~$${monthlySavings}/mo, raising safe-to-spend to ~$${newSafeToSpend}.`,
    };
  });
}

export const DEFAULT_WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  { id: "dining-20", label: "Dining −20%", category: "Dining", reductionPct: 20 },
  { id: "groceries-10", label: "Groceries −10%", category: "Groceries", reductionPct: 10 },
  { id: "entertainment-30", label: "Fun −30%", category: "Entertainment", reductionPct: 30 },
];
