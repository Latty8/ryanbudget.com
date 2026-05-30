"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import type { TransactionInput } from "@/types/finance";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useSaveTransaction } from "@/hooks/use-save-transaction";

/** Update an existing transaction in the local store (cloud sync when enabled). */
export function useUpdateTransaction() {
  return useCallback(async (id: string, input: TransactionInput) => {
    const updateLocal = useAppDataStore.getState().updateTransaction;
    updateLocal(id, input);

    if (!hasSupabaseDataSync) {
      toast.success("Transaction updated");
      return { ok: true, message: "Updated locally." };
    }

    const cloudResult = await createTransaction(input);
    if (cloudResult.ok) {
      toast.success("Transaction updated");
      return cloudResult;
    }

    const isSchemaError =
      cloudResult.message.includes("schema cache") ||
      cloudResult.message.includes("Could not find") ||
      cloudResult.message.includes("does not exist");

    if (isSchemaError) {
      toast.success("Updated on this device");
      return { ok: true, message: "Updated locally." };
    }

    toast.error(cloudResult.message);
    return cloudResult;
  }, []);
}

/** Remove a transaction from the local store. */
export function useDeleteTransaction() {
  return useCallback(async (id: string) => {
    useAppDataStore.getState().deleteTransaction(id);
    toast.success("Transaction deleted");
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
