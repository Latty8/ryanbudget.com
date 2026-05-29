import { NextResponse } from "next/server";

/** Hidden health check for uptime monitors (not linked in UI). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "paycheck-planner",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
  });
}
