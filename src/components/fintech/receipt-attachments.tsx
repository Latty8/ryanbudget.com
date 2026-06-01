"use client";

import { FileText, Image as ImageIcon, Loader2, ScanLine, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { fintechMuted, fintechSurface, GhostButton } from "@/components/fintech/ui";
import { usePremium } from "@/hooks/use-premium";
import { getReceiptLimits, RECEIPT_ACCEPT } from "@/lib/receipts/limits";
import type { ReceiptScanSuggestion } from "@/lib/receipts/receipt-scan";
import type { TransactionReceipt } from "@/types/receipts";
import { cn } from "@/lib/utils";

type ReceiptAttachmentsProps = {
  receipts: TransactionReceipt[];
  onChange: (receipts: TransactionReceipt[]) => void;
  /** Apply OCR fields to the transaction form */
  onScanSuggestion?: (suggestion: ReceiptScanSuggestion) => void;
  transactionId?: string;
  compact?: boolean;
  /** Auto-run OCR after image upload (premium) */
  autoScan?: boolean;
};

export function ReceiptAttachments({
  receipts,
  onChange,
  onScanSuggestion,
  transactionId = "draft",
  compact = false,
  autoScan = true,
}: ReceiptAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { premium, canUse } = usePremium();
  const limits = getReceiptLimits(premium || canUse("receipt_scanning"));

  const uploadFile = async (file: File) => {
    if (receipts.length >= limits.maxFiles) {
      toast.error(`Maximum ${limits.maxFiles} receipts per transaction`);
      return;
    }
    const totalBytes = receipts.reduce((s, r) => s + r.sizeBytes, 0) + file.size;
    if (totalBytes > limits.maxTotalBytes) {
      toast.error("Total receipt size limit reached");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("transactionId", transactionId);
      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        headers: { "x-premium": premium ? "true" : "false" },
        body: form,
      });
      const data = (await response.json()) as {
        receipt?: TransactionReceipt;
        error?: string;
      };
      if (!response.ok || !data.receipt) {
        throw new Error(data.error ?? "Upload failed");
      }
      const next = [...receipts, data.receipt];
      onChange(next);
      toast.success("Receipt attached");
      if (autoScan && limits.ocr && data.receipt.mimeType.startsWith("image/")) {
        void scanReceipt(data.receipt);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const scanReceipt = async (receipt: TransactionReceipt) => {
    if (!limits.ocr) {
      toast.message("Upgrade for receipt scanning", {
        description: "Premium reads merchant and amount from photos.",
      });
      return;
    }
    setScanning(true);
    try {
      const response = await fetch("/api/receipts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-premium": "true" },
        body: JSON.stringify({
          fileName: receipt.fileName,
          mimeType: receipt.mimeType,
          previewUrl: receipt.previewUrl.startsWith("http") || receipt.previewUrl.startsWith("data:")
            ? receipt.previewUrl
            : undefined,
          storagePath: receipt.storagePath,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        suggestion?: ReceiptScanSuggestion;
      };
      if (!response.ok) throw new Error(data.error ?? data.message ?? "Scan unavailable");
      if (data.suggestion && onScanSuggestion) {
        onScanSuggestion(data.suggestion);
        toast.success(data.message ?? "Receipt scanned — fields updated");
      } else {
        toast.success(data.message ?? "Scan complete");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const removeReceipt = (id: string) => {
    onChange(receipts.filter((r) => r.id !== id));
    toast.success("Receipt removed");
  };

  const scanPlaceholder = () => {
    if (receipts.length === 0) {
      toast.message("Add a receipt first", { description: "Upload a photo, then scan to auto-fill fields." });
      return;
    }
    const image = receipts.find((r) => r.mimeType.startsWith("image/"));
    if (!image) {
      toast.message("Scan works on images", { description: "Upload a JPG or PNG receipt to scan." });
      return;
    }
    if (!limits.ocr) {
      toast.message("Receipt scanning", { description: "Premium OCR coming soon — upgrade to auto-fill from photos." });
      return;
    }
    void scanReceipt(image);
  };

  return (
    <div className={cn(fintechSurface, "p-3", compact && "p-2")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-xs font-medium", fintechMuted)}>Receipts</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={RECEIPT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <GhostButton
            type="button"
            className="min-h-11 min-w-[5.5rem] touch-manipulation text-xs sm:min-h-9"
            disabled={uploading}
            aria-busy={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            ) : (
              <Upload className="mr-1 inline h-3 w-3" />
            )}
            Upload
          </GhostButton>
          <GhostButton
            type="button"
            className="min-h-11 min-w-[5.5rem] touch-manipulation text-xs sm:min-h-9"
            disabled={scanning || uploading}
            onClick={scanPlaceholder}
          >
            {scanning ? (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            ) : (
              <ScanLine className="mr-1 inline h-3 w-3" />
            )}
            Scan receipt
          </GhostButton>
        </div>
      </div>

      {!limits.ocr ? (
        <p className={cn("mt-2 text-[11px]", fintechMuted)}>
          Free: up to {limits.maxFiles} files, {limits.maxFileBytes / 1024 / 1024}MB each.{" "}
          {!premium ? (
            <span className="text-[var(--accent)]">Premium unlocks scanning & higher limits.</span>
          ) : null}
        </p>
      ) : null}

      {receipts.length > 0 ? (
        <ul className={cn("mt-3 grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
          {receipts.map((receipt) => (
            <li
              key={receipt.id}
              className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
            >
              {receipt.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receipt.previewUrl}
                  alt={receipt.fileName}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className={cn("flex aspect-[4/3] flex-col items-center justify-center gap-1 p-2", fintechMuted)}>
                  <FileText className="h-8 w-8" />
                  <span className="line-clamp-2 text-center text-[10px]">{receipt.fileName}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/70 p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {limits.ocr ? (
                  <button
                    type="button"
                    className="flex min-h-9 min-w-9 flex-1 items-center justify-center rounded-lg bg-violet-600/90 px-2 py-2 text-[10px] text-white touch-manipulation"
                    disabled={scanning}
                    onClick={() => void scanReceipt(receipt)}
                  >
                    <ScanLine className="mx-auto h-3 w-3" />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex min-h-9 min-w-9 items-center justify-center rounded-lg bg-rose-600/90 px-2 py-2 text-[10px] text-white touch-manipulation"
                  onClick={() => removeReceipt(receipt.id)}
                  aria-label={`Remove ${receipt.fileName}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-4 text-xs",
            fintechMuted
          )}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          Attach JPG, PNG, or PDF receipts
        </div>
      )}

      {!premium && !canUse("receipt_scanning") ? (
        <div className="mt-3">
          <UpgradePrompt
            compact
            title="Receipt scanning"
            description="Premium: OCR auto-fill from receipt photos"
            feature="receipt_scanning"
          />
        </div>
      ) : null}
    </div>
  );
}
