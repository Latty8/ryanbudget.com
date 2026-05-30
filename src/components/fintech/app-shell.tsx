"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Wallet,
} from "lucide-react";
import { AddTransactionFab } from "@/components/fintech/add-transaction-fab";
import { useFintechTheme } from "@/components/fintech/theme";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/more", label: "More", icon: MoreHorizontal },
] as const;

const marketingPaths = new Set(["/", "/pricing", "/changelog", "/help"]);

const AppSidebar = memo(function AppSidebar({
  pathname,
  isLight,
  userName,
}: {
  pathname: string;
  isLight: boolean;
  userName?: string;
}) {
  const initial = userName?.trim().charAt(0).toUpperCase() || "P";
  return (
    <aside
      className={cn(
        "rounded-2xl border p-4",
        isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-700 bg-neutral-800/95 text-slate-100"
      )}
    >
      <div className="mb-6">
        <p className="text-lg font-semibold tracking-tight">Paycheck Planner</p>
        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Calm money planning</p>
      </div>
      <nav className="grid gap-1">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href === "/more" && pathname.startsWith("/more"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? isLight
                    ? "bg-sky-50 font-medium text-sky-700"
                    : "bg-sky-500/15 font-medium text-sky-200"
                  : isLight
                    ? "text-slate-600 hover:bg-slate-50"
                    : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
        <Link
          href="/settings"
          className={cn(
            "inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
            pathname === "/settings"
              ? isLight
                ? "bg-sky-50 text-sky-700"
                : "bg-sky-500/15 text-sky-200"
              : isLight
                ? "text-slate-600 hover:bg-slate-50"
                : "text-slate-300 hover:bg-slate-800"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div
          className={cn(
            "mt-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
            isLight ? "bg-sky-100 text-sky-700" : "bg-sky-500/20 text-sky-200"
          )}
        >
          {initial}
        </div>
      </div>
    </aside>
  );
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const minimalChrome =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/resources") ||
    marketingPaths.has(pathname);
  const { theme } = useFintechTheme();
  const isLight = theme === "light";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const shellClass = cn("min-h-screen", isLight ? "bg-slate-50 text-slate-900" : "bg-neutral-950 text-white");

  const paletteItems = useMemo(
    () => [
      ...primaryNav,
      { href: "/recurring", label: "Recurring" },
      { href: "/goals", label: "Goals" },
      { href: "/reports", label: "Reports" },
      { href: "/settings", label: "Settings" },
    ],
    []
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
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
      <div className="mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-6 p-4 md:p-8 lg:grid-cols-[220px_1fr]">
        <AppSidebar pathname={pathname} isLight={isLight} userName={user?.name} />
        <main className="min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t md:hidden",
          isLight ? "border-slate-200 bg-white/95" : "border-slate-800 bg-neutral-950/95"
        )}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center rounded-lg py-2 text-[10px]",
                  active ? "text-sky-600" : isLight ? "text-slate-500" : "text-slate-400"
                )}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AddTransactionFab />

      <AnimatePresence>
        {paletteOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-20"
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={cn(
                "w-full max-w-md rounded-2xl border p-3 shadow-xl",
                isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-neutral-900"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <Search className="h-4 w-4" />
                Quick go
              </div>
              <div className="grid gap-0.5">
                {paletteItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("rounded-lg px-3 py-2 text-sm", isLight ? "hover:bg-slate-50" : "hover:bg-neutral-800")}
                    onClick={() => setPaletteOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className={cn("rounded-lg px-3 py-2 text-left text-sm", isLight ? "hover:bg-slate-50" : "hover:bg-neutral-800")}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("planner:new-transaction"));
                    setPaletteOpen(false);
                  }}
                >
                  New transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
