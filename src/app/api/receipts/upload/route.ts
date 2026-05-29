import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { rateLimit } from "@/lib/api/rate-limit";
import { getReceiptLimits, RECEIPT_ACCEPT } from "@/lib/receipts/limits";
import { createSupabaseAdmin, hasSupabaseAdmin, RECEIPTS_BUCKET } from "@/lib/supabase/admin";
import { readSessionFromRequest } from "@/lib/auth/read-session-request";

const ALLOWED = RECEIPT_ACCEPT.split(",");

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`receipt:${session.userId}:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const premiumHeader = request.headers.get("x-premium") === "true";
  const limits = getReceiptLimits(premiumHeader);

  const form = await request.formData();
  const file = form.get("file");
  const transactionId = String(form.get("transactionId") ?? "draft");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP, and PDF are allowed" }, { status: 400 });
  }

  if (file.size > limits.maxFileBytes) {
    return NextResponse.json(
      { error: `File exceeds ${Math.round(limits.maxFileBytes / 1024 / 1024)}MB limit` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const receiptId = nanoid();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const storagePath = `${session.userId}/${transactionId}/${receiptId}-${safeName}`;

  const admin = createSupabaseAdmin();
  if (hasSupabaseAdmin && admin) {
    const { error } = await admin.storage.from(RECEIPTS_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: signed } = await admin.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    return NextResponse.json({
      receipt: {
        id: receiptId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        previewUrl: signed?.signedUrl ?? "",
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  return NextResponse.json({
    receipt: {
      id: receiptId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      previewUrl: dataUrl,
      uploadedAt: new Date().toISOString(),
    },
    storage: "local",
  });
}
