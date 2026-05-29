"use client";

import { BarChart3, Calculator, CalendarDays, CreditCard, LayoutDashboard, List, PiggyBank, Receipt, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { formatCurrency, fromCents } from "@/lib/planner/format";
import type { Bill, Debt, Goal, Paycheck, Transaction } from "@/lib/planner/types";
import { usePlannerStore } from "@/store/usePlannerStore";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="planner-card border-dashed p-8 text-center text-sm text-[var(--muted)]">
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

export function DashboardCard({
  title,
  value,
  hint,
  className,
}: {
  title: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={clsx("planner-card stat-tile p-4 sm:p-5", className)}
    >
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold sm:text-[1.7rem]">{value}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
    </motion.article>
  );
}

export function MoneyCard(props: { title: string; cents: number; hint?: string; className?: string }) {
  return <DashboardCard title={props.title} value={formatCurrency(props.cents)} hint={props.hint} className={props.className} />;
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const color =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : tone === "danger"
          ? "bg-red-500"
          : "bg-sky-500";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function BillList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return <EmptyState title="No upcoming bills" body="Add bills to see what is due before your next paycheck." />;
  }
  return (
    <div className="space-y-2">
      {bills.map((bill) => (
        <div key={bill.id} className="planner-card p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">{bill.name}</p>
            <p className="font-semibold">{formatCurrency(bill.amount)}</p>
          </div>
          <p className="text-xs text-[var(--muted)]">Due {format(bill.dueDate, "MMM d")} · {bill.frequency}</p>
        </div>
      ))}
    </div>
  );
}

export function GoalCard({ goal, progress }: { goal: Goal; progress: number }) {
  return (
    <div className="planner-card p-4">
      <p className="font-medium">{goal.name}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
      <div className="mt-3"><ProgressBar value={progress} tone="success" /></div>
    </div>
  );
}

