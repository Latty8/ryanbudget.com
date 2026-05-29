"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { GhostButton } from "@/components/fintech/ui";
import { usePremium } from "@/hooks/use-premium";
import { useDemoMode } from "@/hooks/use-demo-mode";

type ShareReportActionsProps = {
  reportTitle: string;
  ownerName: string;
  onExportPdf: () => Promise<string | null>;
};

export function ShareReportActions({ reportTitle, ownerName, onExportPdf }: ShareReportActionsProps) {
  const { canUse, premium } = usePremium();
  const { demoMode } = useDemoMode();
  const [sharing, setSharing] = useState(false);

  const shareReportLink = async () => {
    if (!canUse("pdf_export") && !demoMode) {
      toast.message("Premium required", { description: "Upgrade to share branded reports." });
      return;
    }
    setSharing(true);
    try {
      const html = await onExportPdf();
      if (!html) throw new Error("Could not build report");
      const res = await fetch("/api/share/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportTitle,
          ownerLabel: ownerName,
          html,
        }),
      });
      const data = (await res.json()) as { shareUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Share failed");
      const full = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(full);
      toast.success("Report link copied — view-only for 30 days");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share report");
    } finally {
      setSharing(false);
    }
  };

  return (
    <GhostButton disabled={sharing} onClick={() => void shareReportLink()}>
      <Link2 className="mr-1 inline h-4 w-4" />
      {sharing ? "Sharing…" : "Share report link"}
    </GhostButton>
  );
}
