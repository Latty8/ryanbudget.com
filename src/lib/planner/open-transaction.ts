import type { TransactionInput } from "@/types/finance";

export function openNewTransaction(draft?: Partial<TransactionInput>) {
  window.dispatchEvent(
    new CustomEvent<Partial<TransactionInput>>("planner:new-transaction", { detail: draft })
  );
}
