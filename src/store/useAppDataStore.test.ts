import { describe, expect, it, beforeEach } from "vitest";
import { useAppDataStore } from "@/store/useAppDataStore";
import { createAccount, createTransaction } from "@/test/factories/budget";

describe("useAppDataStore deleteAccount", () => {
  beforeEach(() => {
    useAppDataStore.setState({
      accounts: [
        createAccount({ id: "a1", name: "Checking" }),
        createAccount({ id: "a2", name: "Savings" }),
      ],
      demoTransactions: [
        createTransaction({ account: "Checking", merchant: "Rent" }),
        createTransaction({ account: "Savings", merchant: "Transfer" }),
      ],
    });
  });

  it("reassigns transactions to another account when one is deleted", () => {
    useAppDataStore.getState().deleteAccount("a1");
    const txs = useAppDataStore.getState().demoTransactions;
    expect(useAppDataStore.getState().accounts).toHaveLength(1);
    expect(txs.find((t) => t.merchant === "Rent")?.account).toBe("Savings");
    expect(txs.find((t) => t.merchant === "Transfer")?.account).toBe("Savings");
  });
});
