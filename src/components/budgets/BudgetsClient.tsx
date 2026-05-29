"use client";

import { useState } from "react";
import { BudgetTemplatePanel } from "@/components/budgets/BudgetTemplatePanel";
import { YnabAssignedInput } from "@/components/budgets/YnabAssignedInput";
import { PageHeader } from "@/components/ui/PageChrome";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { formatMoney } from "@/lib/format-money";
import { getPeriodBoundsOffset, isDateInPeriod } from "@/lib/period";
import {
  getPeriodHalves,
  halfBoundsAsPeriodBounds,
  supportsPeriodHalves,
} from "@/lib/period-halves";
import {
  buildCategoryTreeRows,
  budgetCategoryIds,
  sumChildValues,
} from "@/lib/categories";
import { periodKey } from "@/lib/period-key";
import type { PeriodType } from "@/lib/types";
import {
  maxAssignableForCategory,
  sumExpenseByCategory,
  sumIncomeInPeriod,
  getSnapshotForPeriodBounds,
} from "@/lib/ynab-simulation";
import { useMounted } from "@/components/use-mounted";
import { useBudgetStore } from "@/store/useBudgetStore";

export function BudgetsClient() {
  const [periodOffset, setPeriodOffset] = useState(0);
  const mounted = useMounted();
  const settings = useBudgetStore((s) => s.settings);
  const setSettings = useBudgetStore((s) => s.setSettings);
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const assignmentsByPeriod = useBudgetStore((s) => s.assignmentsByPeriod);
  const assignmentHalvesByPeriod = useBudgetStore(
    (s) => s.assignmentHalvesByPeriod
  );

  if (!mounted) {
    return (
      <div className="surface-card animate-pulse p-12 text-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  const bounds = getPeriodBoundsOffset(settings, periodOffset);
  const pKey = periodKey(bounds);
  const categoryIds = budgetCategoryIds(categories);
  const categoryTree = buildCategoryTreeRows(categories);

  const periodIncome = sumIncomeInPeriod(transactions, bounds);

  const snap = getSnapshotForPeriodBounds(
    settings,
    transactions,
    assignmentsByPeriod,
    categoryIds,
    bounds
  );

  const rta = snap?.readyToAssignEnd ?? 0;

  const showHalves =
    supportsPeriodHalves(settings) && settings.splitBudgetPeriodHalves;
  const periodHalves = showHalves ? getPeriodHalves(settings, bounds) : null;

  const incomeHalf1 =
    periodHalves != null
      ? sumIncomeInPeriod(
          transactions,
          halfBoundsAsPeriodBounds(periodHalves[0])
        )
      : 0;
  const incomeHalf2 =
    periodHalves != null
      ? sumIncomeInPeriod(
          transactions,
          halfBoundsAsPeriodBounds(periodHalves[1])
        )
      : 0;

  const activityHalf1ByCat =
    periodHalves != null
      ? sumExpenseByCategory(
          transactions,
          halfBoundsAsPeriodBounds(periodHalves[0])
        )
      : {};
  const activityHalf2ByCat =
    periodHalves != null
      ? sumExpenseByCategory(
          transactions,
          halfBoundsAsPeriodBounds(periodHalves[1])
        )
      : {};

  const halfRow = assignmentHalvesByPeriod[pKey];

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Give every dollar a job"
        title="Budget"
        description="Income adds to Ready to Assign. Assign to categories; spending comes from each envelope. Unused balances roll forward."
      />

      <PeriodSwitcher
        boundsLabel={bounds.label}
        offset={periodOffset}
        onOffsetChange={setPeriodOffset}
        viewingHint="Budget period"
      />

      <BudgetTemplatePanel
        periodKey={pKey}
        bounds={bounds}
        showHalves={showHalves}
        periodHalves={periodHalves}
        settings={settings}
      />

      <section
        className={`surface-card p-6 sm:p-8 ${rta < 0 ? "ring-2 ring-negative/40" : ""}`}
      >
        <div className="flex flex-col gap-6 sm:gap-8">
          <div>
            <p className="type-form-title">
              This period
            </p>
            <p className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {bounds.label}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Income
              </p>
              <p className="figure mt-2 font-mono text-xl font-bold text-positive">
                {formatMoney(periodIncome)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Ready to Assign
              </p>
              <p
                className={`figure mt-2 font-mono text-xl font-bold ${
                  rta < 0 ? "text-negative" : rta > 0 ? "text-positive" : ""
                }`}
              >
                {formatMoney(rta)}
              </p>
              <p className="mt-2 text-xs leading-snug text-[var(--muted)]">
                Unassigned after assignments (rolls forward).
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Assigned total
              </p>
              <p className="figure mt-2 font-mono text-xl font-bold">
                {formatMoney(snap?.assignedTotal ?? 0)}
              </p>
            </div>
          </div>

          {showHalves && periodHalves != null && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 sm:p-5">
              <p className="text-xs font-semibold text-[var(--muted)]">
                Income logged by paycheck slice
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {periodHalves[0].title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {periodHalves[0].rangeText}
                  </p>
                  <p className="figure mt-2 font-mono text-base font-semibold text-positive">
                    {formatMoney(incomeHalf1)}
                  </p>
                </div>
                <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {periodHalves[1].title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {periodHalves[1].rangeText}
                  </p>
                  <p className="figure mt-2 font-mono text-base font-semibold text-positive">
                    {formatMoney(incomeHalf2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <h2 className="mb-5 type-form-title">
          Budget period settings
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Frequency</span>
            <select
              value={settings.periodType}
              onChange={(e) =>
                setSettings({
                  periodType: e.target.value as PeriodType,
                })
              }
              className="field w-full max-w-xs"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          {settings.periodType === "weekly" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Week starts on</span>
              <select
                value={settings.weekStartsOn}
                onChange={(e) =>
                  setSettings({
                    weekStartsOn: Number(e.target.value) as 0 | 1,
                  })
                }
                className="field w-full max-w-xs"
              >
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
              </select>
            </label>
          )}

          {settings.periodType === "biweekly" && (
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--muted)]">
                Bi-weekly cycle starts on
              </span>
              <input
                type="date"
                value={settings.biweeklyAnchor}
                onChange={(e) =>
                  setSettings({ biweeklyAnchor: e.target.value })
                }
                className="field w-full max-w-xs"
              />
              <span className="text-xs text-[var(--muted)]">
                Pick the first day of a pay period; every 14 days after that is
                a new period.
              </span>
            </label>
          )}

          {supportsPeriodHalves(settings) && (
            <label className="flex cursor-pointer items-start gap-3 text-sm sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={settings.splitBudgetPeriodHalves}
                onChange={(e) =>
                  setSettings({
                    splitBudgetPeriodHalves: e.target.checked,
                  })
                }
                className="mt-1 size-4 shrink-0 rounded border-[var(--border-subtle)]"
              />
              <span>
                <span className="font-semibold text-[var(--foreground)]">
                  Split into two halves (paycheck planning)
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                  Bi-weekly uses Week 1 and Week 2 (7 days each within your 14-day
                  budget period). Monthly uses the 1st through the 15th vs the
                  16th through month-end — similar to two checks per month.
                  Assigned amounts in each half add up to the period assignment;
                  Ready to Assign still uses the full period total.
                </span>
              </span>
            </label>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden p-0 sm:p-0">
        <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="type-form-title">
            Categories
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {showHalves
              ? "Each category has two panels—one per paycheck slice. Assigned amounts add up to the period total; Available is still the full envelope for the whole period."
              : "Assigned pulls from Ready to Assign. Activity is this period’s spending. Available includes balances rolled from earlier periods."}
          </p>
        </div>
        {showHalves && periodHalves != null ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {categoryTree.map((row) => {
              const c = row.category;
              if (row.type === "group") {
                const assignedTotal = sumChildValues(
                  categories,
                  c.id,
                  snap?.assignedByCat ?? {}
                );
                const available = sumChildValues(
                  categories,
                  c.id,
                  snap?.availableEndByCat ?? {}
                );
                return (
                  <div
                    key={c.id}
                    className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 px-5 py-4 sm:px-7"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                        Group
                      </span>
                    </div>
                    <p className="figure mt-1 text-xs text-[var(--muted)]">
                      Assigned {formatMoney(assignedTotal)} · Available{" "}
                      {formatMoney(available)}
                    </p>
                  </div>
                );
              }

              const assignedTotal = snap?.assignedByCat[c.id] ?? 0;
              const a1 = halfRow?.first[c.id] ?? 0;
              const a2 = halfRow?.second[c.id] ?? 0;
              const available = snap?.availableEndByCat[c.id] ?? 0;
              const maxTotal = maxAssignableForCategory(
                settings,
                transactions,
                assignmentsByPeriod,
                categoryIds,
                bounds,
                c.id
              );
              const maxFirst = Math.max(0, maxTotal - a2);
              const maxSecond = Math.max(0, maxTotal - a1);
              const act1 = activityHalf1ByCat[c.id] ?? 0;
              const act2 = activityHalf2ByCat[c.id] ?? 0;

              return (
                <div
                  key={c.id}
                  className={`px-5 py-5 sm:px-7 sm:py-6 ${row.indent ? "border-l-2 border-[var(--accent)]/25" : ""}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className={`flex items-center gap-2 ${row.indent ? "pl-2" : ""}`}>
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-semibold text-[var(--foreground)]">
                          {c.name}
                        </span>
                      </div>
                      <p className="figure mt-1 pl-4 text-xs text-[var(--muted)]">
                        Period assigned{" "}
                        <span className="font-mono font-medium text-[var(--foreground)]">
                          {formatMoney(assignedTotal)}
                        </span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[var(--muted)]">Available</p>
                      <p
                        className={`figure font-mono text-lg font-semibold ${
                          available < 0
                            ? "text-negative"
                            : available > 0
                              ? "text-positive"
                              : "text-[var(--foreground)]"
                        }`}
                      >
                        {formatMoney(available)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <div className="mb-3 border-b border-[var(--border-subtle)] pb-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {periodHalves[0].title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {periodHalves[0].rangeText}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-1.5 text-[11px] font-medium text-[var(--muted)]">
                            Assigned
                          </p>
                          <YnabAssignedInput
                            periodKey={pKey}
                            categoryId={c.id}
                            assigned={a1}
                            maxAssigned={maxFirst}
                            halfSlot="first"
                          />
                        </div>
                        <div className="sm:text-right">
                          <p className="mb-1 text-[11px] font-medium text-[var(--muted)]">
                            Spending
                          </p>
                          <p className="figure font-mono text-sm text-[var(--foreground)]">
                            {act1 > 0 ? `−${formatMoney(act1)}` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <div className="mb-3 border-b border-[var(--border-subtle)] pb-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {periodHalves[1].title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {periodHalves[1].rangeText}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-1.5 text-[11px] font-medium text-[var(--muted)]">
                            Assigned
                          </p>
                          <YnabAssignedInput
                            periodKey={pKey}
                            categoryId={c.id}
                            assigned={a2}
                            maxAssigned={maxSecond}
                            halfSlot="second"
                          />
                        </div>
                        <div className="sm:text-right">
                          <p className="mb-1 text-[11px] font-medium text-[var(--muted)]">
                            Spending
                          </p>
                          <p className="figure font-mono text-sm text-[var(--foreground)]">
                            {act2 > 0 ? `−${formatMoney(act2)}` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <tr>
                  <th className="px-4 py-3 type-table-head sm:px-5">
                    Category
                  </th>
                  <th className="px-4 py-3 type-table-head sm:px-5">
                    Assigned
                  </th>
                  <th className="px-4 py-3 text-right type-table-head sm:px-6">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-right type-table-head sm:px-6">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryTree.map((row) => {
                  const c = row.category;
                  if (row.type === "group") {
                    const assigned = sumChildValues(
                      categories,
                      c.id,
                      snap?.assignedByCat ?? {}
                    );
                    const activity = sumChildValues(
                      categories,
                      c.id,
                      snap?.activityByCat ?? {}
                    );
                    const available = sumChildValues(
                      categories,
                      c.id,
                      snap?.availableEndByCat ?? {}
                    );
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70"
                      >
                        <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                          <span className="inline-flex items-center gap-2 font-semibold">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                            {c.name}
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                              Group
                            </span>
                          </span>
                        </td>
                        <td className="figure px-4 py-3.5 font-mono text-sm sm:px-5 sm:py-4">
                          {formatMoney(assigned)}
                        </td>
                        <td className="figure px-4 py-3.5 text-right font-mono text-sm sm:px-5 sm:py-4">
                          {activity > 0 ? `−${formatMoney(activity)}` : "—"}
                        </td>
                        <td className="figure px-4 py-3.5 text-right font-mono text-sm font-semibold sm:px-6 sm:py-4">
                          {formatMoney(available)}
                        </td>
                      </tr>
                    );
                  }

                  const assigned = snap?.assignedByCat[c.id] ?? 0;
                  const activity = snap?.activityByCat[c.id] ?? 0;
                  const available = snap?.availableEndByCat[c.id] ?? 0;
                  const maxAssign = maxAssignableForCategory(
                    settings,
                    transactions,
                    assignmentsByPeriod,
                    categoryIds,
                    bounds,
                    c.id
                  );

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface-hover))]"
                    >
                      <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                        <span
                          className={`inline-flex items-center gap-2 font-semibold ${row.indent ? "pl-5" : ""}`}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </td>
                      <td className="max-w-[11rem] px-4 py-3.5 sm:px-5 sm:py-4">
                        <YnabAssignedInput
                          periodKey={pKey}
                          categoryId={c.id}
                          assigned={assigned}
                          maxAssigned={maxAssign}
                        />
                      </td>
                      <td className="figure px-4 py-3.5 text-right font-mono text-sm sm:px-5 sm:py-4">
                        {activity > 0 ? `−${formatMoney(activity)}` : "—"}
                      </td>
                      <td
                        className={`figure px-4 py-3.5 text-right font-mono text-sm font-semibold sm:px-6 sm:py-4 ${
                          available < 0
                            ? "text-negative"
                            : available > 0
                              ? "text-positive"
                              : "text-[var(--muted)]"
                        }`}
                      >
                        {formatMoney(available)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface-card p-6 sm:p-8">
        <h2 className="mb-4 type-form-title">
          Uncategorized spending this period
        </h2>
        <p className="figure font-mono text-lg font-semibold">
          {formatMoney(
            transactions
              .filter(
                (t) =>
                  t.type === "expense" &&
                  t.categoryId == null &&
                  isDateInPeriod(t.date, bounds)
              )
              .reduce((s, t) => s + t.amount, 0)
          )}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Assign categories on transactions so Activity shows up in the right
          envelope.
        </p>
      </section>
    </div>
  );
}

