import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasCloudDataSync } from "@/lib/db/config";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { pushRemoteState, isSyncAvailable, getSyncRevision } from "@/lib/db/sync-server";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  if (isDemoUserId(session.userId)) {
    return NextResponse.json({ ok: true, synced: false });
  }
  if (!hasCloudDataSync || !isSyncAvailable()) {
    return NextResponse.json({ ok: true, synced: false });
  }

  const body = (await request.json()) as { state?: RemoteAppState };
  if (!body.state) {
    return NextResponse.json({ ok: false, message: "Missing state." }, { status: 400 });
  }

  const synced = await pushRemoteState(session.userId, body.state);
  const revision = synced ? await getSyncRevision(session.userId) : null;
  return NextResponse.json({ ok: synced, synced, revision });
}
