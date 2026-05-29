import type { HouseholdRole } from "@/types/household";

export type HouseholdAction =
  | "view_budget"
  | "edit_transactions"
  | "edit_budget"
  | "invite_member"
  | "change_roles"
  | "remove_member"
  | "delete_household";

const ROLE_PERMISSIONS: Record<HouseholdRole, ReadonlySet<HouseholdAction>> = {
  owner: new Set([
    "view_budget",
    "edit_transactions",
    "edit_budget",
    "invite_member",
    "change_roles",
    "remove_member",
    "delete_household",
  ]),
  editor: new Set(["view_budget", "edit_transactions", "edit_budget", "invite_member"]),
  viewer: new Set(["view_budget"]),
};

export function canPerformHouseholdAction(role: HouseholdRole, action: HouseholdAction): boolean {
  return ROLE_PERMISSIONS[role].has(action);
}

export function canChangeMemberRole(actorRole: HouseholdRole, targetRole: HouseholdRole): boolean {
  if (actorRole !== "owner") return false;
  return targetRole !== "owner";
}

export function canRemoveMember(actorRole: HouseholdRole, targetRole: HouseholdRole): boolean {
  if (targetRole === "owner") return false;
  return actorRole === "owner";
}
