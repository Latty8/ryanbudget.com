import type { AnonymizedBudgetContext } from "@/lib/ai/anonymized-context";
import type { DashboardSummary } from "@/types/finance";

export type BiweeklyPersonalInsight = {
  headline: string;
  body: string;
  highlight?: string;
};

/** One prominent, personal line for bi-weekly earners. */
export function buildBiweeklyPersonalInsight(
  context: AnonymizedBudgetContext,
  summary: DashboardSummary
): BiweeklyPersonalInsight | null {
  const days = summary.daysUntilNextPaycheck;
  if (days == null && context.payFrequency !== "bi-weekly") return null;

  const safe = Math.round(summary.moneyLeftToSpend);
  const perWeek = Math.round(safe / Math.max(1, days != null ? Math.ceil(days / 7) : 2));

  if (days != null && days <= 7) {
    const headline =
      days === 0
        ? "Payday is today — nice work getting here"
        : days === 1
          ? "Payday tomorrow"
          : `Your next paycheck is in ${days} days`;

    let body = `You have about $${safe} safe to spend before it lands. `;
    if (context.upcomingBillsCount > 0) {
      body += `Consider covering your ${context.upcomingBillsCount} upcoming bill(s) (~$${context.upcomingBillsTotal}) first, then decide what can wait until after deposit.`;
    } else {
      body += `A light discretionary week now keeps week two of your pay cycle comfortable.`;
    }

    return {
      headline,
      body,
      highlight: `~$${perWeek}/week pace · bi-weekly plan`,
    };
  }

  if (context.payFrequency === "bi-weekly" && days != null && days > 7) {
    return {
      headline: "Mid pay-cycle — you're in a good spot to plan",
      body: `With payday in ${days} days and $${safe} safe to spend, try splitting roughly $${Math.round(safe / 2)} for this week and the rest for the days before deposit.`,
      highlight: "Bi-weekly paycheck rhythm",
    };
  }

  if (context.payFrequency === "bi-weekly") {
    return {
      headline: "Built for your bi-weekly paycheck",
      body: `We'll anchor advice to your 14-day rhythm — $${safe} safe to spend is your guide until the next deposit.`,
      highlight: "Personal coach",
    };
  }

  return null;
}
