"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { FileBarChart, Lock, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { ShareReportActions } from "@/components/fintech/share-report-actions";
import { MonthlySummaryCard } from "@/components/fintech/monthly-summary-card";
import { ReportsEmptyState } from "@/components/fintech/reports-empty-state";
import {
  FilterChip,
  fintechForeground,
  fintechMuted,
  GhostButton,
  PageFrame,
  PrimaryButton,
  SectionTitle,
  SegmentToggle,
  ShellCard,
  ShellInput,
} from "@/components/fintech/ui";
import { ReportsChartFrame } from "@/components/fintech/reports-chart-frame";
import { ExportPdfButton } from "@/components/fintech/export-pdf-button";
import { downloadTextFile, transactionsToCsv } from "@/lib/data/export-import";
import { usePremium } from "@/hooks/use-premium";
import {
  computeReportData,
  resolveReportRange,
  type ReportDatePreset,
} from "@/lib/reports/compute-report-data";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { usePageCloudSync } from "@/hooks/use-page-cloud-sync";
import {
  formatReportTooltipValue,
  reportChartAxis,
  reportChartGrid,
  reportTooltipStyle,
} from "@/components/fintech/reports-chart-config";

const PRESETS: { id: ReportDatePreset; label: string; premium?: boolean }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-3-months", label: "Last 3 months", premium: true },
  { id: "this-year", label: "This year", premium: true },
  { id: "custom", label: "Custom range", premium: true },
];

