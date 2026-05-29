"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { ActivityLogEntry, Household, HouseholdInvite, HouseholdMember, HouseholdRole } from "@/types/household";

type HouseholdState = {
  household: Household | null;
  createHousehold: (name: string, ownerEmail: string, ownerName: string) => void;
  inviteMember: (
    email: string,
    role: HouseholdInvite["role"],
    actorEmail: string,
    token?: string,
    expiresAt?: string
  ) => boolean;
  acceptInviteLocally: (member: Omit<HouseholdMember, "id" | "joinedAt">) => void;
  revokeInvite: (inviteId: string, actorEmail: string) => void;
  updateMemberRole: (memberId: string, role: HouseholdRole, actorEmail: string) => void;
  removeMember: (memberId: string, actorEmail: string) => void;
  logActivity: (actorEmail: string, action: string, detail: string) => void;
  syncHouseholdId: (householdId: string) => void;
};

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      household: null,
      createHousehold: (name, ownerEmail, ownerName) => {
        const household: Household = {
          id: nanoid(),
          name,
          ownerEmail,
          members: [
            {
              id: nanoid(),
              email: ownerEmail,
              name: ownerName,
              role: "owner",
              joinedAt: new Date().toISOString(),
            },
          ],
          invites: [],
          activity: [],
        };
        set({ household });
        get().logActivity(ownerEmail, "household.created", `Created household "${name}"`);
      },
      syncHouseholdId: (householdId) => {
        const { household } = get();
        if (!household || household.id === householdId) return;
        set({ household: { ...household, id: householdId } });
      },
      inviteMember: (email, role, actorEmail, token, expiresAt) => {
        const { household } = get();
        if (!household) return false;
        const normalized = email.trim().toLowerCase();
        if (
          household.members.some((m) => m.email.toLowerCase() === normalized) ||
          household.invites.some((i) => i.email.toLowerCase() === normalized && i.status === "pending")
        ) {
          return false;
        }
        const invite: HouseholdInvite = {
          id: nanoid(),
          email: normalized,
          role,
          status: "pending",
          sentAt: new Date().toISOString(),
          token,
          expiresAt,
        };
        set({
          household: {
            ...household,
            invites: [...household.invites, invite],
          },
        });
        get().logActivity(actorEmail, "invite.sent", `Invited ${normalized} as ${role}`);
        return true;
      },
      acceptInviteLocally: (member) => {
        const { household } = get();
        if (!household) return;
        const existing = household.members.find(
          (m) => m.email.toLowerCase() === member.email.toLowerCase()
        );
        if (existing) return;
        const nextMember: HouseholdMember = {
          ...member,
          id: nanoid(),
          joinedAt: new Date().toISOString(),
        };
        set({
          household: {
            ...household,
            members: [...household.members, nextMember],
            invites: household.invites.map((i) =>
              i.email.toLowerCase() === member.email.toLowerCase()
                ? { ...i, status: "accepted" as const }
                : i
            ),
          },
        });
        get().logActivity(member.email, "invite.accepted", `${member.name} joined the household`);
      },
      revokeInvite: (inviteId, actorEmail) => {
        const { household } = get();
        if (!household) return;
        const inv = household.invites.find((i) => i.id === inviteId);
        set({
          household: {
            ...household,
            invites: household.invites.map((i) =>
              i.id === inviteId ? { ...i, status: "revoked" as const } : i
            ),
          },
        });
        if (inv) get().logActivity(actorEmail, "invite.revoked", `Revoked invite for ${inv.email}`);
      },
      updateMemberRole: (memberId, role, actorEmail) => {
        const { household } = get();
        if (!household) return;
        const target = household.members.find((m) => m.id === memberId);
        set({
          household: {
            ...household,
            members: household.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
          },
        });
        if (target) {
          get().logActivity(actorEmail, "member.role_updated", `Set ${target.email} to ${role}`);
        }
      },
      removeMember: (memberId, actorEmail) => {
        const { household } = get();
        if (!household) return;
        const removed = household.members.find((m) => m.id === memberId);
        set({
          household: {
            ...household,
            members: household.members.filter((m) => m.id !== memberId && m.role !== "owner"),
          },
        });
        if (removed) get().logActivity(actorEmail, "member.removed", `Removed ${removed.email}`);
      },
      logActivity: (actorEmail, action, detail) => {
        const { household } = get();
        if (!household) return;
        const entry: ActivityLogEntry = {
          id: nanoid(),
          actorEmail,
          action,
          detail,
          createdAt: new Date().toISOString(),
        };
        set({
          household: {
            ...household,
            activity: [entry, ...household.activity].slice(0, 100),
          },
        });
      },
    }),
    { name: "paycheck-planner-household" }
  )
);
