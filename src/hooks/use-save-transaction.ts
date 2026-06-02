"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { TransactionInput } from "@/types/finance";
import { createTransaction } from "@/lib/supabase/queries/transactions";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { toastTransactionSaved } from "@/lib/feedback/app-feedback";
import { transactionInputToStoreRow } from "@/lib/transactions/store-mapper";
import { applyTransactionRules } from "@/lib/rules/apply-transaction-rules";
import { logActivity } from "@/store/useActivityLogStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { isPaycheckIncome } from "@/lib/paycheck/is-paycheck-income";
import { useAppDataStore } from "@/store/useAppDataStore";

function maybeOpenPaycheckWizard(input: TransactionInput) {
  const categories = useAppDataStore.getState().categories;
  if (!isPaycheckIncome(input, categories)) return;
  window.dispatchEvent(
    new CustomEvent("planner:paycheck-allocate", {
      detail: { amount: Math.abs(input.amount) },
    })
  );
}

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
    const rules = useTransactionRulesStore.getState().rules;
    const { input: categorized, matchedRule } = applyTransactionRules(input, rules);

    const validated = await createTransaction(categorized, {
      categories: useAppDataStore.getState().categories,
    });
    if (!validated.ok) {
      const isSchemaError =
        validated.message.includes("schema cache") ||
        validated.message.includes("Could not find") ||
        validated.message.includes("does not exist");
      if (isSchemaError) {
        appendToStore(categorized);
        logActivity("created", "transaction", categorized.description ?? "Transaction", matchedRule?.name);
        toastTransactionSaved();
        maybeOpenPaycheckWizard(categorized);
        return { ok: true, message: "Saved locally." };
      }
      toast.error(validated.message);
      return validated;
    }

    appendToStore(categorized);
    logActivity("created", "transaction", categorized.description ?? "Transaction", matchedRule?.name);

    if (!hasSupabaseDataSync) {
      toastTransactionSaved();
      maybeOpenPaycheckWizard(categorized);
      return { ok: true, message: "Saved locally." };
    }

    if (validated.message === "Transaction saved.") {
      toastTransactionSaved();
      maybeOpenPaycheckWizard(categorized);
      return validated;
    }

    toastTransactionSaved();
    maybeOpenPaycheckWizard(categorized);
    return { ok: true, message: "Saved locally." };
  }, []);
}
