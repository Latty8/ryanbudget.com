import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";
import type { WhatIfInput } from "@/lib/ai/what-if-local";

export type WhatIfProjection = {
  category: string;
  monthlySavings: number;
  perPaycheck: number;
  annualSavings: number;
  bufferAfter: number;
  pctOfSafeToSpend: number;
  summary: string;
};

export function computeWhatIfProjection(
  context: AnonymizedBudgetContext,
  scenario: WhatIfInput
): WhatIfProjection | null {
  const row = context.categoryTotals.find(
    (c) => c.name.toLowerCase() === scenario.category.toLowerCase()
  );
  const spent = row?.spent ?? 0;
  const monthlySavings =
    scenario.mode === "percent"
      ? Math.round((spent * scenario.reductionPct) / 100)
      : Math.min(spent, Math.max(0, Math.round(scenario.monthlyDollars)));

  if (monthlySavings <= 0) return null;

  const perPaycheck = Math.round(monthlySavings / 2);
  const annualSavings = monthlySavings * 12;
  const bufferAfter = context.moneyLeftToSpend + perPaycheck;
  const pctOfSafeToSpend =
    context.moneyLeftToSpend > 0
      ? Math.round((perPaycheck / context.moneyLeftToSpend) * 100)
      : 0;

  const days = context.daysUntilNextPaycheck;
  const paycheckNote =
    context.payFrequency === "bi-weekly"
      ? `That's ~$${perPaycheck} extra each paycheck (~$${annualSavings}/year).`
      : `About $${monthlySavings}/month toward your goals (~$${annualSavings}/year).`;

  const timingNote =
    days != null && days <= 7
      ? ` With payday in ${days} day${days === 1 ? "" : "s"}, this small shift could lift safe-to-spend toward $${bufferAfter} before deposit.`
      : ` Safe-to-spend could move from $${context.moneyLeftToSpend} toward ~$${bufferAfter} this cycle.`;

  const summary = `Trimming ${scenario.category} frees ${paycheckNote}${timingNote} ${pctOfSafeToSpend > 0 ? `(${pctOfSafeToSpend}% of your current buffer per paycheck).` : ""} Try it for two weeks — no need to commit forever.`;

  return {
    category: scenario.category,
    monthlySavings,
    perPaycheck,
    annualSavings,
    bufferAfter,
    pctOfSafeToSpend,
    summary,
  };
}
