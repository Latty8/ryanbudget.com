import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type CoachMessage = {
  headline: string;
  body: string;
  focusAreas: string[];
};

/** Personalized monthly coach message from anonymized totals only. */
export function buildMonthlyCoachMessage(context: AnonymizedBudgetContext): CoachMessage {
  const focusAreas: string[] = [];
  let headline = "You're on a good path";
  let body = `You have $${context.moneyLeftToSpend} safe to spend and ${context.categoriesUnderBudget} categories on track — one small tweak at a time is enough.`;

  if (context.moneyLeftToSpend < 200) {
    headline = "Gentle reset before payday";
    body = `Your buffer is tight ($${context.moneyLeftToSpend}) — that's okay. Focus on needs until your next ${context.payFrequency === "bi-weekly" ? "bi-weekly " : ""}deposit, then breathe easier.`;
    focusAreas.push("Needs first", "Pause extras 3–5 days");
  } else if (context.categoriesOverBudget === 0) {
    headline = "Solid month — keep the momentum";
    body = `Every tracked category is on pace. After your next paycheck, even $${Math.max(50, Math.round(context.incomeThisMonth * 0.08))} to savings is a meaningful win.`;
    focusAreas.push("Automate savings", "Stay steady on dining");
  } else {
    headline = "One category at a time";
    body = `${context.categoriesOverBudget} categories are a little over — pick the biggest one and trim lightly; you don't need a full overhaul.`;
    focusAreas.push("Top category only", "Use What-if to preview");
  }

  if (context.payFrequency === "bi-weekly") {
    focusAreas.push("Paycheck week 1 vs week 2");
    body += " With bi-weekly pay, line up larger bills right after deposits so week two stays calm.";
  }

  if (context.upcomingBillsCount > 0) {
    focusAreas.push(`${context.upcomingBillsCount} upcoming bills`);
  }

  return { headline, body, focusAreas: focusAreas.slice(0, 3) };
}
