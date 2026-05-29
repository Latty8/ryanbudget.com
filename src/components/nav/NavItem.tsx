"use client";

import Link from "next/link";
import type { NavLink } from "@/components/nav/nav-config";
import { isNavActive } from "@/components/nav/nav-config";

type NavItemProps = {
  link: NavLink;
  pathname: string;
  variant: "sidebar";
  onNavigate?: () => void;
};

export function NavItem({
  link,
  pathname,
  variant,
  onNavigate,
}: NavItemProps) {
  const active = isNavActive(pathname, link.href);
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`nav-item nav-item--${variant} ${active ? "nav-item--active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="nav-item__icon shrink-0" />
      <span className="nav-item__label">{link.label}</span>
    </Link>
  );
}
