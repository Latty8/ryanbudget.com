"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight, CalendarDays } from "lucide-react";
import {
  computeHeatmapSummary,
  computeSpendingHeatmapGrid,
  HEATMAP_CELL_CLASS,
  HEATMAP_NET_NEGATIVE_CLASS,
  HEATMAP_NET_POSITIVE_CLASS,
  heatmapLevel,
  type HeatmapDay,
  type HeatmapMetric,
  type HeatmapRange,
} from "@/lib/insights/spending-heatmap";
import {
  EmptyState,
  FilterChip,
  ShellCard,
  fintechForeground,
  fintechMuted,
} from "@/components/fintech/ui";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

const RANGE_OPTIONS: { id: HeatmapRange; label: string }[] = [
  { id: "3", label: "3 months" },
  { id: "6", label: "6 months" },
  { id: "12", label: "12 months" },
  { id: "all", label: "All time" },
];

const METRIC_OPTIONS: { id: HeatmapMetric; label: string }[] = [
  { id: "spending", label: "Spending" },
  { id: "income", label: "Income" },
  { id: "net", label: "Net" },
];

function cellClass(day: HeatmapDay, level: ReturnType<typeof heatmapLevel>, metric: HeatmapMetric) {
  if (!day.inRange) return "bg-transparent";
  if (metric === "net" && day.value !== 0) {
    return day.value > 0 ? HEATMAP_NET_POSITIVE_CLASS[level] : HEATMAP_NET_NEGATIVE_CLASS[level];
  }
  return HEATMAP_CELL_CLASS[level];
}

function formatMetricValue(day: HeatmapDay, metric: HeatmapMetric, currency: Parameters<typeof formatMoney>[1]) {
  if (metric === "spending") return formatMoney(day.spending, currency);
  if (metric === "income") return formatMoney(day.income, currency);
  const prefix = day.net >= 0 ? "+" : "−";
  return `${prefix}${formatMoney(Math.abs(day.net), currency)}`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2.5 sm:px-4 sm:py-3">
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", fintechMuted)}>{label}</p>
      <p className={cn("mt-1 text-base font-semibold tabular-nums sm:text-lg", fintechForeground)}>{value}</p>
      {sub ? <p className={cn("mt-0.5 text-xs", fintechMuted)}>{sub}</p> : null}
    </div>
  );
}

