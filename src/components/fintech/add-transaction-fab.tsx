"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import { useSaveTransaction } from "@/hooks/use-save-transaction";

export function AddTransactionFab() {
  const [open, setOpen] = useState(false);
  const saveTransaction = useSaveTransaction();

  useEffect(() => {
    const onNew = () => setOpen(true);
    window.addEventListener("planner:new-transaction", onNew);
    return () => window.removeEventListener("planner:new-transaction", onNew);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Add transaction"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <TransactionEntryModal open={open} onOpenChange={setOpen} onSubmit={saveTransaction} />
    </>
  );
}
