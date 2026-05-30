"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { TransactionEntryModal } from "@/components/fintech/transaction-entry-modal";
import { useTransactionSubmit } from "@/hooks/use-transaction-mutations";
import { cn } from "@/lib/utils";

export function AddTransactionFab() {
  const [open, setOpen] = useState(false);
  const submitTransaction = useTransactionSubmit();

  useEffect(() => {
    const onNew = () => setOpen(true);
    window.addEventListener("planner:new-transaction", onNew);
    return () => window.removeEventListener("planner:new-transaction", onNew);
  }, []);

  return (
    <>
      <div className="fixed bottom-20 right-5 z-40 md:bottom-8 md:right-8">
        <span
          className="absolute inset-0 animate-pulse rounded-full bg-[var(--accent)] opacity-30 blur-xl"
          aria-hidden
        />
        <button
          type="button"
          aria-label="Add transaction"
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)]",
            "text-[var(--accent-foreground)] shadow-[var(--shadow-glow)]",
            "ring-2 ring-white/25 ring-offset-2 ring-offset-[var(--background)]",
            "transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
          )}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
      <TransactionEntryModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={(input) => submitTransaction(input)}
      />
    </>
  );
}
