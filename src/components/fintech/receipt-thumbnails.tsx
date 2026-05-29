"use client";

import { FileText, Paperclip } from "lucide-react";
import type { TransactionReceipt } from "@/types/receipts";

export function ReceiptThumbnails({ receipts }: { receipts?: TransactionReceipt[] }) {
  if (!receipts?.length) return null;

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <Paperclip className="h-3 w-3 text-slate-500" aria-hidden />
      {receipts.slice(0, 3).map((r) =>
        r.mimeType.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={r.id}
            src={r.previewUrl}
            alt=""
            className="h-6 w-6 rounded border border-slate-600 object-cover"
          />
        ) : (
          <span
            key={r.id}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-600 bg-neutral-800"
          >
            <FileText className="h-3 w-3 text-slate-400" />
          </span>
        )
      )}
      {receipts.length > 3 ? (
        <span className="text-[10px] text-slate-500">+{receipts.length - 3}</span>
      ) : null}
    </div>
  );
}
