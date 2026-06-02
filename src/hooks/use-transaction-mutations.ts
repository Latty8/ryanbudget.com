"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { toastTransactionDeleted, toastTransactionSaved } from "@/lib/feedback/app-feedback";
import type { TransactionInput } from "@/types/finance";
import { useAppDataStore } from "@/store/useAppDataStore";
import { applyTransactionRules } from "@/lib/rules/apply-transaction-rules";
import { logActivity } from "@/store/useActivityLogStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { useSaveTransaction } from "@/hooks/use-save-transaction";
import { normalizeTransactionInput } from "@/lib/transactions/resolve-category";
import { isClientCloudSyncEnabled } from "@/lib/db/client";
import { pushLocalStateNow } from "@/lib/supabase/sync/client";

/** Update an existing transaction in the local store (cloud sync when enabled). */
export function useUpdateTransaction() {
  return useCallback(async (id: string, input: TransactionInput) => {
    const rules = useTransactionRulesStore.getState().rules;
    const { input: ruled } = applyTransactionRules(input, rules);
    const state = useAppDataStore.getState();
    const categorized = normalizeTransactionInput(ruled, state.categories, state.accounts);
    const updateLocal = useAppDataStore.getState().updateTransaction;
    updateLocal(id, categorized);
    logActivity("updated", "transaction", categorized.description ?? "Transaction");

    if (isClientCloudSyncEnabled()) {
      const pushed = await pushLocalStateNow();
      if (!pushed) {
        toast.error("Saved on this device, but cloud sync failed. Try again from Settings.");
        return { ok: false, message: "Cloud sync failed." };
      }
    }

    if (!hasSupabaseDataSync) {
      toastTransactionSaved({ edit: true });
      return { ok: true, message: "Updated locally." };
    }

    toastTransactionSaved({ edit: true });
    return { ok: true, message: "Updated." };
  }, []);
}

/** Remove a transaction from the local store. */
export function useDeleteTransaction() {
  return useCallback(async (id: string) => {
    const existing = useAppDataStore.getState().demoTransactions.find((t) => t.id === id);
    useAppDataStore.getState().deleteTransaction(id);
    logActivity("deleted", "transaction", existing?.merchant ?? "Transaction");
    if (isClientCloudSyncEnabled()) {
      await pushLocalStateNow();
    }
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
