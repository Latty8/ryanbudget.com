import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth/read-session-request";
import { createServerInvite } from "@/lib/household/server-invites";
import type { HouseholdRole } from "@/types/household";

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    householdId: string;
    householdName: string;
    inviteeEmail: string;
    role: Exclude<HouseholdRole, "owner">;
  };

  if (!body.householdId || !body.inviteeEmail?.includes("@")) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const invite = createServerInvite({
    householdId: body.householdId,
    householdName: body.householdName,
    inviterEmail: session.email,
    inviteeEmail: body.inviteeEmail.trim().toLowerCase(),
    role: body.role ?? "editor",
  });

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = `${origin}/household/join?token=${invite.token}`;

  return NextResponse.json({ invite, inviteUrl });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { getServerInvite } = await import("@/lib/household/server-invites");
  const invite = getServerInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 404 });
  }

  return NextResponse.json({
    householdName: invite.householdName,
    role: invite.role,
    inviteeEmail: invite.inviteeEmail,
    expiresAt: invite.expiresAt,
  });
}
