import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/api/rate-limit";
import { buildPdfReportHtml, type PdfReportPayload } from "@/lib/reports/build-pdf-html";

/** Returns printable branded HTML (use browser Print → Save as PDF). */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`pdf:${ip}`, 12, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const premium =
    request.headers.get("x-premium") === "true" || request.headers.get("x-demo") === "true";
  if (!premium) {
    return NextResponse.json({ error: "Premium required for PDF export" }, { status: 403 });
  }

  const body = (await request.json()) as PdfReportPayload;
  const html = buildPdfReportHtml(body);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
