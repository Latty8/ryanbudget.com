import type { PdfReportPayload } from "@/lib/reports/build-pdf-html";

export type PdfExportError = {
  code: "premium" | "rate_limit" | "server" | "network";
  message: string;
};

export async function fetchPdfReportHtml(
  payload: PdfReportPayload,
  options: { premium: boolean; demoMode: boolean }
): Promise<{ html: string } | { error: PdfExportError }> {
  let response: Response;
  try {
    response = await fetch("/api/reports/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-premium": options.premium || options.demoMode ? "true" : "false",
        "x-demo": options.demoMode ? "true" : "false",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { error: { code: "network", message: "Network error — check your connection" } };
  }

  if (response.status === 403) {
    return { error: { code: "premium", message: "PDF export requires Premium or demo mode" } };
  }
  if (response.status === 429) {
    return { error: { code: "rate_limit", message: "Too many exports — try again in a minute" } };
  }
  if (!response.ok) {
    return { error: { code: "server", message: "Server could not build the report" } };
  }

  const html = await response.text();
  if (!html.trim().startsWith("<!")) {
    return { error: { code: "server", message: "Invalid report response" } };
  }
  return { html };
}

export function openPdfPrintWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
