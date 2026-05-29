import { differenceInCalendarDays, parseISO } from "date-fns";
import type { BillProjection, PaycheckProjection } from "@/types/finance";

export type InsightTone = "positive" | "warning" | "neutral";

export type DashboardInsight = {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
};

type InsightInput = {
  moneyLeftToSpend: number;
  expensesThisMonth: number;
  incomeThisMonth: number;
  diningSpent: number;
  diningLastMonth: number;
  upcomingPaychecks: PaycheckProjection[];
  upcomingBills: BillProjection[];
};

/** Rule-based insights placeholder until OpenAI (or similar) is wired. */
export function generateInsights(input: InsightInput): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const now = new Date();
  const nextPaycheck = input.upcomingPaychecks[0];
  const billsBeforePaycheck = nextPaycheck
    ? input.upcomingBills.filter((bill) => {
        const billDate = parseISO(bill.date);
        const payDate = parseISO(nextPaycheck.date);
        return billDate <= payDate;
      })
    : [];

  const spendRatio = input.incomeThisMonth > 0 ? input.expensesThisMonth / input.incomeThisMonth : 1;
  if (spendRatio <= 0.75) {
    insights.push({
      id: "on-track",
      tone: "positive",
      title: "You're on track this month",
      body: "Spending is below 75% of income so far. Keep your current pace.",
    });
  } else if (spendRatio > 1) {
    insights.push({
      id: "over-income",
      tone: "warning",
      title: "Spending exceeded income",
      body: "You've spent more than you earned this month. Review flexible categories.",
    });
  } else {
    insights.push({
      id: "watch-pace",
      tone: "neutral",
      title: "Watch your spending pace",
      body: "You're using most of this month's income. Slow discretionary spending if possible.",
    });
  }

  if (input.diningLastMonth > 0) {
    const deltaPct = ((input.diningSpent - input.diningLastMonth) / input.diningLastMonth) * 100;
    if (Math.abs(deltaPct) >= 8) {
      insights.push({
        id: "dining-trend",
        tone: deltaPct > 0 ? "warning" : "positive",
        title: deltaPct > 0 ? "Dining out is trending up" : "Dining out is trending down",
        body:
          deltaPct > 0
            ? `Dining is ${Math.round(deltaPct)}% higher than last month.`
            : `Dining is ${Math.round(Math.abs(deltaPct))}% lower than last month.`,
      });
    }
  }

  if (billsBeforePaycheck.length > 0 && nextPaycheck) {
    const days = differenceInCalendarDays(parseISO(nextPaycheck.date), now);
    insights.push({
      id: "bills-before-pay",
      tone: billsBeforePaycheck.length >= 3 ? "warning" : "neutral",
      title: `${billsBeforePaycheck.length} bill${billsBeforePaycheck.length === 1 ? "" : "s"} before next paycheck`,
      body:
        days >= 0
          ? `Next paycheck in ${days} day${days === 1 ? "" : "s"}. Plan for $${billsBeforePaycheck.reduce((s, b) => s + b.amount, 0).toFixed(2)} due first.`
          : "Your next paycheck date has passed — mark it received or update recurring income.",
    });
  }

  if (input.moneyLeftToSpend < 200) {
    insights.push({
      id: "low-buffer",
      tone: "warning",
      title: "Low spending buffer",
      body: "Less than $200 safe-to-spend before upcoming bills. Consider pausing wants.",
    });
  }

  return insights.slice(0, 4);
}

export function computeDaysUntilPaycheck(paychecks: PaycheckProjection[]) {
  const next = paychecks[0];
  if (!next) return null;
  return Math.max(0, differenceInCalendarDays(parseISO(next.date), new Date()));
}

/** Estimate days until balance hits zero at current daily burn rate. */
export function computeDaysUntilBroke(balance: number, dailyBurn: number) {
  if (balance <= 0) return 0;
  if (dailyBurn <= 0) return null;
  return Math.floor(balance / dailyBurn);
}
