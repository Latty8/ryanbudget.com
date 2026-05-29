import { NextResponse } from "next/server";
import { createReportShare, getReportShare } from "@/lib/sharing/server-shares";
import { rateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const share = getReportShare(token);
  if (!share) return NextResponse.json({ error: "Link expired or not found" }, { status: 404 });
  return NextResponse.json({ share });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`share-report:${ip}`, 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = (await request.json()) as { title?: string; ownerLabel?: string; html?: string };
  if (!body.html?.trim()) {
    return NextResponse.json({ error: "html required" }, { status: 400 });
  }

  const share = createReportShare({
    title: body.title ?? "Monthly report",
    ownerLabel: body.ownerLabel ?? "A budgeter",
    html: body.html,
  });

  return NextResponse.json({
    token: share.token,
    shareUrl: `/share/report/${share.token}`,
    expiresAt: share.expiresAt,
  });
}
