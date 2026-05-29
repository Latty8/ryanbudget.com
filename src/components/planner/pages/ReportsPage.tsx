"use client";

import { SpendingChart, TrendsChart } from "@/components/planner/cards";
import { DashboardCard, PageHeader } from "@/components/planner/ui";
import { usePlannerView } from "@/components/planner/usePlannerView";
import { formatCurrency } from "@/lib/planner/format";

export function ReportsPage() {
  const { transactions, categories } = usePlannerView();
  const spendingByCategory = categories.map((c) => ({
    name: c.name,
    value: transactions
      .filter((t) => t.type === "expense" && t.categoryId === c.id)
      .reduce((sum, t) => sum + t.amount, 0),
  }));
  const totalExpenses = spendingByCategory.reduce((sum, item) => sum + item.value, 0);
  const activeCategories = spendingByCategory.filter((x) => x.value > 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Spending by category, income vs expenses, and trend views." />
      <div className="grid gap-3 md:grid-cols-3">
        <DashboardCard title="Total transactions" value={`${transactions.length}`} />
        <DashboardCard title="Spending categories used" value={`${activeCategories.length}`} />
        <DashboardCard title="Total tracked expenses" value={formatCurrency(totalExpenses)} />
      </div>
      <SpendingChart categoryTotals={activeCategories} />
      <TrendsChart transactions={transactions} />
    </div>
  );
}
