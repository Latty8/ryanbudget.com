"use client";

import Link from "next/link";
import { BookOpen, CalendarClock, RefreshCw, Users, LayoutTemplate } from "lucide-react";
import { PageFrame, ShellCard } from "@/components/fintech/ui";
import { useShellTheme } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

const guides = [
  {
    icon: CalendarClock,
    title: "How bi-weekly pay works",
    body: "Budget monthly categories (rent, utilities) separately from weekly ones (groceries). Each paycheck covers half of monthly bills plus one week of variable spending — so you never wonder if rent is “due” before payday.",
    steps: [
      "Set payroll as a bi-weekly recurring income with your next pay date.",
      "Mark rent and subscriptions as monthly recurring expenses.",
      "Use the dashboard safe-to-spend number before your next deposit.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Setting up recurring items",
    body: "Recurring rules power bill reminders, paycheck projections, and your notification center.",
    steps: [
      "Go to Recurring and add income first (paycheck amount + bi-weekly cadence).",
      "Add bills with the correct cadence — monthly for rent, weekly for groceries.",
      "Set the next due date so alerts fire in the week before.",
      "Toggle items off anytime without deleting history.",
    ],
  },
  {
    icon: BookOpen,
    title: "Safe to spend",
    body: "Money left to spend = what you can use before the next paycheck without missing planned bills or savings.",
    steps: [
      "Assign realistic amounts in Budgets for each category.",
      "Log transactions (or use natural language entry on Premium).",
      "Check the dashboard card — it updates as you spend.",
    ],
  },
  {
    icon: LayoutTemplate,
    title: "Start from a template",
    body: "Skip the blank spreadsheet — duplicate a public template and tweak numbers.",
    steps: [
      "Browse the template gallery (no login required).",
      "Pick Bi-Weekly Paycheck, Debt Snowball, or Household Shared.",
      "Sign in and tap Duplicate to pre-fill categories and recurring rules.",
    ],
  },
  {
    icon: Users,
    title: "Household & sharing",
    body: "Invite a partner with Editor or Viewer roles, or share a read-only budget link.",
    steps: [
      "Household: invite by email from the Household page — link expires in 7 days.",
      "Public link: Budgets → Copy shareable link for view-only snapshot.",
      "Reports: share a monthly report link or export PDF from Reports.",
    ],
  },
];

export function HelpView({ embedded = false }: { embedded?: boolean }) {
  const { isLight } = useShellTheme();
  const content = (
    <>
      <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>
        Short guides for paycheck budgeting, recurring setup, and sharing — written for real life, not accountants.
      </p>
      <div className="grid gap-4">
        {guides.map((guide) => (
          <ShellCard key={guide.title}>
            <p className="inline-flex items-center gap-2 font-medium">
              <guide.icon className="h-4 w-4 text-sky-400" aria-hidden />
              {guide.title}
            </p>
            <p className={cn("mt-2 text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{guide.body}</p>
            {guide.steps ? (
              <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-slate-400">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
          </ShellCard>
        ))}
      </div>
      <ShellCard>
        <p className="text-sm font-medium">Quick links</p>
        <ul className={cn("mt-2 list-inside list-disc text-sm", isLight ? "text-slate-600" : "text-slate-300")}>
          <li>
            <Link href="/templates" className="text-sky-400 hover:underline">
              Browse budget templates
            </Link>
          </li>
          <li>
            <Link href="/recurring" className="text-sky-400 hover:underline">
              Manage recurring items
            </Link>
          </li>
          <li>
            <Link href="/settings" className="text-sky-400 hover:underline">
              Export your data (Settings)
            </Link>
          </li>
        </ul>
      </ShellCard>
    </>
  );

  if (embedded) return <div className="space-y-4">{content}</div>;

  return <PageFrame title="Help & guides">{content}</PageFrame>;
}
