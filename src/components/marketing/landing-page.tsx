"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Camera,
  Goal,
  LayoutTemplate,
  LineChart,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { PricingTable } from "@/components/billing/pricing-table";
import { DemoLaunchButton } from "@/components/marketing/demo-launch-button";
import { GoToAppLink } from "@/components/marketing/go-to-app-link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { TestimonialsCarousel } from "@/components/marketing/testimonials-carousel";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { isFeatureEnabled } from "@/lib/feature-flags";

const features = [
  {
    icon: CalendarClock,
    title: "Bi-weekly paycheck native",
    body: "Plan monthly bills and weekly groceries against real pay dates — not awkward calendar months.",
  },
  {
    icon: RefreshCw,
    title: "Recurring that matches life",
    body: "Rent, payroll, subscriptions — weekly, bi-weekly, or monthly with clear projections.",
  },
  {
    icon: Goal,
    title: "Custom savings goals",
    body: "Track emergency funds and dreams with progress rings and optional contributions from transactions.",
  },
  {
    icon: BarChart3,
    title: "Beautiful reports",
    body: "Cash flow, spending by category, budget vs actual, and branded PDF export.",
  },
  {
    icon: Camera,
    title: "Receipt attachments",
    body: "Snap or upload receipts per transaction. Premium adds higher limits and scan (coming soon).",
  },
  {
    icon: Sparkles,
    title: "Calm AI insights",
    body: "What-if scenarios and coach tips without the noise — privacy-first summaries.",
  },
  {
    icon: LayoutTemplate,
    title: "Template gallery",
    body: "Duplicate bi-weekly paycheck, debt snowball, and household budgets in one tap.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <CalendarClock className="h-4 w-4" />
          </span>
          Paycheck Planner
        </Link>
        <nav className="flex items-center gap-2 text-sm md:gap-4">
          <Link href="/pricing" className="hidden text-slate-400 hover:text-white sm:inline">
            Pricing
          </Link>
          <Link href="/templates" className="hidden text-slate-400 hover:text-white sm:inline">
            Templates
          </Link>
          <Link href="/help" className="hidden text-slate-400 hover:text-white sm:inline">
            Help
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-600 px-3 py-2 text-slate-300 hover:bg-neutral-900"
          >
            Sign in
          </Link>
          <GoToAppLink />
          <DemoLaunchButton size="default" className="hidden sm:inline-flex" />
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 text-center md:pt-12">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium uppercase tracking-widest text-emerald-400"
        >
          Built for bi-weekly paychecks
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl"
        >
          The budgeting app
          <br />
          <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            built for bi-weekly paychecks
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-400"
        >
          Plan monthly bills against real pay dates, tame recurring expenses, and see safe-to-spend before your next
          deposit — without spreadsheet fatigue.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <GoToAppLink variant="hero" />
          <DemoLaunchButton size="large" />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-medium text-slate-200 hover:bg-neutral-900"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 px-5 py-3 text-sm text-slate-300 hover:bg-neutral-900 sm:hidden"
          >
            Browse templates
          </Link>
        </motion.div>
        <p className="mt-4 text-xs text-slate-500">
          Demo opens instantly with Premium unlocked · No credit card · Sample bi-weekly data included
        </p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-800/60 to-neutral-950 p-1 shadow-2xl shadow-sky-950/40"
        >
          <div className="rounded-xl bg-neutral-900/90 p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700/80 pb-3 text-left text-xs text-slate-500">
              <span>Dashboard preview</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Bi-weekly pay</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Money left to spend", value: "$842", icon: Wallet },
                { label: "Next paycheck", value: "6 days", icon: CalendarClock },
                { label: "On track", value: "4 categories", icon: Shield },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-700/80 bg-neutral-950/80 p-4 text-left"
                >
                  <stat.icon className="mb-2 h-5 w-5 text-sky-400" />
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-24 rounded-xl border border-slate-700/60 bg-gradient-to-r from-sky-500/10 to-emerald-500/10 p-4 text-left">
              <p className="text-xs text-slate-500">Cash flow (monthly / bi-weekly toggle)</p>
              <div className="mt-2 flex h-12 items-end gap-1">
                {[40, 65, 45, 80, 55, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-sky-500/50"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="border-y border-slate-800 bg-neutral-900/40 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 text-center text-sm text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
            4.9 from early testers
          </span>
          <span>Bank-level encryption roadmap</span>
          <span>Works offline as PWA</span>
          <span>USD · CAD · EUR · GBP</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold md:text-3xl">Built for how you actually get paid</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">
          Recurring rules, custom goals, receipt uploads, and reports — all in one calm workspace.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-800 bg-neutral-900/50 p-6"
            >
              <f.icon className="h-6 w-6 text-sky-400" />
              <p className="mt-3 font-medium">{f.title}</p>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-neutral-900/50 to-neutral-950 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-semibold">Loved by paycheck budgeters</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500">
            Real people on bi-weekly pay, not spreadsheet warriors.
          </p>
          <div className="mt-10">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <LineChart className="mx-auto h-10 w-10 text-sky-400" />
        <h2 className="mt-4 text-2xl font-semibold">Ready in under a minute</h2>
        <p className="mx-auto mt-2 max-w-lg text-slate-400">
          Launch the full demo with Premium unlocked — wallets, goals, AI, and reports. No sign-up required.
        </p>
        <div className="mt-8">
          <DemoLaunchButton size="large" />
        </div>
      </section>

      {isFeatureEnabled("waitlist_signup") ? (
        <section className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-xl font-semibold">Get launch updates</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-400">Tips for bi-weekly budgeting and early feature access.</p>
          <div className="mt-6">
            <WaitlistForm />
          </div>
        </section>
      ) : null}

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold">Simple, honest pricing</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-400">
          Start free. Upgrade for household sharing, advanced reports, receipt scanning, and unlimited accounts.
        </p>
        <div className="mt-10">
          <PricingTable />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
