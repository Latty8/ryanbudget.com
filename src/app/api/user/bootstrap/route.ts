import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasCloudDataSync } from "@/lib/db/config";
import { findUserById } from "@/lib/mongodb/sync";
import {
  ensureUserProfile,
  getOnboardingCompleted,
  isSyncAvailable,
} from "@/lib/db/sync-server";

/** Ensure profile row exists and return onboarding status for cross-device gating. */
export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  if (isDemoUserId(session.userId)) {
    return NextResponse.json({
      ok: true,
      onboardingCompleted: true,
      syncEnabled: false,
    });
  }

  if (!isSyncAvailable()) {
    return NextResponse.json({
      ok: true,
      onboardingCompleted: false,
      syncEnabled: false,
    });
  }

  await ensureUserProfile(session.userId, session.email, session.name);
  const mongoUser = await findUserById(session.userId);
  const onboardingCompleted =
    mongoUser?.onboardingCompleted ?? (await getOnboardingCompleted(session.userId)) ?? false;

  return NextResponse.json({
    ok: true,
    onboardingCompleted,
    syncEnabled: hasCloudDataSync,
    profile: {
      email: mongoUser?.email ?? session.email,
      name: mongoUser?.name ?? session.name,
    },
  });
}
