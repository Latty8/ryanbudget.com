"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  CircleDollarSign,
  History,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Scale,
  Tags,
  Trash2,
  Upload,
  Wallet,
  Wand2,
} from "lucide-react";
import {
  EmptyState,
  FilterChip,
  GhostButton,
  PageFrame,
  ShellCard,
  fintechDivide,
  fintechForeground,
  fintechMuted,
  fintechSurface,
} from "@/components/fintech/ui";
import { useActivityLogStore } from "@/store/useActivityLogStore";
import type { ActivityAction, ActivityEntity, ActivityLogEntry } from "@/types/activity-log";
import { cn } from "@/lib/utils";

const ENTITY_ICONS: Record<ActivityEntity, typeof ReceiptText> = {
  transaction: ReceiptText,
  account: Wallet,
  category: Tags,
  goal: PiggyBank,
  recurring: RefreshCw,
  rule: Wand2,
  "net-worth": Scale,
  import: Upload,
};

const ENTITY_FILTERS: { id: ActivityEntity | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "transaction", label: "Transactions" },
  { id: "account", label: "Accounts" },
  { id: "category", label: "Categories" },
  { id: "goal", label: "Funds" },
  { id: "recurring", label: "Recurring" },
  { id: "rule", label: "Rules" },
  { id: "import", label: "Imports" },
];

function actionLabel(entry: ActivityLogEntry) {
  if (entry.action === "created") return "Added";
  if (entry.action === "updated") return "Updated";
  return "Removed";
}

function groupLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function groupEntries(entries: ActivityLogEntry[]) {
  const map = new Map<string, ActivityLogEntry[]>();
  for (const entry of entries) {
    const key = groupLabel(entry.at);
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return [...map.entries()];
}

export function ActivityLogView() {
  const entries = useActivityLogStore((s) => s.entries);
  const clear = useActivityLogStore((s) => s.clear);
  const [entityFilter, setEntityFilter] = useState<ActivityEntity | "all">("all");
  const [actionFilter, setActionFilter] = useState<ActivityAction | "all">("all");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (entityFilter !== "all" && e.entity !== entityFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      return true;
    });
  }, [entries, entityFilter, actionFilter]);

  const grouped = useMemo(() => groupEntries(filtered), [filtered]);

  return (
    <PageFrame
      title="Activity"
      description="A running log of changes — useful when switching devices or sharing a household plan."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm", fintechMuted)}>
          {filtered.length ? `${filtered.length} events` : "No matching events"}
        </p>
        {entries.length > 0 ? (
          <GhostButton onClick={clear} className="gap-2 text-rose-400 hover:text-rose-300">
            <Trash2 className="h-4 w-4" />
            Clear log
          </GhostButton>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <>
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {ENTITY_FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                active={entityFilter === f.id}
                onClick={() => setEntityFilter(f.id)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "created", "updated", "deleted"] as const).map((a) => (
              <FilterChip key={a} active={actionFilter === a} onClick={() => setActionFilter(a)}>
                {a === "all" ? "Any action" : a.charAt(0).toUpperCase() + a.slice(1)}
              </FilterChip>
            ))}
          </div>
        </>
      ) : null}

      {filtered.length === 0 ? (
        <ShellCard className="mt-4 p-0">
          <EmptyState
            icon={History}
            title={entries.length === 0 ? "Nothing logged yet" : "No matches"}
            description={
              entries.length === 0
                ? "Add transactions, accounts, categories, or import a template — activity appears here automatically."
                : "Try a different filter."
            }
          />
        </ShellCard>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map(([label, items]) => (
            <section key={label}>
              <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wide", fintechMuted)}>
                {label}
              </p>
              <ul
                className={cn(
                  fintechSurface,
                  fintechDivide,
                  "divide-y overflow-hidden rounded-[var(--radius-card)]"
                )}
              >
                {items.map((entry) => {
                  const Icon = ENTITY_ICONS[entry.entity] ?? CircleDollarSign;
                  return (
                    <li key={entry.id} className="flex gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--muted)]">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium", fintechForeground)}>
                          {actionLabel(entry)} · {entry.title}
                        </p>
                        {entry.detail ? (
                          <p className={cn("mt-0.5 truncate text-sm", fintechMuted)}>{entry.detail}</p>
                        ) : null}
                        <p className={cn("mt-1 text-xs tabular-nums", fintechMuted)}>
                          {format(parseISO(entry.at), "h:mm a")}
                        </p>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
