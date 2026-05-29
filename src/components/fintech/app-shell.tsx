"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Goal,
  LayoutDashboard,
  LayoutTemplate,
  RefreshCw,
  ReceiptText,
  Search,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useFintechTheme } from "@/components/fintech/theme";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { NotificationCenter } from "@/components/fintech/notification-center";
import { useTotalBalance } from "@/hooks/use-total-balance";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/household", label: "Household", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const marketingPaths = new Set(["/", "/pricing", "/changelog", "/templates", "/help"]);

const AppSidebar = memo(function AppSidebar({
  pathname,
  isLight,
}: {
  pathname: string;
  isLight: boolean;
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl border p-4",
        isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className={cn("rounded-lg p-2", isLight ? "bg-sky-100" : "bg-sky-500/20")}>
          <CalendarClock className={cn("h-4 w-4", isLight ? "text-sky-600" : "text-sky-300")} />
        </div>
        <div>
          <p className="text-sm font-semibold">Paycheck Planner</p>
          <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Calm money planning</p>
        </div>
      </div>
      <nav className="grid gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href === "/dashboard"}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? isLight
                    ? "bg-sky-100 text-sky-700"
                    : "bg-sky-500/15 text-sky-200"
                  : isLight
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimalChrome =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/resources") ||
    marketingPaths.has(pathname);
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const totalBalance = useTotalBalance();

  const filteredNavItems = useMemo(() => navItems.filter((item) => item.href !== "/settings"), []);
  const shellClass = cn("min-h-screen", isLight ? "bg-slate-100 text-slate-900" : "bg-neutral-900 text-white");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("planner:new-transaction"));
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (minimalChrome) {
    return <div className={shellClass}>{children}</div>;
  }

  return (
    <div className={shellClass}>
      <DemoModeBanner />
      <div className="mx-auto grid min-h-screen max-w-[1280px] grid-cols-1 gap-4 p-3 md:p-6 lg:grid-cols-[240px_1fr]">
        <AppSidebar pathname={pathname} isLight={isLight} />
        <main className="min-w-0 space-y-4">
          <header
            className={cn(
              "rounded-2xl border px-4 py-3 md:px-5",
              isLight ? "border-slate-300 bg-white" : "border-slate-700 bg-neutral-800/95"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    isLight ? "border-slate-300 bg-white text-slate-700" : "border-slate-600 bg-neutral-900 text-slate-200"
                  )}
                  onClick={() => setPaletteOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  Search
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-xs",
                      isLight ? "border-slate-300 text-slate-500" : "border-slate-700 text-slate-400"
                    )}
                  >
                    Ctrl+K
                  </span>
                </button>
                <input
                  type="month"
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm outline-none",
                    isLight ? "border-slate-300 bg-white text-slate-700" : "border-slate-600 bg-neutral-900 text-slate-200"
                  )}
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <NotificationCenter />
                <div className="hidden text-right sm:block">
                  <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Quick balance</p>
                  <p className="text-sm font-semibold">${totalBalance.toLocaleString()}</p>
                </div>
                <div
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    isLight ? "border-slate-300 bg-sky-50 text-sky-700" : "border-slate-600 bg-sky-500/20 text-sky-200"
                  )}
                >
                  RU
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t p-2 backdrop-blur md:hidden",
          isLight ? "border-slate-300 bg-white/95" : "border-slate-700 bg-neutral-900/95"
        )}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {filteredNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center rounded-lg p-2 text-[11px]",
                  active ? (isLight ? "text-sky-700" : "text-sky-300") : isLight ? "text-slate-500" : "text-slate-400"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {paletteOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20 backdrop-blur-sm"
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "w-full max-w-lg rounded-2xl border p-3",
                isLight ? "border-slate-300 bg-white" : "border-slate-700 bg-neutral-900"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <p className={cn("mb-2 text-xs uppercase tracking-wide", isLight ? "text-slate-500" : "text-slate-400")}>
                Quick navigation
              </p>
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("rounded-xl px-3 py-2 text-sm", isLight ? "hover:bg-slate-100" : "hover:bg-neutral-800")}
                    onClick={() => setPaletteOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className={cn(
                    "rounded-xl px-3 py-2 text-left text-sm",
                    isLight ? "hover:bg-slate-100" : "hover:bg-neutral-800"
                  )}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("planner:new-transaction"));
                    setPaletteOpen(false);
                  }}
                >
                  New transaction (Ctrl+N)
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
