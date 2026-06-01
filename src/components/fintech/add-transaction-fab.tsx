"use client";

import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTransactionSubmit } from "@/hooks/use-transaction-mutations";
import { cn } from "@/lib/utils";
import type { TransactionInput } from "@/types/finance";

const TransactionEntryModal = dynamic(
  () =>
    import("@/components/fintech/transaction-entry-modal").then((m) => ({
      default: m.TransactionEntryModal,
    })),
  { ssr: false }
);

export function AddTransactionFab() {
  const [open, setOpen] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [draft, setDraft] = useState<Partial<TransactionInput> | undefined>();
  const submitTransaction = useTransactionSubmit();

  useEffect(() => {
    const onNew = (event: Event) => {
      const detail = (event as CustomEvent<Partial<TransactionInput>>).detail;
      setDraft(detail);
      setOpen(true);
    };
    window.addEventListener("planner:new-transaction", onNew);
    return () => window.removeEventListener("planner:new-transaction", onNew);
  }, []);

  useEffect(() => {
    const onSaved = () => {
      setSavedPulse(true);
      window.setTimeout(() => setSavedPulse(false), 500);
    };
    window.addEventListener("planner:transaction-saved", onSaved);
    return () => window.removeEventListener("planner:transaction-saved", onSaved);
  }, []);

  return (
    <>
      <div className="fixed bottom-20 right-5 z-40 xl:bottom-8 xl:right-8">
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
            "text-[var(--accent-foreground)] shadow-sm",
            "ring-2 ring-white/25 ring-offset-2 ring-offset-[var(--background)]",
            "transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95",
            savedPulse && "fab-success-pulse"
          )}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>
      {open ? (
        <TransactionEntryModal
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setDraft(undefined);
          }}
          initialDraft={draft}
          onSubmit={(input) => submitTransaction(input)}
        />
      ) : null}
    </>
  );
}
