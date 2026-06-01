"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { toastTransactionDeleted, toastTransactionSaved } from "@/lib/feedback/app-feedback";
import type { TransactionInput } from "@/types/finance";
import { useAppDataStore } from "@/store/useAppDataStore";
import { applyTransactionRules } from "@/lib/rules/apply-transaction-rules";
import { logActivity } from "@/store/useActivityLogStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { useSaveTransaction } from "@/hooks/use-save-transaction";

/** Update an existing transaction in the local store (cloud sync when enabled). */
export function useUpdateTransaction() {
  return useCallback(async (id: string, input: TransactionInput) => {
    const rules = useTransactionRulesStore.getState().rules;
    const { input: categorized } = applyTransactionRules(input, rules);
    const updateLocal = useAppDataStore.getState().updateTransaction;
    updateLocal(id, categorized);
    logActivity("updated", "transaction", categorized.description ?? "Transaction");

    if (!hasSupabaseDataSync) {
      toastTransactionSaved({ edit: true });
      return { ok: true, message: "Updated locally." };
    }

    const cloudResult = await createTransaction(categorized);
    if (cloudResult.ok) {
      toastTransactionSaved({ edit: true });
      return cloudResult;
    }

    const isSchemaError =
      cloudResult.message.includes("schema cache") ||
      cloudResult.message.includes("Could not find") ||
      cloudResult.message.includes("does not exist");

    if (isSchemaError) {
      toastTransactionSaved({ edit: true });
      return { ok: true, message: "Updated locally." };
    }

    toast.error(cloudResult.message);
    return cloudResult;
  }, []);
}

/** Remove a transaction from the local store. */
export function useDeleteTransaction() {
  return useCallback(async (id: string) => {
    const existing = useAppDataStore.getState().demoTransactions.find((t) => t.id === id);
    useAppDataStore.getState().deleteTransaction(id);
    logActivity("deleted", "transaction", existing?.merchant ?? "Transaction");
    toastTransactionDeleted();
    return { ok: true };
  }, []);
}

/** Create or update depending on whether an id is provided. */
export function useTransactionSubmit() {
  const save = useSaveTransaction();
  const update = useUpdateTransaction();
  return useCallback(
    async (input: TransactionInput, editId?: string) => {
      if (editId) return update(editId, input);
      return save(input);
    },
    [save, update]
  );
}
