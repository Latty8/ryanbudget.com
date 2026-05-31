import { toast } from "sonner";

/** Fire a global UI event (e.g. FAB pulse on save). */
export function dispatchPlannerEvent(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function toastTransactionSaved(options?: { edit?: boolean; offline?: boolean }) {
  if (options?.offline) {
    toast.success("Saved offline — will sync when you're back online");
    return;
  }
  const message = options?.edit ? "Transaction updated" : "Transaction saved";
  toast.success(message, { duration: 2200 });
  if (!options?.edit) {
    dispatchPlannerEvent("planner:transaction-saved");
  }
}

export function toastTransactionDeleted() {
  toast.success("Transaction deleted", { duration: 2000 });
}

export function toastSaved(label: string) {
  toast.success(label, { duration: 2000 });
}

export function toastBudgetSaved(edit = false) {
  toast.success(edit ? "Budget updated" : "Budget added", { duration: 2200 });
  dispatchPlannerEvent("planner:budget-saved");
}

export function toastGoalComplete(name: string) {
  toast.success(`Goal complete: ${name}!`, { duration: 4500 });
  dispatchPlannerEvent("planner:goal-complete", { name });
}

export function toastGoalProgress(name: string, amountLabel: string) {
  toast.success(`Added ${amountLabel} to ${name}`, { duration: 2200 });
  dispatchPlannerEvent("planner:goal-progress");
}
