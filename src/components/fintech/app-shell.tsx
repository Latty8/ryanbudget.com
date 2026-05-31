"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  Ellipsis,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { AddTransactionFab } from "@/components/fintech/add-transaction-fab";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { NotificationCenter } from "@/components/fintech/notification-center";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/transactions", label: "Transactions", icon: ReceiptText, mobile: true },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign, mobile: true },
  { href: "/accounts", label: "Wallets", icon: Wallet, mobile: true },
  { href: "/more", label: "More", icon: Ellipsis, mobile: true },
  { href: "/categories", label: "Categories", icon: Tags, mobile: false },
  { href: "/reports", label: "Reports", icon: BarChart3, mobile: false },
] as const;

const mobileNavItems = navItems.filter((item) => item.mobile);

const moreSectionPaths = [
  "/more",
  "/categories",
  "/recurring",
  "/goals",
  "/reports",
  "/household",
  "/settings",
] as const;

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
          ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-sm"
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

  const isActive = (href: string) => {
    if (href === "/more") {
      return moreSectionPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className={shellClass}>
      <DemoModeBanner />

      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] flex-col border-r border-[var(--border)] bg-[var(--nav-bg)] px-4 py-6 shadow-[var(--shadow-nav)] backdrop-blur-xl xl:flex"
        aria-label="Sidebar"
      >
        <Link href="/dashboard" className="group mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-sm transition group-hover:scale-[1.02]">
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
          <NavLink href="/recurring" label="Recurring" icon={RefreshCw} active={isActive("/recurring")} compact />
          <NavLink href="/goals" label="Goals" icon={PiggyBank} active={isActive("/goals")} compact />
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
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
            <Link href="/dashboard" className="group flex min-w-0 flex-1 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-sm">
                <CalendarClock className="h-4 w-4" />
              </span>
              <span className="truncate text-sm font-semibold sm:inline">Paycheck Planner</span>
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              <NotificationCenter />
              <Link
                href="/settings"
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2.5 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
                  pathname.startsWith("/settings") && "bg-[var(--surface)] text-[var(--foreground)]"
                )}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        <main
          key={pathname}
          className="page-enter mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-28 md:px-8 md:py-10 xl:pb-10"
        >
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--nav-bg)] pb-safe shadow-[var(--shadow-nav)] backdrop-blur-xl xl:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors duration-200",
                    active
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)] active:bg-[var(--surface-hover)]"
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
