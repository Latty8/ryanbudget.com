"use client";

import { calculateLeftToAssign } from "@/lib/planner/calculations";
import { formatCurrency } from "@/lib/planner/format";
import { CategoryBudgetCard } from "@/components/planner/cards";
import { EmptyState, PageHeader, PaycheckSelector } from "@/components/planner/ui";
import { usePlannerView } from "@/components/planner/usePlannerView";

export function BudgetPage() {
  const {
    categories,
    summary,
    activePaycheckId,
    paychecks,
    setActivePaycheck,
    setAllocationBudgeted,
  } = usePlannerView();
  if (!summary) {
    return <EmptyState title="No paycheck selected." body="Create a paycheck to start budgeting." />;
  }
  const leftToAssign = calculateLeftToAssign(summary.paycheck.actualIncome, summary.budgeted);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Budget Planner"
        description="Assign money from the active paycheck into your categories."
        action={<PaycheckSelector paychecks={paychecks} activeId={activePaycheckId} onSelect={setActivePaycheck} />}
      />
      <div className="planner-card grid gap-3 p-4 sm:grid-cols-5">
        <Stat label="Paycheck Income" value={summary.paycheck.actualIncome} />
        <Stat label="Budgeted" value={summary.budgeted} />
        <Stat label="Spent" value={summary.spent} />
        <Stat label="Remaining" value={summary.remaining} />
        <Stat label="Left to Assign" value={leftToAssign} danger={leftToAssign < 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {categories.filter((c) => c.active).map((category) => {
          const allocation = summary.allocations.find((a) => a.categoryId === category.id);
          return (
            <CategoryBudgetCard
              key={category.id}
              name={category.name}
              group={category.group}
              budgeted={allocation?.budgetedAmount ?? 0}
              spent={allocation?.spentAmount ?? 0}
              rollover={category.rollover}
              onBudgetChange={(amount) => setAllocationBudgeted(summary.paycheck.id, category.id, amount)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="stat-tile p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${danger ? "text-red-600" : ""}`}>{formatCurrency(value)}</p>
    </div>
  );
}
