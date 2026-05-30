"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import { useSaveTransaction } from "@/hooks/use-save-transaction";
import { cn } from "@/lib/utils";

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
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg md:bottom-8 md:right-8",
          "bg-sky-500 text-white hover:bg-sky-600 active:scale-95",
          "ring-4 ring-sky-500/20"
        )}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <TransactionEntryModal open={open} onOpenChange={setOpen} onSubmit={saveTransaction} />
    </>
  );
}
