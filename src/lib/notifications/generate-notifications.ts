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
  paused?: boolean;
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

function isPaycheckRule(rule: RecurringRow) {
  return rule.amount > 0 && /payroll|paycheck|salary|wage|deposit/i.test(rule.name);
}

function isBillRule(rule: RecurringRow) {
  if (rule.paused) return false;
  if (isPaycheckRule(rule)) return false;
  return true;
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

  for (const bill of input.recurring.filter(isBillRule)) {
    const due = parseISO(bill.nextDate);
    const days = differenceInCalendarDays(due, now);
    if (days < 0 || days > 7) continue;

    const amount = Math.abs(bill.amount);
    const dueSoon = days <= 2;

    items.push(
      make(
        "bill_due",
        days === 0
          ? `${bill.name} due today`
          : days === 1
            ? `${bill.name} due tomorrow`
            : days === 2
              ? `${bill.name} due in 2 days`
              : `${bill.name} in ${days} days`,
        `$${amount.toFixed(2)} · ${bill.cadence}${dueSoon ? " · plan cash before it hits" : ""}`,
        {
          href: "/recurring",
          priority: dueSoon ? "high" : "normal",
        }
      )
    );
  }

  const paychecks = input.recurring.filter(isPaycheckRule);
  for (const paycheck of paychecks) {
    const days = differenceInCalendarDays(parseISO(paycheck.nextDate), now);
    if (days < 0 || days > 5) continue;

    const biweekly = paycheck.cadence === "bi-weekly";
    const remind =
      days === 0 ||
      days === 1 ||
      days === 2 ||
      (biweekly && days === 5);

    if (!remind) continue;

    items.push(
      make(
        "paycheck_reminder",
        days === 0
          ? "Paycheck day"
          : days === 1
            ? "Paycheck tomorrow"
            : `Paycheck in ${days} days`,
        `${paycheck.name}: $${paycheck.amount.toFixed(2)} expected${biweekly ? " · bi-weekly" : ""}`,
        {
          href: "/dashboard",
          priority: days <= 2 ? "high" : "normal",
        }
      )
    );
  }

  for (const cat of input.categories) {
    if (cat.name === "Income") continue;
    const spent = input.transactions
      .filter((t) => t.amount < 0 && t.category === cat.name && parseISO(t.date) >= monthStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    if (cat.budgeted <= 0) continue;
    const pct = (spent / cat.budgeted) * 100;
    if (pct >= 80 && pct < 100) {
      items.push(
        make(
          "budget_alert",
          `Close to ${cat.name} limit`,
          `You've used ${Math.round(pct)}% of your $${cat.budgeted.toFixed(0)} monthly budget.`,
          { href: "/budgets", priority: pct >= 90 ? "high" : "normal" }
        )
      );
    } else if (pct >= 100) {
      items.push(
        make(
          "budget_alert",
          `${cat.name} over budget`,
          `Spent $${spent.toFixed(0)} of $${cat.budgeted.toFixed(0)} — review discretionary spending.`,
          { href: "/budgets", priority: "high" }
        )
      );
    }
  }

  for (const goal of input.goals) {
    const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    const remaining = Math.max(0, goal.target - goal.current);
    const daysLeft = differenceInCalendarDays(parseISO(goal.targetDate), now);

    if (pct >= 100) {
      items.push(
        make(
          "goal_milestone",
          `Fund complete: ${goal.name}`,
          "You reached this sinking fund target — nice work!",
          { href: "/goals", priority: "high" }
        )
      );
      continue;
    }

    if (pct >= 75 && pct < 100) {
      items.push(
        make(
          "goal_milestone",
          `${goal.name} almost funded`,
          `${Math.round(pct)}% complete · $${remaining.toFixed(0)} to go.`,
          { href: "/goals" }
        )
      );
      continue;
    }

    if (pct >= 50 && pct < 75) {
      items.push(
        make(
          "goal_milestone",
          `${goal.name} halfway there`,
          `${Math.round(pct)}% funded — keep your per-paycheck contributions steady.`,
          { href: "/goals" }
        )
      );
      continue;
    }

    if (daysLeft > 0 && daysLeft <= 45 && pct < 40) {
      items.push(
        make(
          "goal_milestone",
          `${goal.name} needs attention`,
          `Target in ${daysLeft} days but only ${Math.round(pct)}% funded — bump your next allocation.`,
          { href: "/goals", priority: daysLeft <= 14 ? "high" : "normal" }
        )
      );
    }
  }

  const spendCategories = input.categories.filter((c) => c.name !== "Income" && c.budgeted > 0);
  const totalBudgeted = spendCategories.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = input.transactions
    .filter((t) => t.amount < 0 && parseISO(t.date) >= monthStart)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  if (totalBudgeted > 0 && totalSpent < totalBudgeted * 0.85 && now.getDate() >= 10) {
    const headroom = totalBudgeted - totalSpent;
    items.push(
      make(
        "budget_win",
        "You're under budget this month!",
        `$${headroom.toFixed(0)} below your planned spending — room to save or treat yourself wisely.`,
        { href: "/dashboard", priority: "low" }
      )
    );
  }

  const priorityOrder = { high: 0, normal: 1, low: 2 };
  return items
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 14);
}

export function notificationFingerprint(n: Pick<AppNotification, "kind" | "title" | "body">) {
  return `${n.kind}:${n.title}:${n.body}`;
}
