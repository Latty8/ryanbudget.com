"use client";

import Link from "next/link";
import { format } from "date-fns";
import { PageFrame } from "@/components/fintech/ui";
import { formatMoney, useAppDataStore } from "@/store/useAppDataStore";

export function RecurringMinimalView() {
  const recurring = useAppDataStore((s) => s.demoRecurring);
  const currency = useAppDataStore((s) => s.preferences.currency);

  if (recurring.length === 0) {
    return (
      <PageFrame title="Recurring" description="Paycheck, rent, and bills that repeat.">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">No recurring items yet.</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
            Add your paycheck in setup
          </Link>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Recurring" description="Paycheck, rent, and bills that repeat.">
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {recurring.map((rule) => (
          <li key={rule.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-slate-900">{rule.name}</p>
              <p className="text-xs text-slate-500">
                {rule.cadence} · next {format(new Date(rule.nextDate), "MMM d")}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {rule.name.toLowerCase().includes("payroll") ? "+" : "−"}
              {formatMoney(Math.abs(rule.amount), currency)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-xs text-slate-400">
        Edit amounts in{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>{" "}
        or re-run setup.
      </p>
    </PageFrame>
  );
}
