"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { DemoLaunchButton } from "@/components/marketing/demo-launch-button";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export function MarketingShell({
  children,
  showDemoCta = true,
}: {
  children: React.ReactNode;
  showDemoCta?: boolean;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          Paycheck Planner
        </Link>
        <nav className="flex items-center gap-2 text-sm md:gap-3">
          <Link href="/templates" className="hidden text-slate-400 hover:text-white sm:inline">
            Templates
          </Link>
          <Link href="/help" className="hidden text-slate-400 hover:text-white sm:inline">
            Help
          </Link>
          <Link href="/pricing" className="hidden text-slate-400 hover:text-white md:inline">
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-600 px-3 py-2 text-slate-300 hover:bg-neutral-900"
          >
            Sign in
          </Link>
          {showDemoCta ? <DemoLaunchButton className="hidden sm:inline-flex" /> : null}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
