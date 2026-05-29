import { describe, expect, it } from "vitest";
import { getReceiptLimits, RECEIPT_LIMITS } from "@/lib/receipts/limits";

describe("receipt limits", () => {
  it("free tier has lower caps and no OCR", () => {
    const free = getReceiptLimits(false);
    expect(free.maxFiles).toBe(RECEIPT_LIMITS.free.maxFiles);
    expect(free.ocr).toBe(false);
    expect(free.maxFileBytes).toBeLessThan(RECEIPT_LIMITS.premium.maxFileBytes);
  });

  it("premium tier allows more files and OCR", () => {
    const premium = getReceiptLimits(true);
    expect(premium.maxFiles).toBe(10);
    expect(premium.ocr).toBe(true);
  });
});
