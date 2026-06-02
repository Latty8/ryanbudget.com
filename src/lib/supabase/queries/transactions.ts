import { addMonths, addWeeks, format } from "date-fns";
import { nanoid } from "nanoid";
import { suggestCategoriesFromDescription } from "@/lib/ai/suggest-category";
import { demoBudgets, demoTransactions } from "@/lib/demo/sample-data";
import { hasSupabaseDataSync, supabase } from "@/lib/supabase/client";
import { signedAmountFromInput } from "@/lib/transactions/transaction-amount";
import {
  resolveAccountForInput,
  resolveCategoryForInput,
} from "@/lib/transactions/resolve-category";
import type { AppAccount, AppCategory } from "@/types/app-settings";
import type { RecurringFrequency, SplitLine, TransactionInput, TransactionRecord } from "@/types/finance";

type GetTransactionsOptions = {
  limit?: number;
  offset?: number;
};

export async function getTransactions(options: GetTransactionsOptions = {}): Promise<TransactionRecord[]> {
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;
  if (hasSupabaseDataSync && supabase) {
    await supabase.rpc("generate_recurring_transactions", {
      p_user_id: "demo-user",
      p_until_date: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    });

    const { data } = await supabase
      .from("transactions")
      .select("id,amount,transaction_date,merchant,categories(name),accounts(name)")
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    return (data ?? []).map((row) => ({
      id: row.id,
      amount: Number(row.amount ?? 0),
      date: row.transaction_date,
      description: row.merchant,
      category: (row.categories as { name?: string } | null)?.name ?? "Uncategorized",
      account: (row.accounts as { name?: string } | null)?.name ?? "Unknown",
      tags: [],
      recurring: false,
    }));
  }

  return demoTransactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    date: t.date,
    description: t.merchant,
    category: t.category,
    account: t.account,
    tags: [],
    recurring: t.recurring,
  }));
}

export function suggestCategories(description: string): string[] {
  return suggestCategoriesFromDescription(description);
}

function validateSplitAmount(total: number, splits: SplitLine[] | undefined) {
  if (!splits || splits.length === 0) return true;
  const splitTotal = splits.reduce((sum, line) => sum + line.amount, 0);
  return Math.round(splitTotal * 100) === Math.round(total * 100);
}

function nextDateFromFrequency(startDate: string, frequency: RecurringFrequency) {
  const date = new Date(startDate);
  if (frequency === "weekly") return format(addWeeks(date, 1), "yyyy-MM-dd");
  if (frequency === "bi-weekly") return format(addWeeks(date, 2), "yyyy-MM-dd");
  if (frequency === "yearly") return format(addMonths(date, 12), "yyyy-MM-dd");
  return format(addMonths(date, 1), "yyyy-MM-dd");
}

export type CreateTransactionOptions = {
  categories?: AppCategory[];
  accounts?: AppAccount[];
  profileId?: string;
};


export async function createTransaction(
  input: TransactionInput,
  options: CreateTransactionOptions = {}
): Promise<{ ok: boolean; message: string }> {
  if (!input.description.trim()) return { ok: false, message: "Description is required." };
  if (input.amount <= 0) return { ok: false, message: "Amount must be greater than 0." };
  if (!validateSplitAmount(input.amount, input.splits)) return { ok: false, message: "Split amounts must match total amount." };

  const categories = options.categories ?? [];
  const accounts = options.accounts ?? [];
  const category = resolveCategoryForInput(input.categoryId, categories);
  const account = resolveAccountForInput(input.accountId, accounts);
  const normalizedInput: TransactionInput = {
    ...input,
    categoryId: category.categoryId,
    accountId: account.accountId,
  };
  const signedAmount = signedAmountFromInput(normalizedInput, categories);
  const isIncome = signedAmount > 0;

  if (hasSupabaseDataSync && supabase) {
    const row: Record<string, unknown> = {
      id: nanoid(),
      merchant: input.description,
      amount: signedAmount,
      transaction_date: input.date,
      account_id: null,
      category_id: null,
      account_name: account.accountName,
      category_name: category.categoryName,
      notes: input.tags.join(","),
    };
    if (options.profileId) row.profile_id = options.profileId;

    const { error } = await supabase.from("transactions").insert(row);
    if (error) return { ok: false, message: error.message };

    if (input.recurring && input.recurringFrequency) {
      await supabase.from("recurring_rules").insert({
        id: nanoid(),
        name: input.description,
        amount: Math.abs(input.amount),
        cadence: input.recurringFrequency,
        next_run_date: nextDateFromFrequency(input.date, input.recurringFrequency),
        account_id: null,
        category_id: null,
        is_income: isIncome,
        is_active: true,
      });
    }

    return { ok: true, message: "Transaction saved." };
  }

  return { ok: true, message: "Saved in demo mode." };
}
