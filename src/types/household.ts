export type HouseholdRole = "owner" | "editor" | "viewer";

export type HouseholdMember = {
  id: string;
  email: string;
  name: string;
  role: HouseholdRole;
  joinedAt: string;
};

export type HouseholdInvite = {
  id: string;
  email: string;
  role: Exclude<HouseholdRole, "owner">;
  status: "pending" | "accepted" | "expired" | "revoked";
  sentAt: string;
  /** Secure token for invite link (server-validated) */
  token?: string;
  expiresAt?: string;
};

export type ActivityLogEntry = {
  id: string;
  actorEmail: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type Household = {
  id: string;
  name: string;
  ownerEmail: string;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  activity: ActivityLogEntry[];
};
