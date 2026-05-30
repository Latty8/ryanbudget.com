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

  const shellClass = "min-h-screen bg-[var(--background)] text-[var(--foreground)]";

  if (minimalChrome) {
    return <div className={shellClass}>{children}</div>;
  }

  return (
    <div className={shellClass}>
      <DemoModeBanner />
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-6 px-4 md:px-8">
          <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-[var(--shadow-glow)] transition group-hover:scale-105">
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
                    "rounded-xl px-3.5 py-2 text-sm transition-all duration-200",
                    active
                      ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-[var(--shadow-card)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
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
              "rounded-xl p-2 text-[var(--muted)] transition-all duration-200 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
              pathname.startsWith("/settings") && "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-card)]"
            )}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main key={pathname} className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-12">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl md:hidden"
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
                  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--muted)]"
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
