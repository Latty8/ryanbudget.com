import { describe, expect, it } from "vitest";
import { formatLocalDate, parseLocalDate } from "@/lib/dates/parse-local-date";

describe("parseLocalDate", () => {
  it("parses ISO date parts in local timezone", () => {
    const d = parseLocalDate("2026-05-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(15);
  });

  it("round-trips with formatLocalDate", () => {
    const d = parseLocalDate("2026-12-31");
    expect(formatLocalDate(d)).toBe("2026-12-31");
  });
});
