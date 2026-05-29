import { addWeeks, differenceInCalendarDays, format, parseISO, startOfMonth } from "date-fns";
import { buildPaycheckProjections } from "@/lib/recurring/build-paychecks";
import { generateInsights, computeDaysUntilBroke, computeDaysUntilPaycheck } from "@/lib/insights/generate-insights";
import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type {
  BillProjection,
  CashflowPoint,
  DashboardSummary,
  PaycheckProjection,
  RecurringFrequency,
} from "@/types/finance";

type RecurringRule = {
  id: string;
  name: string;
  amount: number;
  cadence: RecurringFrequency;
  nextDate: string;
};

function demoCashflow(): CashflowPoint[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, idx) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
    const income = idx < 6 ? 3650 + (idx % 2) * 140 : 3650;
    const expenses = idx < 6 ? 2480 + (idx % 3) * 95 : 2550;
    return {
      month: format(monthDate, "MMM"),
      income,
      expenses,
      projectedBalance: 5000 + idx * 330 + income - expenses,
    };
  });
}

function buildBills(rules: RecurringRule[]): BillProjection[] {
  return rules
    .filter((r) => !r.name.toLowerCase().includes("payroll"))
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      date: rule.nextDate,
      amount: rule.amount,
      frequency: rule.cadence,
    }));
}

export function computeDashboardSummary(input: {
  accounts: AppAccount[];
  categories: AppCategory[];
  transactions: DemoTransaction[];
  recurring: RecurringRule[];
}): DashboardSummary {
  const totalBalance = input.accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthPrefix = format(new Date(), "yyyy-MM");
  const monthTransactions = input.transactions.filter((t) => t.date.startsWith(monthPrefix));
  const incomeThisMonth = monthTransactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expensesThisMonth = Math.abs(
    monthTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  );

  const categoryProgress = input.categories
    .filter((c) => c.name !== "Income")
    .slice(0, 8)
    .map((category) => {
      const spent = Math.abs(
        monthTransactions
          .filter((t) => t.category === category.name && t.amount < 0)
          .reduce((s, t) => s + t.amount, 0)
      );
      return {
        id: category.id,
        name: category.name,
        group: category.group,
        budgeted: category.budgeted,
        spent,
        rolloverEnabled: true,
      };
    });

  const totalBudgeted = categoryProgress.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = categoryProgress.reduce((s, c) => s + c.spent, 0);
  const upcomingPaychecks = buildPaycheckProjections(input.recurring);
  const upcomingBills = buildBills(input.recurring);
  const daysUntilNextPaycheck = computeDaysUntilPaycheck(upcomingPaychecks);
  const dayOfMonth = Math.max(1, new Date().getDate());
  const dailyBurn = expensesThisMonth / dayOfMonth;
  const daysUntilBroke = computeDaysUntilBroke(totalBalance, dailyBurn);

  const nextPaycheck = upcomingPaychecks[0];
  const billsBeforeNextPaycheck = nextPaycheck
    ? upcomingBills.filter((bill) => differenceInCalendarDays(parseISO(bill.date), new Date()) >= 0 && parseISO(bill.date) <= parseISO(nextPaycheck.date)).length
    : 0;

  const diningSpent = categoryProgress.find((c) => c.name === "Dining")?.spent ?? 0;
  const insights = generateInsights({
    moneyLeftToSpend: Math.max(0, totalBudgeted - totalSpent),
    expensesThisMonth,
    incomeThisMonth,
    diningSpent,
    diningLastMonth: diningSpent * 0.78,
    upcomingPaychecks,
    upcomingBills,
  });

  return {
    totalBalance,
    incomeThisMonth: incomeThisMonth || 3650,
    expensesThisMonth: expensesThisMonth || totalSpent,
    projectedEndOfMonthBalance: totalBalance + (incomeThisMonth || 3650) - (totalBudgeted || expensesThisMonth),
    moneyLeftToSpend: Math.max(0, totalBudgeted - totalSpent),
    daysUntilNextPaycheck,
    daysUntilBroke,
    billsBeforeNextPaycheck,
    categoryProgress,
    cashflow: demoCashflow(),
    upcomingPaychecks,
    upcomingBills,
    insights,
  };
}

export function defaultDemoSummary(): DashboardSummary {
  const base = startOfMonth(new Date());
  return computeDashboardSummary({
    accounts: [
      { id: "1", name: "Main Checking", kind: "checking", balance: 2840.44, color: "#38bdf8", icon: "Wallet" },
      { id: "2", name: "Savings", kind: "savings", balance: 9300, color: "#34d399", icon: "PiggyBank" },
      { id: "3", name: "Credit", kind: "credit", balance: -742.15, color: "#f472b6", icon: "CreditCard" },
    ],
    categories: [
      { id: "c1", name: "Housing", group: "Needs", icon: "Home", color: "#38bdf8", budgeted: 1200 },
      { id: "c2", name: "Groceries", group: "Needs", icon: "ShoppingCart", color: "#34d399", budgeted: 300 },
      { id: "c3", name: "Dining", group: "Wants", icon: "Utensils", color: "#fb7185", budgeted: 120 },
    ],
    transactions: [],
    recurring: [
      { id: "r1", name: "Payroll", amount: 1825, cadence: "bi-weekly", nextDate: format(addWeeks(base, 2), "yyyy-MM-dd") },
      { id: "r2", name: "Rent", amount: 1200, cadence: "monthly", nextDate: format(base, "yyyy-MM-01") },
    ],
  });
}
