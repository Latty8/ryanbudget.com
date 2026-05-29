import { describe, expect, it } from "vitest";
import { parseNaturalLanguageTransaction } from "@/lib/ai/parse-transaction";

describe("parseNaturalLanguageTransaction", () => {
  const base = new Date("2026-05-12");

  it("parses amount, merchant, category, and explicit date", () => {
    const result = parseNaturalLanguageTransaction(
      "Add $45 Starbucks on 05/16/2026 as dining",
      base
    );
    expect(result).not.toBeNull();
    expect(result?.amount).toBe(45);
    expect(result?.category).toBe("Dining");
    expect(result?.description.toLowerCase()).toContain("starbucks");
    expect(result?.date).toBe("2026-05-16");
  });

  it("parses relative friday from a monday base", () => {
    const result = parseNaturalLanguageTransaction("Add $12 coffee on friday as dining", base);
    expect(result?.date).toMatch(/2026-05-1[56]/);
  });

  it("returns null when amount is missing", () => {
    expect(parseNaturalLanguageTransaction("coffee at starbucks", base)).toBeNull();
  });

  it("parses groceries at merchant with last friday", () => {
    const result = parseNaturalLanguageTransaction(
      "Add $67.50 groceries at Walmart last Friday",
      base
    );
    expect(result?.amount).toBe(67.5);
    expect(result?.category).toBe("Groceries");
    expect(result?.description.toLowerCase()).toContain("walmart");
  });

  it("detects bi-weekly paycheck recurring", () => {
    const result = parseNaturalLanguageTransaction(
      "Bi-weekly paycheck 1850 next Friday",
      base
    );
    expect(result?.amount).toBe(1850);
    expect(result?.recurring).toBe(true);
    expect(result?.recurringFrequency).toBe("bi-weekly");
    expect(result?.type).toBe("income");
  });
});
