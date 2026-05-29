import { NextResponse } from "next/server";
import { createBudgetShare, getBudgetShare } from "@/lib/sharing/server-shares";
import { rateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const share = getBudgetShare(token);
  if (!share) return NextResponse.json({ error: "Link expired or not found" }, { status: 404 });
  return NextResponse.json({ share });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`share-budget:${ip}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = (await request.json()) as Omit<
    Parameters<typeof createBudgetShare>[0],
    never
  >;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const share = createBudgetShare({
    title: body.title,
    ownerLabel: body.ownerLabel ?? "A budgeter",
    categories: body.categories ?? [],
    recurring: body.recurring ?? [],
    goals: body.goals ?? [],
  });

  return NextResponse.json({
    token: share.token,
    shareUrl: `/share/budget/${share.token}`,
    expiresAt: share.expiresAt,
  });
}
