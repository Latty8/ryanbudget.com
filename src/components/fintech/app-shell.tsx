"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { AddTransactionFab } from "@/components/fintech/add-transaction-fab";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/transactions", label: "Transactions", icon: ReceiptText, mobile: true },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign, mobile: true },
  { href: "/accounts", label: "Wallets", icon: Wallet, mobile: true },
  { href: "/categories", label: "Categories", icon: Tags, mobile: true },
  { href: "/reports", label: "Reports", icon: BarChart3, mobile: false },
] as const;

const mobileNavItems = navItems.filter((item) => item.mobile);

const marketingPaths = new Set(["/", "/pricing", "/changelog", "/help"]);

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl transition-all duration-200",
        compact ? "px-3 py-2.5 text-sm" : "px-3.5 py-2 text-sm",
        active
          ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-[var(--shadow-card)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      <span>{label}</span>
    </Link>
  );
}

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={shellClass}>
      <DemoModeBanner />

      {/* Desktop sidebar — xl+ */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col border-r border-[var(--border)] bg-[var(--nav-bg)] px-4 py-6 shadow-[var(--shadow-nav)] backdrop-blur-xl xl:flex"
        aria-label="Sidebar"
      >
        <Link href="/dashboard" className="group mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-[var(--shadow-glow)] transition group-hover:scale-105">
            <CalendarClock className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Paycheck Planner</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              compact
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            active={pathname.startsWith("/settings")}
            compact
          />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col xl:pl-[var(--sidebar-width)]">
        {/* Top bar — tablet + mobile (hidden on xl where sidebar handles nav) */}
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
            <Link href="/dashboard" className="group flex shrink-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-[var(--shadow-glow)]">
                <CalendarClock className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-semibold sm:inline">Paycheck Planner</span>
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex lg:gap-1" aria-label="Main">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all lg:px-3 lg:py-2 lg:text-sm",
                    isActive(item.href)
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-card)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className={cn(
                  "rounded-xl p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
                  pathname.startsWith("/settings") && "bg-[var(--surface)] text-[var(--foreground)]"
                )}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        <main key={pathname} className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-24 md:px-8 md:py-10 xl:pb-10">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl md:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1.5">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[9px] font-medium transition-colors",
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
    </div>
  );
}
