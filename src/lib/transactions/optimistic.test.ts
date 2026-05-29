import { describe, expect, it, vi } from "vitest";
import { buildOptimisticTransaction, rollbackTransactions } from "@/lib/transactions/optimistic";

describe("optimistic transactions", () => {
  it("builds a pending row with negative expense amount", () => {
    const row = buildOptimisticTransaction(
      {
        amount: 42.5,
        date: "2026-05-10",
        description: "Coffee",
        categoryId: "Dining",
        accountId: "acc-1",
        tags: [],
        recurring: false,
      },
      "Checking"
    );
    expect(row.amount).toBe(-42.5);
    expect(row.account).toBe("Checking");
    expect(row.id).toMatch(/^pending-/);
  });

  it("rollback restores previous rows", () => {
    const setData = vi.fn();
    const previous = [{ id: "1", amount: -10, date: "2026-05-01", description: "A", category: "X", account: "C", tags: [], recurring: false }];
    rollbackTransactions(previous, setData);
    expect(setData).toHaveBeenCalledWith(previous);
  });
});
