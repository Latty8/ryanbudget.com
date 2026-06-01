import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasCloudDataSync } from "@/lib/db/config";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import { pullRemoteState, isSyncAvailable, getSyncRevision } from "@/lib/db/sync-server";

function countEntities(state: RemoteAppState | null) {
  if (!state) return 0;
  return (
    state.accounts.length +
    state.categories.length +
    state.transactions.length +
    state.recurring.length +
    state.goals.length
  );
}

export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  if (isDemoUserId(session.userId)) {
    return NextResponse.json({ ok: true, state: null, syncEnabled: false });
  }
  if (!hasCloudDataSync || !isSyncAvailable()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[sync/pull] skipped — sync not available", {
        hasCloudDataSync,
        isSyncAvailable: isSyncAvailable(),
      });
    }
    return NextResponse.json({ ok: true, state: null, syncEnabled: false });
  }

  const state = await pullRemoteState(session.userId, {
    email: session.email,
    name: session.name,
  });
  const revision = await getSyncRevision(session.userId);

  if (process.env.NODE_ENV === "development") {
    console.info("[sync/pull]", {
      userId: session.userId,
      email: session.email,
      entityCount: countEntities(state),
      revision,
    });
  }

  return NextResponse.json({ ok: true, state, revision, syncEnabled: true });
}
