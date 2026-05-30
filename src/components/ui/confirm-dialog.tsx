"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { DialogPortal } from "@/components/ui/dialog-portal";
import { GhostButton, fintechModalPanel, fintechForeground, fintechMuted } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warning,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogPortal open={open} layer="confirm">
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="absolute inset-0 z-0 cursor-default bg-[var(--overlay)]"
        disabled={loading}
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className={cn(
          fintechModalPanel,
          "relative z-10 mx-auto w-full max-w-md p-6 shadow-[var(--shadow-modal)]",
          "pointer-events-auto"
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "shrink-0 rounded-xl p-2",
              variant === "destructive"
                ? "bg-rose-500/15 text-rose-400"
                : "bg-[var(--accent-muted)] text-[var(--accent)]"
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className={cn("text-lg font-semibold", fintechForeground)}>
              {title}
            </h2>
            <p id="confirm-dialog-description" className={cn("mt-2 text-sm leading-relaxed", fintechMuted)}>
              {description}
            </p>
            {warning ? (
              <p
                className={cn(
                  "mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-100"
                )}
              >
                {warning}
              </p>
            ) : null}
            {children ? <div className="mt-4">{children}</div> : null}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <GhostButton type="button" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </GhostButton>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={cn(
              "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-[var(--radius-field)] px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50",
              variant === "destructive"
                ? "bg-rose-600 text-white hover:bg-rose-500"
                : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </DialogPortal>
  );
}
