import { NextResponse } from "next/server";
import { hasMongoDB } from "@/lib/db/config";
import { createPasswordResetToken } from "@/lib/mongodb/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  if (!hasMongoDB) {
    return NextResponse.json({
      ok: true,
      message: "If an account exists, reset instructions will be sent.",
    });
  }

  const reset = await createPasswordResetToken(email);

  if (reset) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/login/reset-password?token=${reset.token}`;
    console.info("[auth] Password reset link:", resetUrl);

    // Optional: send email when RESEND_API_KEY is configured (future hook).
    void process.env.RESEND_API_KEY;
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, you'll receive reset instructions shortly.",
  });
}
