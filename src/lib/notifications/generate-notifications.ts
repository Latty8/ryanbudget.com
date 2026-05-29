import { differenceInCalendarDays, format, parseISO, startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import type { AppCategory, AppGoal } from "@/types/app-settings";
import type { AppNotification, NotificationKind } from "@/types/notifications";

type RecurringRow = {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  nextDate: string;
};

type TransactionRow = {
  category: string;
  amount: number;
  date: string;
};

function make(
  kind: NotificationKind,
  title: string,
  body: string,
  opts?: { href?: string; priority?: AppNotification["priority"] }
): AppNotification {
  return {
    id: nanoid(),
    kind,
    title,
    body,
    href: opts?.href,
    createdAt: new Date().toISOString(),
    read: false,
    priority: opts?.priority ?? "normal",
  };
}

export function generateSmartNotifications(input: {
  recurring: RecurringRow[];
  categories: AppCategory[];
  goals: AppGoal[];
  transactions: TransactionRow[];
  now?: Date;
}): AppNotification[] {
  const now = input.now ?? new Date();
  const items: AppNotification[] = [];
  const monthStart = startOfMonth(now);

  for (const bill of input.recurring) {
    if (bill.amount >= 0) continue;
    const due = parseISO(bill.nextDate);
    const days = differenceInCalendarDays(due, now);
    if (days >= 0 && days <= 7) {
      items.push(
        make(
          "bill_due",
          days === 0 ? `${bill.name} due today` : `${bill.name} in ${days} day${days === 1 ? "" : "s"}`,
          `$${Math.abs(bill.amount).toFixed(2)} · ${bill.cadence}`,
          { href: "/recurring", priority: days <= 2 ? "high" : "normal" }
        )
      );
    }
  }

  const paycheck = input.recurring.find(
    (r) => r.amount > 0 && (r.cadence === "bi-weekly" || /pay/i.test(r.name))
  );
  if (paycheck) {
    const days = differenceInCalendarDays(parseISO(paycheck.nextDate), now);
    if (days >= 0 && days <= 3) {
      items.push(
        make(
          "paycheck_reminder",
          days === 0 ? "Paycheck day" : `Paycheck in ${days} day${days === 1 ? "" : "s"}`,
          `${paycheck.name}: $${paycheck.amount.toFixed(2)} expected`,
          { href: "/dashboard", priority: "high" }
        )
      );
    }
  }

  for (const cat of input.categories) {
    const spent = input.transactions
      .filter((t) => t.amount < 0 && t.category === cat.name && parseISO(t.date) >= monthStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    if (cat.budgeted <= 0) continue;
    const pct = (spent / cat.budgeted) * 100;
    if (pct >= 85 && pct < 100) {
      items.push(
        make(
          "budget_alert",
          `Close to ${cat.name} limit`,
          `You've used ${Math.round(pct)}% of your $${cat.budgeted.toFixed(0)} budget this month.`,
          { href: "/budgets", priority: "normal" }
        )
      );
    } else if (pct >= 100) {
      items.push(
        make(
          "budget_alert",
          `${cat.name} over budget`,
          `Spent $${spent.toFixed(0)} of $${cat.budgeted.toFixed(0)} — consider pausing discretionary spend.`,
          { href: "/budgets", priority: "high" }
        )
      );
    }
  }

  for (const goal of input.goals) {
    const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    if (pct >= 50 && pct < 75) {
      items.push(
        make(
          "goal_milestone",
          `${goal.name} halfway there`,
          `${Math.round(pct)}% funded — $${(goal.target - goal.current).toFixed(0)} to go.`,
          { href: "/goals" }
        )
      );
    } else if (pct >= 100) {
      items.push(
        make(
          "goal_milestone",
          `Goal reached: ${goal.name}`,
          "Congratulations — you hit your savings target!",
          { href: "/goals", priority: "high" }
        )
      );
    }
  }

  if (items.length === 0) {
    items.push(
      make(
        "system",
        "You're all caught up",
        `No urgent alerts for ${format(now, "MMM d")}. We'll notify you about bills and budgets here.`,
        { href: "/dashboard", priority: "low" }
      )
    );
  }

  return items.slice(0, 12);
}

/** Stable fingerprint to avoid duplicate notifications on refresh */
export function notificationFingerprint(n: Pick<AppNotification, "kind" | "title" | "body">) {
  return `${n.kind}:${n.title}:${n.body}`;
}