function HeatmapTooltip({
  day,
  metric,
  currency,
  anchor,
}: {
  day: HeatmapDay;
  metric: HeatmapMetric;
  currency: Parameters<typeof formatMoney>[1];
  anchor: DOMRect;
}) {
  const pad = 8;
  const left = Math.min(anchor.left, window.innerWidth - 240);
  const top = anchor.bottom + pad;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-modal)]"
      style={{ left: Math.max(8, left), top }}
      role="tooltip"
    >
      <p className={cn("text-sm font-medium", fintechForeground)}>{format(parseISO(day.date), "EEEE, MMM d, yyyy")}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", fintechForeground)}>
        {formatMetricValue(day, metric, currency)}
      </p>
      {metric === "net" ? (
        <p className={cn("mt-1 text-xs", fintechMuted)}>
          In {formatMoney(day.income, currency)} · Out {formatMoney(day.spending, currency)}
        </p>
      ) : null}
      {day.topCategories.length > 0 ? (
        <ul className={cn("mt-2 space-y-1 border-t border-[var(--border-subtle)] pt-2 text-xs", fintechMuted)}>
          {day.topCategories.map((c) => (
            <li key={c.name} className="flex justify-between gap-2">
              <span className="truncate">{c.name}</span>
              <span className="shrink-0 tabular-nums">{formatMoney(c.amount, currency)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("mt-2 text-xs", fintechMuted)}>No activity this day</p>
      )}
    </div>,
    document.body
  );
}

type Props = {
  embedded?: boolean;
};

export function SpendingHeatmapPanel({ embedded }: Props) {
  const { transactions, currency, weekStart } = useAppDataStore(
    useShallow((s) => ({
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
      weekStart: s.preferences.weekStart,
    }))
  );

  const [range, setRange] = useState<HeatmapRange>("6");
  const [metric, setMetric] = useState<HeatmapMetric>("spending");
  const [hovered, setHovered] = useState<{ day: HeatmapDay; rect: DOMRect } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekStartsOn = weekStart === "monday" ? 1 : 0;

  const grid = useMemo(
    () => computeSpendingHeatmapGrid(transactions, { range, metric, weekStartsOn }),
    [transactions, range, metric, weekStartsOn]
  );

  const summary = useMemo(
    () => computeHeatmapSummary(grid.days, metric),
    [grid.days, metric]
  );

  const hasEnoughData = transactions.length >= 3 && summary.activeDays >= 2;

  const metricLabel = METRIC_OPTIONS.find((m) => m.id === metric)?.label ?? "Spending";

  if (!hasEnoughData) {
    return (
      <div className="space-y-4">
        {embedded ? (
          <p className={cn("text-sm", fintechMuted)}>
            See when you spend most — daily patterns over months at a glance.
          </p>
        ) : null}
        <ShellCard className="p-6 sm:p-8">
          <EmptyState
            icon={CalendarDays}
            title="Not enough data yet"
            description="Add transactions across a few days or weeks. Your calendar heatmap will show spending rhythm, busy days, and weekday vs weekend patterns."
          />
        </ShellCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {embedded ? (
        <p className={cn("text-sm", fintechMuted)}>
          GitHub-style calendar of daily {metricLabel.toLowerCase()} — darker cells mean more activity in that period.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <FilterChip key={opt.id} active={range === opt.id} onClick={() => setRange(opt.id)}>
              {opt.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map((opt) => (
            <FilterChip key={opt.id} active={metric === opt.id} onClick={() => setMetric(opt.id)}>
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg / day"
          value={formatMoney(summary.averageDaily, currency)}
          sub={`${summary.activeDays} active days`}
        />
        <StatCard
          label="Highest day"
          value={summary.highest ? formatMetricValue(summary.highest, metric, currency) : "—"}
          sub={summary.highest ? format(parseISO(summary.highest.date), "MMM d") : undefined}
        />
        <StatCard
          label="Lowest day"
          value={summary.lowest ? formatMetricValue(summary.lowest, metric, currency) : "—"}
          sub={summary.lowest ? format(parseISO(summary.lowest.date), "MMM d") : undefined}
        />
        <StatCard
          label="Weekday vs weekend"
          value={
            summary.higherSpendPeriod === "weekend"
              ? "Weekends higher"
              : summary.higherSpendPeriod === "weekday"
                ? "Weekdays higher"
                : summary.higherSpendPeriod === "tie"
                  ? "About the same"
                  : "—"
          }
          sub={`${formatMoney(summary.weekdayAverage, currency)} weekday · ${formatMoney(summary.weekendAverage, currency)} weekend`}
        />
      </div>

      <ShellCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={cn("text-sm font-semibold", fintechForeground)}>Spending heatmap</h2>
            <p className={cn("mt-1 text-xs", fintechMuted)}>
              {formatMoney(summary.totalInRange, currency)} total · {metricLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((l) => (
              <span
                key={l}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  metric === "net" ? HEATMAP_NET_POSITIVE_CLASS[l] : HEATMAP_CELL_CLASS[l]
                )}
              />
            ))}
            <span>More</span>
            {metric === "net" ? (
              <span className="ml-2 text-[var(--muted)]">· green = net positive</span>
            ) : null}
          </div>
        </div>

        <div ref={gridRef} className="mt-5 overflow-x-auto pb-1">
          <div className="inline-block min-w-full">
            <div
              className="mb-1 grid gap-[3px]"
              style={{
                gridTemplateColumns: `2.25rem repeat(${grid.weeks.length}, minmax(0.75rem, 1fr))`,
              }}
            >
              <div />
              {grid.weeks.map((_, wi) => {
                const label = grid.monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div
                    key={`month-${wi}`}
                    className="truncate text-[10px] font-medium text-[var(--muted)]"
                  >
                    {label?.label ?? ""}
                  </div>
                );
              })}
            </div>

            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div
                key={`row-${row}`}
                className="grid gap-[3px]"
                style={{
                  gridTemplateColumns: `2.25rem repeat(${grid.weeks.length}, minmax(0.75rem, 1fr))`,
                }}
              >
                <div className="flex items-center text-[10px] text-[var(--muted)]">
                  {grid.dayLabels[row * 2] ?? ""}
                </div>
                {grid.weeks.map((week, wi) => {
                  const day = week.days[row];
                  if (!day) {
                    return <div key={`empty-${wi}-${row}`} className="aspect-square min-h-3" />;
                  }
                  const level = heatmapLevel(day.intensity);
                  const isHovered = hovered?.day.date === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={cn(
                        "aspect-square min-h-[0.75rem] min-w-[0.75rem] max-w-[1.125rem] rounded-[3px] transition hover:ring-2 hover:ring-[var(--accent)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                        cellClass(day, level, metric),
                        !day.inRange && "opacity-30",
                        isHovered && "ring-2 ring-[var(--foreground)]/40"
                      )}
                      aria-label={`${day.label}: ${formatMetricValue(day, metric, currency)}`}
                      onMouseEnter={(e) =>
                        setHovered({ day, rect: e.currentTarget.getBoundingClientRect() })
                      }
                      onMouseLeave={() => setHovered(null)}
                      onFocus={(e) =>
                        setHovered({ day, rect: e.currentTarget.getBoundingClientRect() })
                      }
                      onBlur={() => setHovered(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className={cn("mt-3 text-center text-[10px] sm:text-xs", fintechMuted)}>
          Hover or focus a cell for details · Scroll horizontally on smaller screens
        </p>
      </ShellCard>

      {hovered ? (
        <HeatmapTooltip
          day={hovered.day}
          metric={metric}
          currency={currency}
          anchor={hovered.rect}
        />
      ) : null}
    </div>
  );
}

/** Compact preview for the Insights → Trends tab. */
export function SpendingHeatmapTeaser() {
  const { transactions, currency, weekStart } = useAppDataStore(
    useShallow((s) => ({
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
      weekStart: s.preferences.weekStart,
    }))
  );

  const weekStartsOn = weekStart === "monday" ? 1 : 0;
  const grid = useMemo(
    () =>
      computeSpendingHeatmapGrid(transactions, {
        range: "3",
        metric: "spending",
        weekStartsOn,
      }),
    [transactions, weekStartsOn]
  );
  const summary = useMemo(
    () => computeHeatmapSummary(grid.days, "spending"),
    [grid.days]
  );

  const recentWeeks = grid.weeks.slice(-14);
  const hasEnoughData = transactions.length >= 3 && summary.activeDays >= 2;

  if (!hasEnoughData) return null;

  return (
    <ShellCard className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn("text-sm font-semibold", fintechForeground)}>Spending rhythm</h2>
          <p className={cn("mt-1 text-xs", fintechMuted)}>
            Last 3 months · avg {formatMoney(summary.averageDaily, currency)}/day
          </p>
        </div>
        <Link
          href="/insights?tab=heatmap"
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
        >
          Full heatmap
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-block">
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={`teaser-row-${row}`}
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${recentWeeks.length}, 0.625rem)`,
              }}
            >
              {recentWeeks.map((week, wi) => {
                const day = week.days[row];
                if (!day || !day.inRange) {
                  return <span key={`t-${wi}-${row}`} className="h-2.5 w-2.5 rounded-[2px] bg-transparent" />;
                }
                const level = heatmapLevel(day.intensity);
                return (
                  <span
                    key={day.date}
                    className={cn("h-2.5 w-2.5 rounded-[2px]", HEATMAP_CELL_CLASS[level])}
                    title={`${day.label}: ${formatMoney(day.spending, currency)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className={cn("mt-3 text-xs", fintechMuted)}>
        {summary.highest
          ? `Peak day ${format(parseISO(summary.highest.date), "MMM d")} (${formatMoney(summary.highest.spending, currency)})`
          : null}
        {summary.higherSpendPeriod && summary.higherSpendPeriod !== "tie" ? (
          <span>
            {summary.highest ? " · " : ""}
            {summary.higherSpendPeriod === "weekend" ? "Weekends run higher" : "Weekdays run higher"}
          </span>
        ) : null}
      </p>
    </ShellCard>
  );
}