export function DebtCard({ debt, months, interest }: { debt: Debt; months: number; interest: number }) {
  return (
    <div className="planner-card p-4">
      <p className="font-medium">{debt.name}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">Balance {formatCurrency(debt.balance)} · APR {debt.apr.toFixed(2)}%</p>
      <p className="mt-1 text-sm text-[var(--muted)]">Estimated payoff {months} months · Est. interest {formatCurrency(interest)}</p>
    </div>
  );
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const showActions = Boolean(onEdit || onDelete);
  if (transactions.length === 0) {
    return <EmptyState title="No transactions yet." body="Add your first transaction to start tracking your spending." />;
  }
  return (
    <div className="planner-card data-shell overflow-x-auto">
      <table className="data-table w-full min-w-[700px] text-sm">
        <thead className="bg-[var(--surface-elevated)]">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Amount</th>
            {showActions ? <th className="px-3 py-2 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-hover)]">
              <td className="px-3 py-2">{format(t.date, "MMM d")}</td>
              <td className="px-3 py-2">{t.description}</td>
              <td className="px-3 py-2 capitalize">
                <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-xs", t.type === "expense" ? "bg-rose-500/15 text-rose-500" : t.type === "income" ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-500")}>
                  {t.type}
                </span>
              </td>
              <td className={clsx("px-3 py-2 font-medium", t.type === "expense" ? "text-negative" : "text-positive")}>{formatCurrency(t.amount)}</td>
              {showActions ? (
                <td className="px-3 py-2 text-right">
                  {onEdit ? (
                    <button className="mr-2 rounded-md border border-[var(--border-strong)] px-2 py-1 text-xs hover:bg-[var(--surface-hover)]" onClick={() => onEdit(t.id)}>
                      Edit
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button className="rounded-md border border-red-400/50 px-2 py-1 text-xs text-red-600 hover:bg-red-500/10" onClick={() => onDelete(t.id)}>
                      Delete
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PaycheckSelector({
  paychecks,
  activeId,
  onSelect,
}: {
  paychecks: Paycheck[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <select className="planner-input min-w-[13rem]" value={activeId} onChange={(e) => onSelect(e.target.value)}>
      {paychecks.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({format(p.periodStart, "MMM d")} - {format(p.periodEnd, "MMM d")})
        </option>
      ))}
    </select>
  );
}

export function SafeToSpendCard({ safeToSpend }: { safeToSpend: number }) {
  const low = safeToSpend < 15000;
  return (
    <div className={clsx("planner-card stat-tile stat-tile--featured p-5 sm:p-6", low ? "border-amber-400/50 bg-amber-100/70 dark:bg-amber-950/35" : "border-sky-400/40 bg-sky-100/70 dark:bg-sky-950/35")}>
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">Safe to Spend</p>
      <p className="mt-2 text-3xl font-semibold sm:text-4xl">{formatCurrency(safeToSpend)}</p>
      <p className="mt-2 text-sm">
        {low
          ? "Be careful — you have bills coming up before your next paycheck."
          : `You have ${formatCurrency(safeToSpend)} safe to spend until your next paycheck.`}
      </p>
    </div>
  );
}

export function CanIAffordCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="planner-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="font-medium">Can I afford this?</h3>
      </div>
      {children}
    </div>
  );
}

export function PlannerNav() {
  const pathname = usePathname();
  const darkMode = usePlannerStore((s) => s.darkMode);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);
  const links = [
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/paychecks", "Paychecks", CalendarDays],
    ["/budget", "Budget", PiggyBank],
    ["/transactions", "Transactions", Receipt],
    ["/categories", "Categories", Tags],
    ["/bills", "Bills", List],
    ["/goals", "Goals", PiggyBank],
    ["/debts", "Debts", CreditCard],
    ["/reports", "Reports", BarChart3],
    ["/settings", "Settings", Settings],
  ] as const;
  const grouped = [
    { title: "Plan", items: links.slice(0, 5) },
    { title: "Track", items: links.slice(5, 9) },
    { title: "System", items: links.slice(9) },
  ];
  return (
    <>
      <div className="app-mobile-header lg:hidden">
        <button className="btn-ghost" onClick={() => setMobileOpen(true)}>
          Menu
        </button>
        <p className="app-mobile-header__title">Paycheck Planner</p>
      </div>
      <AnimatePresence>
        {mobileOpen ? <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="app-sidebar-backdrop lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
      </AnimatePresence>
      <aside className={clsx("app-sidebar lg:block lg:w-[var(--sidebar-width)]", mobileOpen && "app-sidebar--open")}>
        <div className="app-sidebar__inner">
          <div className="app-sidebar__top">
            <p className="app-sidebar__brand">Paycheck Planner</p>
            <button className="btn-ghost lg:hidden" onClick={() => setMobileOpen(false)}>Close</button>
          </div>
          <p className="px-3 text-xs text-[var(--muted)]">Plan each paycheck with confidence.</p>
          <nav className="app-sidebar__nav mt-4">
            {grouped.map((group) => (
              <div key={group.title}>
                <p className="app-sidebar__group type-caption">{group.title}</p>
                <div className="grid gap-1">
                  {group.items.map(([href, label, Icon]) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={clsx("nav-item nav-item--sidebar", active && "nav-item--active")}
                      >
                        <Icon className="nav-item__icon" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="app-sidebar__footer">
            <p className="px-2 text-xs text-[var(--muted)]">Demo data only. Your changes stay in this browser.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SpendingSummary({
  budgeted,
  spent,
  remaining,
}: {
  budgeted: number;
  spent: number;
  remaining: number;
}) {
  return (
    <div className="planner-card grid gap-3 p-4 sm:grid-cols-3">
      <DashboardCard title="Budgeted" value={formatCurrency(budgeted)} />
      <DashboardCard title="Spent" value={formatCurrency(spent)} />
      <DashboardCard title="Remaining" value={formatCurrency(remaining)} />
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value === 0 ? "" : fromCents(value)}
        placeholder={placeholder}
        onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
        className="planner-input"
      />
    </label>
  );
}

export function FormField({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={clsx("grid gap-1.5 text-sm", className)}>
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}
