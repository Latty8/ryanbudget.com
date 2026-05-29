"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { affordabilityDecision, calculateRemaining } from "@/lib/planner/calculations";
import { formatCurrency, fromCents } from "@/lib/planner/format";
import type { Category, Transaction } from "@/lib/planner/types";
import { CanIAffordCard, FormField, ProgressBar } from "@/components/planner/ui";
import { useMounted } from "@/components/use-mounted";

const COLORS = ["#009CCF", "#22C55E", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];

export function CategoryBudgetCard({
  name,
  group,
  budgeted,
  spent,
  rollover,
  onBudgetChange,
}: {
  name: string;
  group: string;
  budgeted: number;
  spent: number;
  rollover: boolean;
  onBudgetChange?: (amount: number) => void;
}) {
  const remaining = calculateRemaining(budgeted, spent);
  const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const tone = remaining < 0 ? "danger" : pct > 85 ? "warning" : "success";
  return (
    <article className="planner-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-[var(--muted)]">{group} · {rollover ? "Rollover on" : "Rollover off"}</p>
        </div>
        {onBudgetChange ? (
          <FormField label="Budgeted amount" className="w-36">
            <input
              type="number"
              className="planner-input w-full px-2 py-1 text-sm"
              min={0}
              step="0.01"
              value={budgeted === 0 ? "" : fromCents(budgeted)}
              onChange={(e) => onBudgetChange(Math.round(Number(e.target.value || 0) * 100))}
            />
          </FormField>
        ) : null}
      </div>
      <ProgressBar value={pct} tone={tone} />
      <div className="mt-2 grid grid-cols-3 text-sm">
        <p className="text-[var(--muted)]">Budget {formatCurrency(budgeted)}</p>
        <p className="text-center text-[var(--muted)]">Spent {formatCurrency(spent)}</p>
        <p className={`text-right font-medium ${remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>Left {formatCurrency(remaining)}</p>
      </div>
    </article>
  );
}

export function SpendingChart({
  categoryTotals,
}: {
  categoryTotals: Array<{ name: string; value: number }>;
}) {
  const mounted = useMounted();
  if (categoryTotals.length === 0) {
    return (
      <div className="planner-card p-6 text-sm text-[var(--muted)]">
        No spending data yet for this paycheck. Add transactions to populate charts.
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="planner-card h-64 p-3">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryTotals} dataKey="value" nameKey="name" outerRadius={90}>
                {categoryTotals.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)" }} />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <div className="planner-card h-64 p-3">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryTotals}>
              <XAxis dataKey="name" hide />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)" }} />
              <Bar dataKey="value" fill="#009CCF" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}

export function TrendsChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const mounted = useMounted();
  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      const key = t.date.toISOString().slice(0, 10);
      totals.set(key, (totals.get(key) ?? 0) + (t.type === "income" ? t.amount : -t.amount));
    }
    return [...totals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total / 100) }));
  }, [transactions]);
  return (
    <div className="planner-card h-72 p-3">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border-subtle)" }} />
            <Line type="monotone" dataKey="total" stroke="#22C55E" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export function CanIAffordCalculator({
  categories,
  safeToSpend,
  categoryRemainingById,
}: {
  categories: Category[];
  safeToSpend: number;
  categoryRemainingById: Record<string, number>;
}) {
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const result = affordabilityDecision({
    purchaseAmount: amount,
    categoryRemaining: categoryRemainingById[categoryId] ?? 0,
    safeToSpend,
  });

  return (
    <CanIAffordCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Purchase amount</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount === 0 ? "" : fromCents(amount)}
            onChange={(e) => setAmount(Math.round(Number(e.target.value || 0) * 100))}
            className="planner-input"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="planner-input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p
        className={`mt-3 text-sm ${
          result.status === "affordable"
            ? "text-emerald-600"
            : result.status === "caution"
              ? "text-amber-600"
              : "text-red-600"
        }`}
      >
        {result.message}
      </p>
    </CanIAffordCard>
  );
}
