import { addWeeks, format } from "date-fns";
import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { DemoTransaction } from "@/lib/demo/sample-data";
import type { RecurringFrequency } from "@/types/finance";
import type { RecurringRuleInput } from "@/lib/recurring/project-runs";
import type { UserSubscription } from "@/types/billing";
import type { Household, HouseholdMember } from "@/types/household";

const baseDate = new Date("2026-05-01");

export function createAccount(overrides: Partial<AppAccount> = {}): AppAccount {
  return {
    id: "acc-checking",
    name: "Main Checking",
    kind: "checking",
    balance: 2500,
    color: "#38bdf8",
    icon: "Wallet",
    ...overrides,
  };
}

export function createCategory(overrides: Partial<AppCategory> = {}): AppCategory {
  return {
    id: "cat-groceries",
    name: "Groceries",
    group: "Needs",
    icon: "ShoppingCart",
    color: "#34d399",
    budgeted: 300,
    ...overrides,
  };
}

export function createTransaction(overrides: Partial<DemoTransaction> = {}): DemoTransaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-05-10",
    merchant: "Store",
    category: "Groceries",
    account: "Main Checking",
    amount: -45,
    recurring: false,
    ...overrides,
  };
}

export function createRecurringRule(overrides: Partial<RecurringRuleInput> = {}): RecurringRuleInput {
  return {
    id: "rec-payroll",
    name: "Payroll",
    amount: 1825,
    cadence: "bi-weekly",
    nextDate: format(baseDate, "yyyy-MM-dd"),
    active: true,
    ...overrides,
  };
}

/** Bi-weekly paycheck + monthly bills scenario. */
export function createBiWeeklyHouseholdScenario() {
  const payroll = createRecurringRule({
    id: "payroll",
    name: "Payroll",
    cadence: "bi-weekly",
    amount: 1825,
    nextDate: "2026-05-15",
  });
  const rent = createRecurringRule({
    id: "rent",
    name: "Rent",
    cadence: "monthly",
    amount: 1200,
    nextDate: "2026-05-01",
  });
  const groceries = createRecurringRule({
    id: "groceries",
    name: "Groceries",
    cadence: "weekly",
    amount: 85,
    nextDate: "2026-05-08",
  });

  return {
    accounts: [createAccount(), createAccount({ id: "acc-savings", name: "Savings", kind: "savings", balance: 5000 })],
    categories: [
      createCategory({ name: "Housing", budgeted: 1200 }),
      createCategory({ name: "Groceries", budgeted: 300 }),
      createCategory({ name: "Dining", budgeted: 120 }),
    ],
    recurring: [payroll, rent, groceries],
    transactions: [
      createTransaction({ amount: 1825, category: "Income", merchant: "Payroll", date: "2026-05-01" }),
      createTransaction({ amount: -1200, category: "Housing", merchant: "Rent", date: "2026-05-01" }),
      ...Array.from({ length: 8 }, (_, i) =>
        createTransaction({
          amount: -40 - i,
          category: "Groceries",
          date: format(addWeeks(baseDate, Math.floor(i / 2)), "yyyy-MM-dd"),
        })
      ),
    ],
  };
}

export function createFreeSubscription(): UserSubscription {
  return { tier: "free", status: "none" };
}

export function createPremiumSubscription(): UserSubscription {
  return { tier: "premium", status: "active", currentPeriodEnd: "2027-01-01" };
}

export function createHousehold(members: HouseholdMember[]): Household {
  return {
    id: "hh-1",
    name: "Our Budget",
    ownerEmail: members.find((m) => m.role === "owner")?.email ?? "owner@test.com",
    members,
    invites: [],
    activity: [],
  };
}

export function createMember(
  role: HouseholdMember["role"],
  overrides: Partial<HouseholdMember> = {}
): HouseholdMember {
  return {
    id: `member-${role}`,
    email: `${role}@test.com`,
    name: role.charAt(0).toUpperCase() + role.slice(1),
    role,
    joinedAt: "2026-01-01",
    ...overrides,
  };
}

export const CADENCES: RecurringFrequency[] = ["weekly", "bi-weekly", "monthly", "yearly"];
