"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { GhostButton, PrimaryButton } from "@/components/fintech/ui";
import { usePremium } from "@/hooks/use-premium";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { fetchPdfReportHtml, openPdfPrintWindow } from "@/lib/reports/export-pdf-client";
import type { PdfReportPayload } from "@/lib/reports/build-pdf-html";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  buildPayload: () => PdfReportPayload;
  label?: string;
  className?: string;
  variant?: "primary" | "ghost";
  eventName?: string;
};

export function ExportPdfButton({
  buildPayload,
  label = "Export PDF",
  className,
  variant = "ghost",
  eventName = "pdf_export",
}: Props) {
  const { canUse, premium } = usePremium();
  const { demoMode } = useDemoMode();
  const allowed = canUse("pdf_export") || demoMode;
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (!allowed) return;
    setExporting(true);
    try {
      const result = await fetchPdfReportHtml(buildPayload(), { premium: !!premium, demoMode });
      if ("error" in result) {
        toast.error(result.error.message);
        return;
      }
      if (openPdfPrintWindow(result.html)) {
        toast.success("Report ready — save as PDF from the print dialog");
        trackEvent(eventName);
      } else {
        toast.error("Allow pop-ups to export PDF");
      }
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) {
    return (
      <div className={cn("space-y-2", className)}>
        <GhostButton type="button" disabled className="gap-2 opacity-60">
          <FileDown className="h-4 w-4" />
          {label}
        </GhostButton>
        <UpgradePrompt feature="pdf_export" title="PDF reports" description="Upgrade for polished monthly and yearly exports." />
      </div>
    );
  }

  const Btn = variant === "primary" ? PrimaryButton : GhostButton;

  return (
    <Btn
      type="button"
      className={cn("gap-2", className)}
      onClick={() => void exportPdf()}
      disabled={exporting}
    >
      <FileDown className="h-4 w-4" />
      {exporting ? "Generating…" : label}
    </Btn>
  );
}
