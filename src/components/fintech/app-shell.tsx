"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AddTransactionFab } from "@/components/fintech/add-transaction-fab";
import { DemoModeBanner } from "@/components/fintech/demo-mode-banner";
import { FinanceSidebar } from "@/components/fintech/finance-sidebar";
import { GlobalSearchPalette, GlobalSearchTrigger } from "@/components/fintech/global-search";
import { PaycheckAllocationHost } from "@/components/fintech/paycheck-allocation-wizard";
import { NotificationCenter } from "@/components/fintech/notification-center";
import { RefreshDataButton } from "@/components/fintech/refresh-data-button";
import { ThemeToggle } from "@/components/fintech/theme-toggle";
import { APP_HOME, isNavItemActive, MARKETING_PATHS, MOBILE_NAV } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const minimalChrome =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/resources") ||
    MARKETING_PATHS.has(pathname);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const shellClass = "min-h-screen bg-[var(--background)] text-[var(--foreground)]";

  if (minimalChrome) {
    return <div className={shellClass}>{children}</div>;
  }

  return (
    <div className={shellClass}>
      <DemoModeBanner />

      <div className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] lg:block">
        <FinanceSidebar className="h-full shadow-[var(--shadow-nav)]" />
      </div>

      {mobileDrawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-[var(--overlay)]/80 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileDrawerOpen(false)}
        />
      ) : null}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] transition-transform duration-300 ease-out lg:hidden",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <FinanceSidebar
          className="h-full shadow-[var(--shadow-modal)]"
          forceExpanded
          onNavigate={() => setMobileDrawerOpen(false)}
        />
      </div>

      <div className="flex min-h-screen flex-col lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] shadow-[var(--shadow-nav)] backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-2 px-4 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl hover:bg-[var(--surface-hover)] lg:hidden"
                aria-label="Open menu"
                onClick={() => setMobileDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href={APP_HOME} className="truncate text-sm font-semibold lg:text-base lg:hidden">
                Paycheck Planner
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <GlobalSearchTrigger />
              {process.env.NODE_ENV === "development" ? (
                <RefreshDataButton compact className="hidden md:inline-flex" />
              ) : null}
              <ThemeToggle className="lg:hidden" />
              <NotificationCenter />
            </div>
          </div>
        </header>

        <main className="page-enter mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-24 lg:px-8 lg:py-10 lg:pb-10">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--nav-bg)] pb-safe shadow-[var(--shadow-nav)] backdrop-blur-xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1 py-1">
            {MOBILE_NAV.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted)]"
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
        <GlobalSearchPalette />
        <PaycheckAllocationHost />
      </div>

      {mobileDrawerOpen ? (
        <button
          type="button"
          className="fixed right-3 top-3 z-[60] inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--modal-solid)] shadow-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
