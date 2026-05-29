"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavItem } from "@/components/nav/NavItem";
import { NAV_MORE, NAV_PRIMARY } from "@/components/nav/nav-config";
import { AppearanceMenu } from "@/components/theme/AppearanceMenu";

function MenuIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="app-mobile-header lg:hidden">
        <button
          type="button"
          className="btn-ghost px-2.5 py-2"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="app-sidebar"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <Link
          href="/"
          className="app-mobile-header__title"
          onClick={() => setOpen(false)}
        >
          Ryan Budget
        </Link>
      </header>

      {open && (
        <button
          type="button"
          className="app-sidebar-backdrop lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`app-sidebar ${open ? "app-sidebar--open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="app-sidebar__inner">
          <div className="app-sidebar__top">
            <Link
              href="/"
              className="app-sidebar__brand"
              onClick={() => setOpen(false)}
            >
              Ryan Budget
            </Link>
            <button
              type="button"
              className="btn-ghost px-2.5 py-2 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="app-sidebar__nav">
            <p className="type-caption app-sidebar__group">Track</p>
            {NAV_PRIMARY.slice(0, 3).map((link) => (
              <NavItem
                key={link.href}
                link={link}
                pathname={pathname}
                variant="sidebar"
                onNavigate={() => setOpen(false)}
              />
            ))}

            <p className="type-caption app-sidebar__group">Plan</p>
            <NavItem
              link={NAV_PRIMARY[3]}
              pathname={pathname}
              variant="sidebar"
              onNavigate={() => setOpen(false)}
            />
            {NAV_MORE.map((link) => (
              <NavItem
                key={link.href}
                link={link}
                pathname={pathname}
                variant="sidebar"
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>

          <div className="app-sidebar__footer">
            <AppearanceMenu />
          </div>
        </div>
      </aside>
    </>
  );
}
