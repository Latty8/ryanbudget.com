import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { ONBOARDED_COOKIE } from "@/lib/auth/session";
import { setOnboardingCompleted, isSyncAvailable } from "@/lib/supabase/sync/server";

export async function PATCH(request: Request) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as { onboardingCompleted?: boolean };
  if (body.onboardingCompleted === undefined) {
    return NextResponse.json({ ok: false, message: "Missing onboardingCompleted." }, { status: 400 });
  }

  const completed = body.onboardingCompleted === true;

  if (!isDemoUserId(session.userId) && isSyncAvailable()) {
    await setOnboardingCompleted(session.userId, completed);
  }

  const response = NextResponse.json({ ok: true, onboardingCompleted: completed });

  if (completed) {
    response.cookies.set(ONBOARDED_COOKIE, "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    response.cookies.delete(ONBOARDED_COOKIE);
  }

  return attachSessionCookies(response, session);
}
