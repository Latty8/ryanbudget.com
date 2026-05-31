import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/auth/password";
import { hasMongoDB } from "@/lib/db/config";
import { resetPasswordWithToken } from "@/lib/mongodb/auth";

export async function POST(request: Request) {
  if (!hasMongoDB) {
    return NextResponse.json(
      { ok: false, message: "Password reset is not available." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    token?: string;
    password?: string;
    confirmPassword?: string;
  };

  const token = body.token?.trim();
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!token) {
    return NextResponse.json({ ok: false, message: "Missing reset token." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ ok: false, message: "Passwords do not match." }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return NextResponse.json({ ok: false, message: strengthError }, { status: 400 });
  }

  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
}
