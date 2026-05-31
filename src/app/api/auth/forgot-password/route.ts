import { NextResponse } from "next/server";
import { isMongoDBConfigured } from "@/lib/db/config";
import { getSiteUrl } from "@/lib/email/config";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { createPasswordResetToken } from "@/lib/mongodb/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  if (!isMongoDBConfigured()) {
    return NextResponse.json({
      ok: true,
      message: "If an account exists, reset instructions will be sent.",
    });
  }

  const reset = await createPasswordResetToken(email);

  if (reset) {
    const resetUrl = `${getSiteUrl()}/login/reset-password?token=${reset.token}`;
    const sent = await sendPasswordResetEmail({ to: email, resetUrl });

    if (!sent.ok) {
      console.error("[auth] Password reset email failed:", sent.message);
      console.info("[auth] Password reset link (fallback):", resetUrl);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, you'll receive reset instructions shortly.",
  });
}
