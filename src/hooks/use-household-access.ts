"use client";

import { useMemo } from "react";
import { canPerformHouseholdAction, type HouseholdAction } from "@/lib/household/permissions";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useHouseholdStore } from "@/store/useHouseholdStore";
import type { HouseholdRole } from "@/types/household";

export function useHouseholdAccess() {
  const profile = useAppDataStore((s) => s.profile);
  const household = useHouseholdStore((s) => s.household);

  const role: HouseholdRole | null = useMemo(() => {
    if (!household) return null;
    const member = household.members.find(
      (m) => m.email.toLowerCase() === profile.email.toLowerCase()
    );
    return member?.role ?? null;
  }, [household, profile.email]);

  const can = (action: HouseholdAction) => {
    if (!role) return true;
    return canPerformHouseholdAction(role, action);
  };

  return {
    household,
    role,
    isShared: Boolean(household),
    canEdit: can("edit_transactions"),
    canEditBudget: can("edit_budget"),
    canInvite: can("invite_member"),
    canManageRoles: can("change_roles"),
    isViewer: role === "viewer",
  };
}
