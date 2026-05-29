import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth/read-session-request";
import { consumeServerInvite } from "@/lib/household/server-invites";

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { token: string; acceptorName?: string };
  const invite = consumeServerInvite(body.token);
  if (!invite) {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 404 });
  }

  if (invite.inviteeEmail !== session.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: "This invite was sent to a different email address.",
        expectedEmail: invite.inviteeEmail,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    householdId: invite.householdId,
    householdName: invite.householdName,
    ownerEmail: invite.inviterEmail,
    role: invite.role,
    member: {
      email: session.email,
      name: body.acceptorName ?? session.name,
      role: invite.role,
    },
  });
}
