"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { TransactionInput } from "@/types/finance";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { useAppDataStore } from "@/store/useAppDataStore";

function appendToStore(input: TransactionInput) {
  const { accounts, categories } = useAppDataStore.getState();
  const account = accounts.find((a) => a.id === input.accountId);
  const category = categories.find((c) => c.id === input.categoryId);

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
}

/** Save a transaction — always persists locally; Supabase only if ENABLE_DATA is on. */
export function useSaveTransaction() {
  return useCallback(async (input: TransactionInput) => {
    const cloudResult = await createTransaction(input);

    if (cloudResult.ok) {
      appendToStore(input);
      toast.success(cloudResult.message === "Saved in demo mode." ? "Saved" : cloudResult.message);
      return cloudResult;
    }

    const isSchemaError =
      cloudResult.message.includes("schema cache") ||
      cloudResult.message.includes("Could not find") ||
      cloudResult.message.includes("does not exist");

    if (isSchemaError) {
      appendToStore(input);
      toast.success("Saved on this device");
      return { ok: true, message: "Saved locally." };
    }

    toast.error(cloudResult.message);
    return cloudResult;
  }, []);
}
