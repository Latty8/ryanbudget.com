import { NextResponse } from "next/server";
import { attachSessionCookies } from "@/lib/auth/attach-session-cookies";
import { validatePasswordStrength } from "@/lib/auth/password";
import { isMongoDBConfigured } from "@/lib/db/config";
import { registerUser } from "@/lib/mongodb/auth";
import type { SessionPayload } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isMongoDBConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Registration requires database configuration." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";
  const name = body.name?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ ok: false, message: "Passwords do not match." }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return NextResponse.json({ ok: false, message: strengthError }, { status: 400 });
  }

  try {
    const result = await registerUser({ email, password, name });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 409 });
    }

    const payload: SessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      isDemo: false,
    };

    const response = NextResponse.json({
      ok: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
      },
    });
    return attachSessionCookies(response, payload, { onboarded: false });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json(
      { ok: false, message: "Could not connect to the database. Check server logs." },
      { status: 503 }
    );
  }
}
