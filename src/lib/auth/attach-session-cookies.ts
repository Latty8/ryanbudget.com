import { NextResponse } from "next/server";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import {
  DEMO_MODE_COOKIE,
  SESSION_COOKIE,
  type SessionPayload,
} from "@/lib/auth/session";

export function attachSessionCookies(
  response: NextResponse,
  payload: SessionPayload,
  options?: { demo?: boolean }
) {
  const isDemo =
    options?.demo === true || payload.isDemo === true || isDemoUserId(payload.userId);

  response.cookies.set(SESSION_COOKIE, encodeURIComponent(JSON.stringify({ ...payload, isDemo })), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  if (isDemo) {
    response.cookies.set(DEMO_MODE_COOKIE, "true", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
