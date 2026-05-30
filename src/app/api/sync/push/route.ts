import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { pushRemoteState, isSyncAvailable } from "@/lib/supabase/sync/server";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  if (isDemoUserId(session.userId)) {
    return NextResponse.json({ ok: true, synced: false });
  }
  if (!hasSupabaseDataSync || !isSyncAvailable()) {
    return NextResponse.json({ ok: true, synced: false });
  }

  const body = (await request.json()) as { state?: RemoteAppState };
  if (!body.state) {
    return NextResponse.json({ ok: false, message: "Missing state." }, { status: 400 });
  }

  const synced = await pushRemoteState(session.userId, body.state);
  return NextResponse.json({ ok: synced, synced });
}
