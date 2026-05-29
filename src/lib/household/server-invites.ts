import { nanoid } from "nanoid";
import type { HouseholdRole } from "@/types/household";

export type ServerInvite = {
  token: string;
  householdId: string;
  householdName: string;
  inviterEmail: string;
  inviteeEmail: string;
  role: Exclude<HouseholdRole, "owner">;
  createdAt: string;
  expiresAt: string;
};

const invites = new Map<string, ServerInvite>();

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createServerInvite(payload: Omit<ServerInvite, "token" | "createdAt" | "expiresAt">) {
  const token = nanoid(32);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const invite: ServerInvite = { ...payload, token, createdAt, expiresAt };
  invites.set(token, invite);
  return invite;
}

export function getServerInvite(token: string): ServerInvite | null {
  const invite = invites.get(token);
  if (!invite) return null;
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    invites.delete(token);
    return null;
  }
  return invite;
}

export function consumeServerInvite(token: string): ServerInvite | null {
  const invite = getServerInvite(token);
  if (!invite) return null;
  invites.delete(token);
  return invite;
}
