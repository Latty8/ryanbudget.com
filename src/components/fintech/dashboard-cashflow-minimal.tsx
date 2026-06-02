"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";
import type { DashboardSummary } from "@/types/finance";

type Props = {
  data: DashboardSummary["cashflow"];
  currency: CurrencyCode;
};

export function DashboardCashflowMinimal({ data, currency }: Props) {
  if (!data.length) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-[var(--muted)]">
        Not enough history yet
      </p>
    );
  }

  return (
    <div className="h-56 min-h-56 w-full min-w-0 md:h-64">
      <ResponsiveContainer width="100%" height="100%" minHeight={224}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            isAnimationActive={false}
            formatter={(value, name) => [
              formatMoney(Number(value ?? 0), currency),
              String(name) === "income" ? "Income" : "Expenses",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
              boxShadow: "var(--shadow-card)",
            }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="var(--chart-income)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="var(--chart-expense)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
