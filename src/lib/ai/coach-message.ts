import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";

export type CoachMessage = {
  headline: string;
  body: string;
  focusAreas: string[];
};

/** Personalized monthly coach message from anonymized totals only. */
export function buildMonthlyCoachMessage(context: AnonymizedBudgetContext): CoachMessage {
  const focusAreas: string[] = [];
  let headline = "You're building steady habits";
  let body = `You have $${context.moneyLeftToSpend} safe to spend with ${context.categoriesUnderBudget} categories on track.`;

  if (context.moneyLeftToSpend < 200) {
    headline = "Tighten the next two weeks";
    body = `Your buffer is thin ($${context.moneyLeftToSpend}). Prioritize needs until your next ${context.payFrequency} paycheck.`;
    focusAreas.push("Reduce wants", "Confirm bill due dates");
  } else if (context.categoriesOverBudget === 0) {
    headline = "Strong month — protect your buffer";
    body = `All tracked categories are at or under budget. Move $${Math.max(50, Math.round(context.incomeThisMonth * 0.08))} to savings after your next paycheck.`;
    focusAreas.push("Automate savings", "Keep dining steady");
  } else {
    headline = "Recalibrate a few categories";
    body = `${context.categoriesOverBudget} categories are over budget. Trim the top offender before mid-month.`;
    focusAreas.push("Review top 3 categories");
  }

  if (context.payFrequency === "bi-weekly") {
    focusAreas.push("Align bills to paycheck weeks");
    body += " With bi-weekly pay, schedule big bills right after deposits.";
  }

  if (context.upcomingBillsCount > 0) {
    focusAreas.push(`${context.upcomingBillsCount} upcoming bills ($${context.upcomingBillsTotal})`);
  }

  return { headline, body, focusAreas: focusAreas.slice(0, 4) };
}
