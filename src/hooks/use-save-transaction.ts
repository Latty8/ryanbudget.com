"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { TransactionInput } from "@/types/finance";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { useAppDataStore } from "@/store/useAppDataStore";

/** Save a transaction to the store (and Supabase when configured). */
export function useSaveTransaction() {
  const accounts = useAppDataStore((s) => s.accounts);
  const categories = useAppDataStore((s) => s.categories);
  const preferences = useAppDataStore((s) => s.preferences);

  return useCallback(
    async (input: TransactionInput) => {
      const account = accounts.find((a) => a.id === input.accountId);
      const category = categories.find((c) => c.id === input.categoryId);
      const result = await createTransaction(input);

      if (!result.ok) {
        toast.error(result.message);
        return result;
      }

      useAppDataStore.setState((state) => ({
        demoTransactions: [
          {
            id: nanoid(),
            date: input.date,
            merchant: input.description,
            category: category?.name ?? input.categoryId,
            account: account?.name ?? "Manual",
            amount: input.amount < 0 ? input.amount : -Math.abs(input.amount),
            recurring: input.recurring,
            currency: input.currency ?? account?.currency ?? state.preferences.currency,
            receipts: input.receipts,
          },
          ...state.demoTransactions,
        ],
      }));

      toast.success("Saved");
      return result;
    },
    [accounts, categories, preferences.currency]
  );
}
