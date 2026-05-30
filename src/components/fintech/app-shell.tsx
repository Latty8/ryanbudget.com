"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, CalendarClock, CircleDollarSign, LayoutDashboard, ReceiptText, Settings } from "lucide-react";
import { AddTransactionFab } from "@/components/fintech/add-transaction-fab";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

const marketingPaths = new Set(["/", "/pricing", "/changelog", "/help"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimalChrome =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/resources") ||
    marketingPaths.has(pathname);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("planner:new-transaction"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (minimalChrome) {
    return <div className="min-h-screen bg-[#fafafa] text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <DemoModeBanner />
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fafafa]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4 md:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <CalendarClock className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">Paycheck Planner</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm transition",
                    active ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/settings"
            className={cn(
              "rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm",
              pathname.startsWith("/settings") && "bg-white text-slate-900 shadow-sm"
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/90 bg-white/95 backdrop-blur-md md:hidden"
        aria-label="Mobile"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
                  active ? "text-slate-900" : "text-slate-400"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AddTransactionFab />
    </div>
  );
}
