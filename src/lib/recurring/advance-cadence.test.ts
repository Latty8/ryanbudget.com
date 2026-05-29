import { describe, expect, it } from "vitest";
import { addMonths, addWeeks } from "date-fns";
import { advanceCadence } from "@/lib/recurring/advance-cadence";
import { parseLocalDate } from "@/lib/dates/parse-local-date";

describe("advanceCadence", () => {
  const base = parseLocalDate("2026-05-15");

  it("advances weekly by 7 days", () => {
    expect(advanceCadence(base, "weekly").getTime()).toBe(addWeeks(base, 1).getTime());
  });

  it("advances bi-weekly by 14 days", () => {
    expect(advanceCadence(base, "bi-weekly").getTime()).toBe(addWeeks(base, 2).getTime());
  });

  it("advances monthly", () => {
    expect(advanceCadence(base, "monthly").getTime()).toBe(addMonths(base, 1).getTime());
  });

  it("advances yearly by 12 months", () => {
    expect(advanceCadence(base, "yearly").getTime()).toBe(addMonths(base, 12).getTime());
  });
});
