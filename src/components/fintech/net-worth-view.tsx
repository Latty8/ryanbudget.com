"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NumberField } from "@/components/fintech/number-field";
import { ReportsChartFrame } from "@/components/fintech/reports-chart-frame";
import {
  reportChartAxis,
  reportChartGrid,
  reportTooltipStyle,
  formatReportTooltipValue,
} from "@/components/fintech/reports-chart-config";
import {
  EmptyState,
  FieldLabel,
  GhostButton,
  ModalOverlay,
  PageFrame,
  PrimaryButton,
  ShellCard,
  ShellInput,
  ShellSelect,
  SectionTitle,
  fintechForeground,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { buildNetWorthItems, sumNetWorth } from "@/lib/net-worth/compute-net-worth";
import { logActivity } from "@/store/useActivityLogStore";
import { useNetWorthStore } from "@/store/useNetWorthStore";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";
import type { NetWorthItemKind } from "@/types/net-worth";
import { cn } from "@/lib/utils";

const emptyManual = () => ({
  name: "",
  kind: "asset" as NetWorthItemKind,
  balance: 0,
  includeInChart: true,
});

export function NetWorthView() {
  const confirm = useConfirm();
  const accounts = useAppDataStore((s) => s.accounts);
  const currency = useAppDataStore((s) => s.preferences.currency);
  const manualItems = useNetWorthStore((s) => s.manualItems);
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const addItem = useNetWorthStore((s) => s.addItem);
  const deleteItem = useNetWorthStore((s) => s.deleteItem);
  const recordSnapshot = useNetWorthStore((s) => s.recordSnapshot);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyManual);

  const items = useMemo(() => buildNetWorthItems(accounts, manualItems), [accounts, manualItems]);
  const totals = useMemo(() => sumNetWorth(items), [items]);

  useEffect(() => {
    recordSnapshot({ assets: totals.assets, liabilities: totals.liabilities });
  }, [totals.assets, totals.liabilities, recordSnapshot]);

  const chartData = useMemo(() => {
    if (snapshots.length >= 2) {
      return snapshots.map((s) => ({
        label: format(parseISO(s.date), "MMM d"),
        netWorth: s.netWorth,
      }));
    }
    return [{ label: "Today", netWorth: totals.netWorth }];
  }, [snapshots, totals.netWorth]);

  const assets = items.filter((i) => i.kind === "asset");
  const liabilities = items.filter((i) => i.kind === "liability");

  const saveManual = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    addItem(form);
    logActivity("created", "net-worth", form.name, `${form.kind} · manual entry`);
    toast.success("Item added");
    setModalOpen(false);
    setForm(emptyManual());
  };

  return (
    <PageFrame title="Net Worth" description="Assets minus liabilities — synced from accounts plus anything you track manually.">
      <div className="grid gap-4 sm:grid-cols-3">
        <ShellCard className="p-4 sm:p-5">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", fintechMuted)}>Net worth</p>
          <p className={cn("mt-2 text-2xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(totals.netWorth, currency)}
          </p>
        </ShellCard>
        <ShellCard className="p-4 sm:p-5">
          <p className={cn("text-xs font-semibold uppercase tracking-wide text-[var(--positive)]")}>Assets</p>
          <p className={cn("mt-2 text-xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(totals.assets, currency)}
          </p>
        </ShellCard>
        <ShellCard className="p-4 sm:p-5">
          <p className={cn("text-xs font-semibold uppercase tracking-wide text-rose-400")}>Liabilities</p>
          <p className={cn("mt-2 text-xl font-semibold tabular-nums", fintechForeground)}>
            {formatMoney(totals.liabilities, currency)}
          </p>
        </ShellCard>
      </div>

      <div className="mt-6">
        <SectionTitle title="Net worth over time" />
        <ReportsChartFrame className="mt-3" heightClass="h-56 md:h-64">
        <div className="h-full w-full min-h-[14rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={reportChartGrid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: reportChartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: reportChartAxis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatMoney(Number(v), currency)}
                width={72}
              />
              <Tooltip
                {...reportTooltipStyle}
                formatter={(value) => formatReportTooltipValue(value, "netWorth", currency)}
              />
              <Line type="monotone" dataKey="netWorth" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </ReportsChartFrame>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm", fintechMuted)}>Breakdown</p>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <Plus className="mr-1 inline h-4 w-4" />
          Add manual item
        </PrimaryButton>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", fintechMuted)}>Assets</h3>
          {assets.length === 0 ? (
            <p className={cn("text-sm", fintechMuted)}>No assets yet</p>
          ) : (
            <ul className={cn(fintechSurface, "divide-y overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)]")}>
              {assets.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <p className={cn("font-medium", fintechForeground)}>{item.name}</p>
                    <p className={cn("text-xs", fintechMuted)}>{item.source === "account" ? "From accounts" : "Manual"}</p>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums font-medium">{formatMoney(item.balance, currency)}</span>
                    {item.source === "manual" ? (
                      <GhostButton
                        aria-label={`Delete ${item.name}`}
                        onClick={() => {
                          void confirm({
                            title: `Remove "${item.name}"?`,
                            description: "This manual entry will be removed from your net worth breakdown.",
                            confirmLabel: "Remove",
                            onConfirm: () => {
                              deleteItem(item.id);
                              logActivity("deleted", "net-worth", item.name);
                            },
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </GhostButton>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", fintechMuted)}>Liabilities</h3>
          {liabilities.length === 0 ? (
            <p className={cn("text-sm", fintechMuted)}>No liabilities</p>
          ) : (
            <ul className={cn(fintechSurface, "divide-y overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)]")}>
              {liabilities.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <p className={cn("font-medium", fintechForeground)}>{item.name}</p>
                    <p className={cn("text-xs", fintechMuted)}>{item.source === "account" ? "From accounts" : "Manual"}</p>
                  </span>
                  <span className="tabular-nums font-medium">{formatMoney(item.balance, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {items.length === 0 ? (
        <ShellCard className="mt-6 p-0">
          <EmptyState
            icon={Scale}
            title="Start tracking net worth"
            description="Add accounts or manual items like investments, property, or loans."
            action={<PrimaryButton onClick={() => setModalOpen(true)}>Add manual item</PrimaryButton>}
          />
        </ShellCard>
      ) : null}

      <ModalOverlay open={modalOpen} onClose={() => setModalOpen(false)} title="Manual asset or liability">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <FieldLabel>Name</FieldLabel>
            <ShellInput value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Type</FieldLabel>
            <ShellSelect
              value={form.kind}
              onChange={(e) => setForm((s) => ({ ...s, kind: e.target.value as NetWorthItemKind }))}
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
            </ShellSelect>
          </label>
          <label className="grid gap-1">
            <FieldLabel>Balance</FieldLabel>
            <NumberField value={form.balance} onChange={(balance) => setForm((s) => ({ ...s, balance }))} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <GhostButton onClick={() => setModalOpen(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={saveManual}>Save</PrimaryButton>
        </div>
      </ModalOverlay>
    </PageFrame>
  );
}
