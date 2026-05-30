"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { TransactionInput } from "@/types/finance";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { transactionInputToStoreRow } from "@/lib/transactions/store-mapper";
import { useAppDataStore } from "@/store/useAppDataStore";

function appendToStore(input: TransactionInput) {
  const state = useAppDataStore.getState();
  const row = transactionInputToStoreRow(
    input,
    nanoid(),
    state.accounts,
    state.categories,
    state.preferences
  );
  useAppDataStore.setState({
    demoTransactions: [row, ...state.demoTransactions],
  });
}

/** Save a transaction — local store first; optional Supabase when ENABLE_DATA is on. */
export function useSaveTransaction() {
  return useCallback(async (input: TransactionInput) => {
    const validated = await createTransaction(input);
    if (!validated.ok) {
      const isSchemaError =
        validated.message.includes("schema cache") ||
        validated.message.includes("Could not find") ||
        validated.message.includes("does not exist");
      if (isSchemaError) {
        appendToStore(input);
        toast.success("Saved on this device");
        return { ok: true, message: "Saved locally." };
      }
      toast.error(validated.message);
      return validated;
    }

    appendToStore(input);

    if (!hasSupabaseDataSync) {
      toast.success("Saved");
      return { ok: true, message: "Saved locally." };
    }

    if (validated.message === "Transaction saved.") {
      toast.success("Transaction saved");
      return validated;
    }

    toast.success("Saved on this device");
    return { ok: true, message: "Saved locally." };
  }, []);
}
