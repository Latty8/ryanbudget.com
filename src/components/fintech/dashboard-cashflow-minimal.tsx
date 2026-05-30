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
  return (
    <div className="h-56 w-full md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
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
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
