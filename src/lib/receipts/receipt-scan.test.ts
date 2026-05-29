import { describe, expect, it } from "vitest";
import { parseReceiptText } from "@/lib/receipts/receipt-scan";

describe("parseReceiptText", () => {
  it("extracts total, merchant, and date from typical receipt text", () => {
    const text = `
STARBUCKS STORE #1234
123 Main St
01/15/2026

Latte            5.50
TOTAL            $12.45
    `;
    const result = parseReceiptText(text);
    expect(result.amount).toBe(12.45);
    expect(result.description.toLowerCase()).toContain("starbucks");
    expect(result.category).toBe("Dining");
    expect(result.date).toBe("2026-01-15");
  });

  it("falls back to filename when text is empty", () => {
    const result = parseReceiptText("", "walmart-groceries.jpg");
    expect(result.description).toMatch(/walmart/i);
    expect(result.category).toBe("Groceries");
  });
});
