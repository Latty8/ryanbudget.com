import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { readSessionFromRequest } from "@/lib/auth/read-session-request";
import { scanReceiptImage } from "@/lib/receipts/receipt-scan";
import { createSupabaseAdmin, hasSupabaseAdmin, RECEIPTS_BUCKET } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const premium = request.headers.get("x-premium") === "true";
  if (!premium) {
    return NextResponse.json(
      { error: "Receipt scanning is a Premium feature" },
      { status: 403 }
    );
  }

  const limited = rateLimit(`ocr:${session.userId}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = (await request.json()) as {
    fileName?: string;
    mimeType?: string;
    previewUrl?: string;
    storagePath?: string;
  };

  let imageUrl = body.previewUrl ?? "";
  const mimeType = body.mimeType ?? "image/jpeg";

  if (body.storagePath && hasSupabaseAdmin && !imageUrl.startsWith("data:")) {
    const admin = createSupabaseAdmin();
    if (admin) {
      const { data } = await admin.storage
        .from(RECEIPTS_BUCKET)
        .createSignedUrl(body.storagePath, 300);
      if (data?.signedUrl) imageUrl = data.signedUrl;
    }
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "No receipt image available to scan" }, { status: 400 });
  }

  if (mimeType === "application/pdf") {
    return NextResponse.json({
      status: "ok",
      message: "PDF receipts use filename hints — photo receipts scan best.",
      suggestion: await scanReceiptImage({
        imageUrl: "",
        mimeType,
        fileName: body.fileName,
      }),
    });
  }

  const suggestion = await scanReceiptImage({
    imageUrl,
    mimeType,
    fileName: body.fileName,
  });

  return NextResponse.json({
    status: "ok",
    message:
      suggestion.amount > 0
        ? `Found $${suggestion.amount.toFixed(2)} at ${suggestion.description}`
        : "Could not read amount — edit fields manually.",
    suggestion,
  });
}