export function ReportsView({ embedded = false }: { embedded?: boolean }) {
  usePageCloudSync();
  const { canUse, premium } = usePremium();
  const { demoMode } = useDemoMode();
  const advanced = canUse("pdf_export");

  const { accounts, categories, transactions, currency, goals, recurring, profile } = useAppDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.demoTransactions,
      currency: s.preferences.currency,
      goals: s.goals,
      recurring: s.demoRecurring,
      profile: s.profile,
    }))
  );

  const [cadence, setCadence] = useState<"monthly" | "biweekly">("biweekly");
  const [preset, setPreset] = useState<ReportDatePreset>("this-month");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-01"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [chartTab, setChartTab] = useState<"cashflow" | "categories" | "budget">("cashflow");

  const range = useMemo(
    () => resolveReportRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const report = useMemo(
    () =>
      computeReportData({
        range,
        cadence,
        accounts,
        categories,
        transactions,
        primaryCurrency: currency,
      }),
    [range, cadence, accounts, categories, transactions, currency]
  );

  const pickPreset = (next: ReportDatePreset) => {
    const meta = PRESETS.find((p) => p.id === next);
    if (meta?.premium && !advanced) {
      toast.message("Upgrade to Premium for advanced date ranges", { description: "Demo mode includes this feature." });
      return;
    }
    setPreset(next);
  };

  const fetchReportHtml = async () => {
    const { fetchPdfReportHtml } = await import("@/lib/reports/export-pdf-client");
    const result = await fetchPdfReportHtml(buildPdfPayload(), { premium: !!premium, demoMode });
    return "html" in result ? result.html : null;
  };

  const buildPdfPayload = () => ({
    title: range.label,
    reportKind: "reports" as const,
    cadence,
    income: report.income,
    expenses: report.expenses,
    net: report.net,
    balance: report.balance,
    categories: report.budgetVsActual.map((c) => ({
      name: c.name,
      budgeted: c.budgeted,
      spent: c.spent,
    })),
    cashflow: report.cashflow,
    goals: goals.map((g) => ({
      name: g.name,
      current: g.current,
      target: g.target,
      pct: g.target > 0 ? (g.current / g.target) * 100 : 0,
    })),
    recurring: recurring.map((r) => ({
      name: r.name,
      amount: r.amount,
      cadence: r.cadence,
      nextDate: r.nextDate,
    })),
  });

  const tooltipProps = {
    ...reportTooltipStyle,
    formatter: (value: unknown, name: unknown) => formatReportTooltipValue(value, name, currency),
  };

  const hasTransactions = transactions.length > 0;
  const hasChartData =
    report.income > 0 ||
    report.expenses > 0 ||
    report.cashflow.some((p) => p.income > 0 || p.expenses > 0);

  const cadenceToggle = (
    <SegmentToggle
      value={cadence}
      onChange={setCadence}
      options={[
        { value: "biweekly" as const, label: "Bi-weekly" },
        { value: "monthly" as const, label: "Monthly" },
      ]}
    />
  );

  if (!hasTransactions) {
    const empty = (
      <ReportsEmptyState
        title="No data yet"
        description="Add a paycheck, bills, or everyday spending — your cash flow and category charts will show up here."
        actionLabel="Add a transaction"
        actionHref="/transactions"
      />
    );
    if (embedded) return empty;
    return (
      <PageFrame title="Reports" description="Charts appear once you add transactions.">
        {empty}
      </PageFrame>
    );
  }

  const body = (
    <>
      {embedded ? <div className="mb-4 flex justify-end">{cadenceToggle}</div> : null}
      <div className="space-y-6 md:space-y-8">
      <MonthlySummaryCard />

      <ShellCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle title="Date range" description={range.label} />
          <div className="flex flex-wrap gap-2">
            <GhostButton
              className="text-xs"
              onClick={() => {
                const filtered = transactions.filter((t) => {
                  const d = t.date.slice(0, 10);
                  const start = range.start.toISOString().slice(0, 10);
                  const end = range.end.toISOString().slice(0, 10);
                  return d >= start && d <= end;
                });
                downloadTextFile(
                  `report-transactions-${range.label.replace(/\s+/g, "-")}.csv`,
                  transactionsToCsv(filtered),
                  "text/csv"
                );
                toast.success("CSV downloaded");
              }}
            >
              Export CSV
            </GhostButton>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <FilterChip
              key={p.id}
              active={preset === p.id}
              onClick={() => pickPreset(p.id)}
              className={p.premium && !advanced ? "opacity-80" : undefined}
            >
              {p.premium && !advanced ? <Lock className="h-3 w-3" aria-hidden /> : null}
              {p.label}
            </FilterChip>
          ))}
        </div>
        {preset === "custom" && advanced ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className={cn("grid gap-1 text-xs", fintechMuted)}>
              From
              <ShellInput type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </label>
            <label className={cn("grid gap-1 text-xs", fintechMuted)}>
              To
              <ShellInput type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </label>
          </div>
        ) : null}
        {!advanced ? (
          <p className={cn("mt-2 text-xs", fintechMuted)}>Free plan: This month only. Premium unlocks extended ranges.</p>
        ) : null}
      </ShellCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Income", value: report.income, accent: "text-[var(--positive)]" },
          { label: "Expenses", value: report.expenses, accent: fintechForeground },
          { label: "Net", value: report.net, accent: report.net >= 0 ? "text-[var(--positive)]" : fintechForeground },
          { label: "Net worth", value: report.balance, accent: fintechForeground },
        ].map((m) => (
          <ShellCard key={m.label} className="!p-4 sm:!p-5">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.12em]", fintechMuted)}>{m.label}</p>
            <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", m.accent)}>
              {formatMoney(m.value, currency)}
            </p>
          </ShellCard>
        ))}
      </div>

      {!hasChartData ? (
        <ReportsEmptyState
          icon={ReceiptText}
          title="Not enough activity in this range"
          description="Try a wider date range or log income and expenses for this period to see charts."
          actionLabel="View transactions"
          actionHref="/transactions"
        />
      ) : null}

      {hasChartData ? (
      <ShellCard>
        <p className={cn("mb-1 text-sm font-semibold", fintechForeground)}>Charts</p>
        <p className={cn("mb-4 text-xs", fintechMuted)}>{range.label}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["cashflow", "Cash flow"],
              ["categories", "Spending by category"],
              ["budget", "Budget vs actual"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cn(
                "rounded-[var(--radius-inner)] px-3 py-1.5 text-sm font-medium transition",
                chartTab === key
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              onClick={() => setChartTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {chartTab === "cashflow" ? (
          <ReportsChartFrame
            isEmpty={!report.cashflow.some((p) => p.income > 0 || p.expenses > 0)}
            empty={
              <p className={cn("flex h-full items-center justify-center text-sm", fintechMuted)}>
                No cash flow in this range yet.
              </p>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="var(--chart-income)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="expenses" stroke="var(--chart-expense)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="net" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ReportsChartFrame>
        ) : null}

        {chartTab === "categories" ? (
          <ReportsChartFrame isEmpty={report.spendingByCategory.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      percent && percent > 0.05 ? `${name}` : ""
                    }
                  >
                    {report.spendingByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
          </ReportsChartFrame>
        ) : null}

        {chartTab === "budget" ? (
          <ReportsChartFrame isEmpty={report.budgetVsActual.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.budgetVsActual.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: reportChartAxis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend />
                <Bar dataKey="budgeted" fill="var(--accent)" name="Budgeted" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="spent" fill="var(--chart-expense)" name="Spent" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ReportsChartFrame>
        ) : null}
      </ShellCard>
      ) : null}

      {hasChartData ? (
      <ShellCard>
        <SectionTitle title="Net worth trend" description="Balance over time in selected range" />
        <ReportsChartFrame heightClass="h-56 md:h-64" className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.netWorthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportsChartFrame>
      </ShellCard>
      ) : null}

      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-[var(--accent)]" aria-hidden />
            <div>
              <p className={cn("text-sm font-medium", fintechForeground)}>Export report</p>
              <p className={cn("text-xs", fintechMuted)}>
                Branded PDF via print dialog {premium ? "(included)" : ""}
              </p>
            </div>
          </div>
          {canUse("pdf_export") ? (
            <div className="flex flex-wrap gap-2">
              <ExportPdfButton
                variant="primary"
                buildPayload={buildPdfPayload}
                eventName="pdf_export"
              />
              <ShareReportActions
                reportTitle={range.label}
                ownerName={profile.name}
                onExportPdf={fetchReportHtml}
              />
            </div>
          ) : (
            <UpgradePrompt
              compact
              title="Premium PDF exports"
              description="Export a beautiful summary with category breakdowns."
              feature="pdf_export"
            />
          )}
        </div>
        {!canUse("pdf_export") ? (
          <div className="mt-4">
            <UpgradePrompt
              title="Branded PDF reports are Premium"
              description="Demo mode and Premium include advanced date filters and polished PDF export."
              feature="pdf_export"
            />
          </div>
        ) : null}
      </ShellCard>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <PageFrame
      title="Reports"
      description={`Calm insights for your pay rhythm — ${range.label}`}
      action={cadenceToggle}
    >
      {body}
    </PageFrame>
  );
}
