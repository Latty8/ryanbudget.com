"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, FileBarChart, Lock } from "lucide-react";
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
import { PageFrame, PrimaryButton, ShellCard, ShellInput, useShellTheme } from "@/components/fintech/ui";
import { usePremium } from "@/hooks/use-premium";
import {
  computeReportData,
  resolveReportRange,
  type ReportDatePreset,
} from "@/lib/reports/compute-report-data";
import { trackEvent } from "@/lib/analytics";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useDemoMode } from "@/hooks/use-demo-mode";

const PRESETS: { id: ReportDatePreset; label: string; premium?: boolean }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-3-months", label: "Last 3 months", premium: true },
  { id: "this-year", label: "This year", premium: true },
  { id: "custom", label: "Custom range", premium: true },
];

export function ReportsView() {
  const { isLight } = useShellTheme();
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
  const [exporting, setExporting] = useState(false);
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
    const response = await fetch("/api/reports/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-premium": premium || demoMode ? "true" : "false",
        "x-demo": demoMode ? "true" : "false",
      },
      body: JSON.stringify({
        title: range.label,
        cadence,
        income: report.income,
        expenses: report.expenses,
        net: report.net,
        balance: report.balance,
        cashflow: report.cashflow,
        categories: report.budgetVsActual.map((c) => ({
          name: c.name,
          budgeted: c.budgeted,
          spent: c.spent,
        })),
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
      }),
    });
    if (!response.ok) return null;
    return response.text();
  };

  const exportPdf = async () => {
    if (!canUse("pdf_export")) return;
    setExporting(true);
    try {
      const html = await fetchReportHtml();
      if (!html) throw new Error("Export failed");
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
        toast.success("Report opened — use Print to save as PDF");
        trackEvent("pdf_export", { cadence, preset });
      }
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const gridStroke = isLight ? "#e2e8f0" : "#334155";
  const axisStroke = isLight ? "#64748b" : "#94a3b8";

  return (
    <PageFrame title="Reports">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>
          Calm insights for your pay rhythm — {range.label}
        </p>
        <div className="inline-flex rounded-xl border border-slate-600 p-1" role="tablist" aria-label="Pay cadence">
          <button
            type="button"
            role="tab"
            aria-selected={cadence === "monthly"}
            className={cn("rounded-lg px-3 py-1 text-sm", cadence === "monthly" ? "bg-sky-500 text-slate-950" : "")}
            onClick={() => setCadence("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cadence === "biweekly"}
            className={cn("rounded-lg px-3 py-1 text-sm", cadence === "biweekly" ? "bg-sky-500 text-slate-950" : "")}
            onClick={() => setCadence("biweekly")}
          >
            Bi-weekly
          </button>
        </div>
      </div>

      <ShellCard>
        <p className="text-sm font-medium">Date range</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                preset === p.id
                  ? "border-sky-400 bg-sky-500/20 text-sky-200"
                  : isLight
                    ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                    : "border-slate-600 text-slate-300 hover:bg-neutral-900",
                p.premium && !advanced ? "opacity-80" : ""
              )}
              onClick={() => pickPreset(p.id)}
            >
              {p.premium && !advanced ? <Lock className="h-3 w-3" aria-hidden /> : null}
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && advanced ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-slate-400">
              From
              <ShellInput type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs text-slate-400">
              To
              <ShellInput type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </label>
          </div>
        ) : null}
        {!advanced ? (
          <p className="mt-2 text-xs text-slate-500">Free plan: This month only. Premium unlocks extended ranges.</p>
        ) : null}
      </ShellCard>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Income", value: report.income },
          { label: "Expenses", value: report.expenses },
          { label: "Net", value: report.net },
          { label: "Net worth", value: report.balance },
        ].map((m) => (
          <ShellCard key={m.label}>
            <p className={cn("text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
              {m.label}
            </p>
            <p className="mt-1 text-xl font-semibold">{formatMoney(m.value, currency)}</p>
          </ShellCard>
        ))}
      </div>

      <ShellCard>
        <div className="mb-3 flex flex-wrap gap-2">
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
                "rounded-lg px-3 py-1 text-sm",
                chartTab === key ? "bg-sky-500 text-slate-950" : isLight ? "text-slate-600" : "text-slate-300"
              )}
              onClick={() => setChartTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {chartTab === "cashflow" ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" stroke={axisStroke} />
                <YAxis stroke={axisStroke} />
                <Tooltip isAnimationActive={false} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="expenses" stroke="#f472b6" strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="net" stroke="#38bdf8" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {chartTab === "categories" ? (
          <div className="h-72">
            {report.spendingByCategory.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">No spending in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report.spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {report.spendingByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip isAnimationActive={false} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : null}

        {chartTab === "budget" ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.budgetVsActual.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 11 }} />
                <YAxis stroke={axisStroke} />
                <Tooltip isAnimationActive={false} />
                <Legend />
                <Bar dataKey="budgeted" fill="#38bdf8" name="Budgeted" isAnimationActive={false} />
                <Bar dataKey="spent" fill="#f472b6" name="Spent" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ShellCard>

      <ShellCard>
        <p className="text-sm font-medium">Net worth trend</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.netWorthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip isAnimationActive={false} />
              <Line type="monotone" dataKey="netWorth" stroke="#38bdf8" strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ShellCard>

      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-sky-400" aria-hidden />
            <div>
              <p className="text-sm font-medium">Export report</p>
              <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                Branded PDF via print dialog {premium ? "(included)" : ""}
              </p>
            </div>
          </div>
          {canUse("pdf_export") ? (
            <div className="flex flex-wrap gap-2">
              <PrimaryButton disabled={exporting} onClick={() => void exportPdf()}>
                <Download className="mr-1 inline h-4 w-4" />
                {exporting ? "Generating…" : "Export PDF"}
              </PrimaryButton>
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
    </PageFrame>
  );
}
