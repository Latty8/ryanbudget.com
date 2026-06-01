import { formatMoney } from "@/store/useAppDataStore";
import type { CurrencyCode } from "@/types/app-settings";

export const reportChartGrid = "var(--chart-grid)";
export const reportChartAxis = "var(--muted)";

export const reportTooltipStyle = {
  isAnimationActive: false as const,
  contentStyle: {
    borderRadius: "var(--radius-inner)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--foreground)",
    boxShadow: "var(--shadow-card)",
    fontSize: 12,
  },
};

export function formatReportTooltipValue(value: unknown, name: unknown, currency: CurrencyCode) {
  const label =
    String(name) === "income"
      ? "Income"
      : String(name) === "expenses"
        ? "Expenses"
        : String(name) === "net"
          ? "Net"
          : String(name) === "netWorth"
            ? "Net worth"
            : String(name) === "budgeted"
              ? "Budgeted"
              : String(name) === "spent"
                ? "Spent"
                : String(name);
  return [formatMoney(Number(value ?? 0), currency), label] as [string, string];
}
