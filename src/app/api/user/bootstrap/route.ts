import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasSupabaseDataSync } from "@/lib/supabase/client";
import {
  ensureUserProfile,
  getOnboardingCompleted,
  isSyncAvailable,
} from "@/lib/supabase/sync/server";

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

  const profile = await ensureUserProfile(session.userId, session.email, session.name);
  const onboardingCompleted =
    profile?.onboarding_completed ?? (await getOnboardingCompleted(session.userId)) ?? false;

  return NextResponse.json({
    ok: true,
    onboardingCompleted,
    syncEnabled: hasSupabaseDataSync,
    profile: profile
      ? {
          email: profile.email,
          name: profile.full_name,
        }
      : { email: session.email, name: session.name },
  });
}
