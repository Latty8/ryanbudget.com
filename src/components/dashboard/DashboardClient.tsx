"use client";

import { eachDayOfInterval, format } from "date-fns";
import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { SectionLabel, PageHeader } from "@/components/ui/PageChrome";
import { formatMoney } from "@/lib/format-money";
import { getPeriodBoundsOffset, isDateInPeriod } from "@/lib/period";
import {
  buildCategoryTreeRows,
  budgetCategoryIds,
  categoryFullName,
  sumChildValues,
} from "@/lib/categories";
import { getSnapshotForPeriodBounds } from "@/lib/ynab-simulation";
import { useMounted } from "@/components/use-mounted";
import { useBudgetStore } from "@/store/useBudgetStore";

export function DashboardClient() {
  const areaGradId = useId().replace(/:/g, "");
  const [periodOffset, setPeriodOffset] = useState(0);
  const mounted = useMounted();
  const settings = useBudgetStore((s) => s.settings);
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const assignmentsByPeriod = useBudgetStore((s) => s.assignmentsByPeriod);
  const debts = useBudgetStore((s) => s.debts);
  const vaults = useBudgetStore((s) => s.vaults);

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading your budget…
      </div>
    );
  }

  const bounds = getPeriodBoundsOffset(settings, periodOffset);
  const inPeriod = transactions.filter((t) =>
    isDateInPeriod(t.date, bounds)
  );

  const income = inPeriod
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = inPeriod
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const categoryIds = budgetCategoryIds(categories);
  const categoryTree = buildCategoryTreeRows(categories);
  const ynabSnap = getSnapshotForPeriodBounds(
    settings,
    transactions,
    assignmentsByPeriod,
    categoryIds,
    bounds
  );

  const expenseByCategory: Record<string, number> = {};
  for (const t of inPeriod) {
    if (t.type !== "expense") continue;
    const key = t.categoryId ?? "uncat";
    expenseByCategory[key] = (expenseByCategory[key] ?? 0) + t.amount;
  }

  const pieData = Object.entries(expenseByCategory).map(([id, value]) => ({
    id,
    name:
      id === "uncat"
        ? "Uncategorized"
        : categoryFullName(categories, id) || "Unknown category",
    value,
    color:
      id === "uncat"
        ? "#94a3b8"
        : catMap[id]?.color ?? "#64748b",
  }));

  const summaryVs = [
    { name: "Income", amount: income, fill: "var(--chart-income)" },
    { name: "Expenses", amount: expense, fill: "var(--chart-expense)" },
  ];

  const days = eachDayOfInterval({ start: bounds.start, end: bounds.end });
  const trendData = days.map((day) => {
    const iso = format(day, "yyyy-MM-dd");
    const dayExpense = inPeriod
      .filter((t) => t.type === "expense" && t.date === iso)
      .reduce((s, t) => s + t.amount, 0);
    return {
      label: format(day, "MMM d"),
      expenses: Math.round(dayExpense * 100) / 100,
    };
  });

  const budgetRows = categoryTree.map((row) => {
    const c = row.category;
    if (row.type === "group") {
      return {
        categoryId: c.id,
        name: c.name,
        assigned: sumChildValues(
          categories,
          c.id,
          ynabSnap?.assignedByCat ?? {}
        ),
        spent: sumChildValues(
          categories,
          c.id,
          ynabSnap?.activityByCat ?? {}
        ),
        available: sumChildValues(
          categories,
          c.id,
          ynabSnap?.availableEndByCat ?? {}
        ),
        color: c.color,
        isGroup: true,
        indent: false,
      };
    }
    return {
      categoryId: c.id,
      name: c.name,
      assigned: ynabSnap?.assignedByCat[c.id] ?? 0,
      spent: ynabSnap?.activityByCat[c.id] ?? 0,
      available: ynabSnap?.availableEndByCat[c.id] ?? 0,
      color: c.color,
      isGroup: false,
      indent: row.indent,
    };
  });

  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalDebtPayments = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const totalVaultBalance = vaults.reduce((s, v) => s + v.balance, 0);

  const periodEyebrowBase =
    settings.periodType === "weekly"
      ? "Weekly period"
      : settings.periodType === "biweekly"
        ? "Bi-weekly period"
        : "Monthly period";
  const periodEyebrow =
    periodOffset === 0 ? periodEyebrowBase : `${periodEyebrowBase} · Past view`;

  const readyToAssign = ynabSnap?.readyToAssignEnd ?? 0;

  return (
    <div className="space-y-12 sm:space-y-16">
      <PageHeader
        eyebrow={periodEyebrow}
        title={bounds.label}
        description={
          periodOffset === 0
            ? "Assign dollars to envelopes, then track spending against your plan."
            : `Snapshot for ${bounds.label}.`
        }
      />

      <PeriodSwitcher
        boundsLabel={bounds.label}
        offset={periodOffset}
        onOffsetChange={setPeriodOffset}
        viewingHint="Budget period"
      />

      <section className="border-b border-[var(--border-subtle)] pb-10 sm:pb-12">
        <p className="type-eyebrow">Ready to assign</p>
        <p
          className={`figure mt-2 text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-none tracking-[-0.04em] ${
            readyToAssign < 0
              ? "text-negative"
              : readyToAssign > 0
                ? "text-positive"
                : "text-[var(--foreground)]"
          }`}
        >
          {formatMoney(readyToAssign)}
        </p>
        {(totalVaultBalance > 0 || totalDebt > 0) && (
          <p className="type-caption mt-4 max-w-lg">
            {totalVaultBalance > 0 && (
              <span>
                {formatMoney(totalVaultBalance)} in savings vaults
                {vaults.length > 1 ? ` across ${vaults.length} goals` : ""}
              </span>
            )}
            {totalVaultBalance > 0 && totalDebt > 0 ? " · " : null}
            {totalDebt > 0 && (
              <span>
                {formatMoney(totalDebt)} debt
                {totalDebtPayments > 0
                  ? ` (${formatMoney(totalDebtPayments)}/mo payments)`
                  : ""}
              </span>
            )}
          </p>
        )}
      </section>

      {budgetRows.length > 0 && (
        <section className="surface-card p-6 sm:p-8">
          <SectionLabel>Envelopes this period</SectionLabel>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Assigned is what you planned for this period; Activity is spending;
            Available includes rolled balances from earlier periods.
          </p>
          <div className="space-y-5">
            {budgetRows.map((row) => {
              const isGroup = "isGroup" in row && row.isGroup;
              const hasAssigned = row.assigned > 0;
              const barPct = hasAssigned
                ? Math.min((row.spent / row.assigned) * 100, 100)
                : row.spent > 0
                  ? 100
                  : 0;
              const overAssigned = hasAssigned && row.spent > row.assigned;
              return (
                <div
                  key={row.categoryId}
                  className={
                    row.indent
                      ? "border-l-2 border-[var(--accent)]/20 pl-4"
                      : isGroup
                        ? "rounded-lg bg-[var(--surface-elevated)]/70 px-3 py-2"
                        : ""
                  }
                >
                  <div className="mb-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.name}
                      {isGroup ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                          Group
                        </span>
                      ) : null}
                    </span>
                    <span className="figure shrink-0 text-right font-mono text-xs font-medium text-[var(--muted)] sm:text-sm">
                      Avail{" "}
                      <span
                        className={
                          row.available < 0
                            ? "text-negative"
                            : row.available > 0
                              ? "text-positive"
                              : ""
                        }
                      >
                        {formatMoney(row.available)}
                      </span>
                      {" · "}
                      Act −{formatMoney(row.spent)}
                      {" · "}
                      Asgn {formatMoney(row.assigned)}
                    </span>
                  </div>
                  {!isGroup && (hasAssigned || row.spent > 0) && (
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-hover)] ring-1 ring-[var(--border-subtle)]">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: overAssigned
                            ? "var(--negative)"
                            : row.color,
                        }}
                      />
                    </div>
                  )}
                  {overAssigned ? (
                    <p className="figure mt-2 font-mono text-xs text-negative">
                      {formatMoney(row.spent - row.assigned)} over assigned
                    </p>
                  ) : hasAssigned ? (
                    <p className="figure mt-2 font-mono text-xs text-[var(--muted)]">
                      {formatMoney(Math.max(0, row.assigned - row.spent))}{" "}
                      unspent from assigned
                    </p>
                  ) : row.spent > 0 ? (
                    <p className="figure mt-2 font-mono text-xs text-[var(--muted)]">
                      No dollars assigned this period — spending draws from
                      Available only.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <ChartCard title="Spending by category">
          {pieData.length === 0 ? (
            <EmptyChart hint="Add expense transactions to see this chart." />
          ) : (
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatMoney(typeof value === "number" ? value : Number(value))
                    }
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Income vs expenses">
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryVs} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="4 8" stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={88} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 13 }} />
                <Tooltip
                  formatter={(value) =>
                    formatMoney(typeof value === "number" ? value : Number(value))
                  }
                />
                <Bar dataKey="amount" radius={[0, 12, 12, 0]} barSize={28}>
                  {summaryVs.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section>
        <ChartCard title="Daily expenses">
          {trendData.every((d) => d.expenses === 0) ? (
            <EmptyChart hint="No expenses recorded in this period yet." />
          ) : (
            <div className="h-[320px] w-full min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: 4, right: 8 }}>
                  <defs>
                    <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}`} width={52} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) =>
                      formatMoney(typeof value === "number" ? value : Number(value))
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--accent)"
                    fill={`url(#${areaGradId})`}
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6 sm:p-8">
      <SectionLabel className="mb-5">{title}</SectionLabel>
      {children}
    </div>
  );
}

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/65 px-6 text-center text-sm leading-relaxed text-[var(--muted)]">
      {hint}
    </div>
  );
}
