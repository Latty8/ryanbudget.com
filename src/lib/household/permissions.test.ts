import { describe, expect, it } from "vitest";
import {
  canChangeMemberRole,
  canPerformHouseholdAction,
  canRemoveMember,
} from "@/lib/household/permissions";

describe("household permissions", () => {
  it("owner can invite and change roles", () => {
    expect(canPerformHouseholdAction("owner", "invite_member")).toBe(true);
    expect(canChangeMemberRole("owner", "editor")).toBe(true);
    expect(canRemoveMember("owner", "editor")).toBe(true);
  });

  it("editor cannot change roles or remove members", () => {
    expect(canPerformHouseholdAction("editor", "edit_transactions")).toBe(true);
    expect(canChangeMemberRole("editor", "viewer")).toBe(false);
    expect(canRemoveMember("editor", "viewer")).toBe(false);
  });

  it("viewer is read-only", () => {
    expect(canPerformHouseholdAction("viewer", "view_budget")).toBe(true);
    expect(canPerformHouseholdAction("viewer", "edit_transactions")).toBe(false);
    expect(canPerformHouseholdAction("viewer", "edit_budget")).toBe(false);
  });
});
