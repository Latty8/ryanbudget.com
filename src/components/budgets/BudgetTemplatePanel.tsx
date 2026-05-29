"use client";

import { useState } from "react";
import { TemplateAssignedInput } from "@/components/budgets/TemplateAssignedInput";
import { formatMoney } from "@/lib/format-money";
import {
  buildCategoryTreeRows,
  isAssignableCategory,
} from "@/lib/categories";
import { sumTemplateAmounts, templateHalvesHasValues } from "@/lib/budget-template";
import type { PeriodBounds } from "@/lib/period";
import type { BudgetSettings } from "@/lib/types";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { useBudgetStore } from "@/store/useBudgetStore";

type Props = {
  periodKey: string;
  bounds: PeriodBounds;
  showHalves: boolean;
  periodHalves: Array<{ title: string; rangeText: string }> | null;
  settings: BudgetSettings;
};

export function BudgetTemplatePanel({
  periodKey,
  bounds,
  showHalves,
  periodHalves,
  settings,
}: Props) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(true);
  const categories = useBudgetStore((s) => s.categories);
  const assignmentTemplate = useBudgetStore((s) => s.assignmentTemplate);
  const assignmentTemplateHalves = useBudgetStore(
    (s) => s.assignmentTemplateHalves
  );
  const assignmentsByPeriod = useBudgetStore((s) => s.assignmentsByPeriod);
  const applyTemplateToPeriod = useBudgetStore((s) => s.applyTemplateToPeriod);
  const savePeriodAsTemplate = useBudgetStore((s) => s.savePeriodAsTemplate);

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const tree = buildCategoryTreeRows(expenseCategories);
  const templateTotal = sumTemplateAmounts(
    assignmentTemplate,
    assignmentTemplateHalves
  );
  const periodHasFunding = Object.values(
    assignmentsByPeriod[periodKey] ?? {}
  ).some((v) => v > 0.001);

  const periodLabel =
    settings.periodType === "monthly"
      ? "month"
      : settings.periodType === "biweekly"
        ? "pay period"
        : "week";

  const useTemplateHalves =
    showHalves && templateHalvesHasValues(assignmentTemplateHalves);

  return (
    <section className="surface-card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7 sm:py-6"
        aria-expanded={open}
      >
        <div>
          <h2 className="type-form-title">Budget template</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
            Like copying a Google Sheet tab — set rent, car, groceries once, then
            apply to each new {periodLabel}.
          </p>
        </div>
        <span className="shrink-0 text-sm text-[var(--muted)]">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border-subtle)] px-5 pb-6 pt-2 sm:px-7 sm:pb-8">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Amounts are per budget period ({bounds.label}). Template total:{" "}
            <span className="font-mono font-medium text-[var(--foreground)]">
              {formatMoney(templateTotal)}
            </span>
          </p>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => applyTemplateToPeriod(periodKey, "onlyEmpty")}
            >
              Apply template to {bounds.label}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const run = () => applyTemplateToPeriod(periodKey, "overwrite");
                if (!periodHasFunding) {
                  run();
                  return;
                }
                void confirm({
                  title: "Replace this period?",
                  description: "Assignments will be overwritten with your saved template.",
                  warning: "Categories not in the template will be cleared.",
                  confirmLabel: "Replace period",
                  variant: "destructive",
                  onConfirm: run,
                });
              }}
            >
              Replace period with template
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => savePeriodAsTemplate(periodKey)}
              disabled={!periodHasFunding}
              title={
                periodHasFunding
                  ? undefined
                  : "Assign something in this period first"
              }
            >
              Save this period as template
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <tr>
                  <th className="px-4 py-3 type-table-head">Category</th>
                  {showHalves && periodHalves ? (
                    <>
                      <th className="px-4 py-3 type-table-head">
                        {periodHalves[0].title}
                      </th>
                      <th className="px-4 py-3 type-table-head">
                        {periodHalves[1].title}
                      </th>
                      <th className="px-4 py-3 text-right type-table-head">
                        Period total
                      </th>
                    </>
                  ) : (
                    <th className="px-4 py-3 type-table-head">
                      Per period
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tree.map((row) => {
                  const c = row.category;
                  if (!isAssignableCategory(expenseCategories, c)) {
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60"
                      >
                        <td
                          colSpan={showHalves && periodHalves ? 4 : 2}
                          className="px-4 py-2.5 font-semibold"
                        >
                          {c.name}
                        </td>
                      </tr>
                    );
                  }

                  const halfTotal =
                    (assignmentTemplateHalves.first[c.id] ?? 0) +
                    (assignmentTemplateHalves.second[c.id] ?? 0);
                  const total =
                    halfTotal > 0
                      ? halfTotal
                      : (assignmentTemplate[c.id] ?? 0);

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border-subtle)]"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 ${row.type === "item" && row.indent ? "pl-4" : ""}`}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </td>
                      {showHalves && periodHalves ? (
                        <>
                          <td className="px-4 py-3">
                            <TemplateAssignedInput
                              categoryId={c.id}
                              assigned={
                                assignmentTemplateHalves.first[c.id] ?? 0
                              }
                              halfSlot="first"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TemplateAssignedInput
                              categoryId={c.id}
                              assigned={
                                assignmentTemplateHalves.second[c.id] ?? 0
                              }
                              halfSlot="second"
                            />
                          </td>
                          <td className="figure px-4 py-3 text-right font-mono text-sm text-[var(--muted)]">
                            {formatMoney(total)}
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3">
                          <TemplateAssignedInput
                            categoryId={c.id}
                            assigned={assignmentTemplate[c.id] ?? 0}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {showHalves && !useTemplateHalves && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Fill Week 1 / Week 2 columns to split the template per paycheck.
              Otherwise the full amount applies to Week 1 when you use the
              template.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
