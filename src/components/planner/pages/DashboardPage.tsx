"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { calculateDebtPayoff, calculateGoalProgress } from "@/lib/planner/calculations";
import { formatCurrency } from "@/lib/planner/format";
import { CanIAffordCalculator, SpendingChart } from "@/components/planner/cards";
import { AddTransactionModal, type TransactionDraft } from "@/components/planner/AddTransactionModal";
import {
  BillList,
  DashboardCard,
  EmptyState,
  GoalCard,
  MoneyCard,
  PageHeader,
  SafeToSpendCard,
  TransactionTable,
} from "@/components/planner/ui";
import { usePlannerView } from "@/components/planner/usePlannerView";

export function DashboardPage() {
  const { categories, debts, goals, summary, paychecks, user, accounts, addTransaction } = usePlannerView();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const hidden = localStorage.getItem("planner-onboarding-hidden") === "1";
      setShowOnboarding(!hidden);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!summary) {
    return <EmptyState title="You have not created a paycheck yet." body="Create one to start planning your budget." />;
  }

  const overspent = summary.allocations.filter((a) => a.remainingAmount < 0);
  const categoryTotals = summary.allocations
    .filter((a) => a.spentAmount > 0)
    .map((a) => ({
      name: categories.find((c) => c.id === a.categoryId)?.name ?? "Other",
      value: a.spentAmount,
    }));
  const categoryRemainingById = Object.fromEntries(
    summary.allocations.map((a) => [a.categoryId, a.remainingAmount])
  );
  const closeToOverspend = summary.allocations.filter((a) => a.budgetedAmount > 0 && a.remainingAmount >= 0 && a.remainingAmount / a.budgetedAmount <= 0.12);
  const nextPaycheck = paychecks
    .filter((p) => +p.payDate > +summary.paycheck.payDate)
    .sort((a, b) => +a.payDate - +b.payDate)[0];
  const initialDraft: TransactionDraft = {
    userId: user.id,
    paycheckId: summary.paycheck.id,
    categoryId: categories[0]?.id,
    date: new Date(),
    description: "",
    amount: 0,
    type: "expense",
    account: accounts[0],
    notes: "",
    recurring: false,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Your active paycheck plan at a glance."
      />
      {showOnboarding ? (
        <div className="planner-card p-4 sm:p-5">
          <p className="font-medium">Welcome to Paycheck Planner demo</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This demo uses local data saved in your browser. Start by picking an active paycheck, add transactions as you spend, and use Safe to Spend before new purchases.
          </p>
          <button
            className="btn-ghost mt-2"
            onClick={() => {
              localStorage.setItem("planner-onboarding-hidden", "1");
              setShowOnboarding(false);
            }}
          >
            Hide this tip
          </button>
        </div>
      ) : null}

      <div className="planner-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Active paycheck</p>
          <p className="text-lg font-semibold">{summary.paycheck.name}</p>
          <p className="text-sm text-[var(--muted)]">
            Paid {formatCurrency(summary.paycheck.actualIncome)} · Budgeted {formatCurrency(summary.budgeted)} · Spent {formatCurrency(summary.spent)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setModalOpen(true)}>Add Transaction</button>
          <Link className="btn-secondary" href="/bills">Add Bill</Link>
          <Link className="btn-secondary" href="/goals">Add Goal</Link>
          <Link className="btn-secondary" href="/paychecks">Create Paycheck</Link>
        </div>
      </div>

      <SafeToSpendCard safeToSpend={summary.safeToSpend} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MoneyCard title="Expected Income" cents={summary.paycheck.expectedIncome} />
        <MoneyCard title="Actual Income" cents={summary.paycheck.actualIncome} />
        <MoneyCard title="Left to Budget" cents={summary.leftToAssign} />
        <MoneyCard title="Total Spent" cents={summary.spent} />
        <MoneyCard title="Total saved" cents={summary.totalSaved} />
        <DashboardCard title="Upcoming bills" value={`${summary.upcoming.length}`} />
        <DashboardCard title="Overspent categories" value={`${overspent.length}`} />
        <DashboardCard
          title="Savings goals"
          value={`${goals.length}`}
          hint={goals.length ? "Keep contributions steady each paycheck." : undefined}
        />
      </div>

      <SpendingChart categoryTotals={categoryTotals} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Categories close to overspending"
          value={`${closeToOverspend.length}`}
          hint={closeToOverspend[0] ? "Review budget planner to top up soon." : "No category is near its limit."}
        />
        <DashboardCard
          title="Bills due before next paycheck"
          value={`${summary.upcoming.length}`}
          hint={summary.upcoming[0] ? `${summary.upcoming[0].name} is coming up first.` : "No immediate bill pressure."}
        />
        <DashboardCard
          title="Savings progress"
          value={`${goals.filter((g) => g.currentAmount >= g.targetAmount).length}/${goals.length}`}
          hint="Goals fully funded this cycle."
        />
        <DashboardCard
          title="Next paycheck awareness"
          value={nextPaycheck ? nextPaycheck.name : "No future paycheck"}
          hint={nextPaycheck ? `Pay date ${nextPaycheck.payDate.toLocaleDateString()}` : "Create another paycheck to plan ahead."}
        />
      </div>

      {(overspent.length > 0 || summary.upcoming.length > 0) ? (
        <div className="grid gap-3 md:grid-cols-2">
          {overspent.length > 0 ? (
            <div className="planner-card border-red-400/40 bg-red-500/10 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-red-500"><AlertTriangle className="h-4 w-4" /> Over-budget warning</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{overspent.length} categories are over budget. Re-assign funds in Budget Planner.</p>
            </div>
          ) : (
            <div className="planner-card border-emerald-400/40 bg-emerald-500/10 p-4">
              <p className="inline-flex items-center gap-2 font-medium text-emerald-500"><CheckCircle2 className="h-4 w-4" /> Budget health</p>
              <p className="mt-1 text-sm text-[var(--muted)]">No categories are over budget right now.</p>
            </div>
          )}
          <div className="planner-card border-amber-400/40 bg-amber-500/10 p-4">
            <p className="inline-flex items-center gap-2 font-medium text-amber-500"><AlertTriangle className="h-4 w-4" /> Upcoming bill warning</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {summary.upcoming.length > 0
                ? `${summary.upcoming.length} bill(s) are due before your next paycheck.`
                : "No upcoming bills before your next paycheck."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent transactions</h3>
          <TransactionTable transactions={summary.inPeriod.slice(-8).reverse()} />
        </div>
        <CanIAffordCalculator
          categories={categories.filter((c) => c.active)}
          safeToSpend={summary.safeToSpend}
          categoryRemainingById={categoryRemainingById}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          <h3 className="text-lg font-semibold">Bills before next paycheck</h3>
          <BillList bills={summary.upcoming} />
        </div>
        <div className="space-y-2 lg:col-span-1">
          <h3 className="text-lg font-semibold">Savings progress</h3>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} progress={calculateGoalProgress(goal.currentAmount, goal.targetAmount)} />
          ))}
        </div>
        <div className="space-y-2 lg:col-span-1">
          <h3 className="text-lg font-semibold">Debt payoff summary</h3>
          {debts.map((debt) => {
            const calc = calculateDebtPayoff(debt);
            return (
              <div key={debt.id} className="rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="font-medium">{debt.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Balance {formatCurrency(debt.balance)} · {calc.months} months
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Est. interest {formatCurrency(calc.totalInterest)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <AddTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paychecks={paychecks}
        categories={categories}
        accounts={accounts}
        initial={initialDraft}
        onSave={addTransaction}
      />
    </div>
  );
}
