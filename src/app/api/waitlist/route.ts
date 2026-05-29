import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";

const waitlist = new Set<string>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`waitlist:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  waitlist.add(email);
  return NextResponse.json({ ok: true, message: "You're on the list!" });
}
