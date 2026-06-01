"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { RefreshDataButton } from "@/components/fintech/refresh-data-button";
import { SidebarMoreNav } from "@/components/fintech/sidebar-more-nav";
import { ThemeToggle } from "@/components/fintech/theme-toggle";
import { APP_HOME, isNavItemActive, PRIMARY_NAV } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const COLLAPSED_KEY = "app-sidebar-collapsed";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm transition-all duration-200",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
        active
          ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

type Props = {
  className?: string;
  onNavigate?: () => void;
  forceExpanded?: boolean;
};

export function FinanceSidebar({ className, onNavigate, forceExpanded }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const showLabels = forceExpanded || !collapsed;

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    document.documentElement.style.setProperty("--sidebar-width", next ? "4.25rem" : "15.5rem");
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed && !forceExpanded ? "4.25rem" : "15.5rem"
    );
  }, [collapsed, forceExpanded]);

  return (
    <aside
      className={cn("flex h-full flex-col border-r border-[var(--border)] bg-[var(--nav-bg)]", className)}
      aria-label="Main navigation"
    >
      <div className={cn("px-3 py-5", showLabels ? "" : "flex justify-center px-2")}>
        <Link
          href={APP_HOME}
          onClick={onNavigate}
          className={cn("flex items-center gap-2.5", showLabels ? "" : "justify-center")}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-sm">
            <Wallet className="h-4 w-4" />
          </span>
          {showLabels ? (
            <span className="truncate text-sm font-semibold tracking-tight">Paycheck Planner</span>
          ) : null}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isNavItemActive(item.href, pathname)}
            collapsed={!showLabels}
            onNavigate={onNavigate}
          />
        ))}
        <SidebarMoreNav collapsed={!showLabels} onNavigate={onNavigate} />
      </nav>

      <div className="mt-auto space-y-2 border-t border-[var(--border-subtle)] p-2">
        <div className={cn("flex items-center", showLabels ? "justify-end px-1" : "justify-center")}>
          <ThemeToggle />
        </div>
        {process.env.NODE_ENV === "development" && showLabels ? (
          <RefreshDataButton className="w-full text-xs" />
        ) : null}
        {!forceExpanded ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)]",
              !showLabels && "justify-center px-2"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {showLabels ? <span>Collapse</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
