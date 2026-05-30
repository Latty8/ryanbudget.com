import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import { pullRemoteState, isSyncAvailable } from "@/lib/supabase/sync/server";

export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  if (isDemoUserId(session.userId)) {
    return NextResponse.json({ ok: true, state: null, syncEnabled: false });
  }
  if (!hasSupabaseDataSync || !isSyncAvailable()) {
    return NextResponse.json({ ok: true, state: null, syncEnabled: false });
  }

  const state = await pullRemoteState(session.userId, {
    email: session.email,
    name: session.name,
  });

  return NextResponse.json({ ok: true, state, syncEnabled: true });
}
