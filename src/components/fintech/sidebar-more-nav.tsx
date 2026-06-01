"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Ellipsis } from "lucide-react";
import { isMoreNavActive, isNavItemActive, MORE_NAV } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function MoreNavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm transition-all duration-200",
        active
          ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

type Props = {
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarMoreNav({ collapsed, onNavigate }: Props) {
  const pathname = usePathname();
  const moreActive = isMoreNavActive(pathname);
  const [open, setOpen] = useState(moreActive);

  useEffect(() => {
    if (moreActive) setOpen(true);
  }, [moreActive]);

  if (collapsed) {
    return (
      <Link
        href="/more"
        onClick={onNavigate}
        title="More"
        className={cn(
          "flex items-center justify-center rounded-lg px-2 py-2.5 text-sm transition-all duration-200",
          moreActive
            ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        )}
      >
        <Ellipsis className="h-[1.125rem] w-[1.125rem]" strokeWidth={moreActive ? 2.25 : 1.75} />
      </Link>
    );
  }

  return (
    <div className="pt-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
          moreActive
            ? "bg-[var(--surface)]/60 font-medium text-[var(--foreground)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        )}
      >
        <Ellipsis className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={moreActive ? 2.25 : 1.75} />
        <span className="flex-1 truncate text-left">More</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div className="mt-0.5 space-y-0.5">
          {MORE_NAV.map((item) => (
            <MoreNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavItemActive(item.href, pathname)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
