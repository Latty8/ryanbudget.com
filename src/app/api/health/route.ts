import { NextResponse } from "next/server";
import { isMongoDBConfigured } from "@/lib/db/config";
import { hasResend } from "@/lib/email/config";

/** Health + config diagnostics for uptime monitors and VPS debugging (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "paycheck-planner",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    config: {
      mongoConfigured: isMongoDBConfigured(),
      nextAuthConfigured: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
      nextAuthUrlSet: Boolean(process.env.NEXTAUTH_URL?.trim()),
      cloudSyncClientFlag: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true",
      resendConfigured: hasResend,
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      cwd: process.cwd(),
    },
  });
}
