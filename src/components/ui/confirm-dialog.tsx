"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onOpenChange]);

  if (!open) return null;

  return (
    <DialogPortal open={open} layer="confirm">
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="absolute inset-0 z-0 cursor-default bg-[var(--overlay)]/80 backdrop-blur-[2px]"
        disabled={loading}
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          fintechModalPanel,
          "relative z-10 mx-auto w-[min(100%,26rem)] max-h-[min(85dvh,32rem)] overflow-y-auto p-5 shadow-[var(--shadow-modal)] sm:p-6"
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "shrink-0 rounded-lg p-1.5",
              variant === "destructive"
                ? "bg-rose-500/15 text-rose-400"
                : "bg-[var(--accent-muted)] text-[var(--accent)]"
            )}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className={cn("text-base font-semibold leading-snug", fintechForeground)}>
              {title}
            </h2>
            <p id="confirm-dialog-description" className={cn("mt-1.5 text-sm leading-relaxed", fintechMuted)}>
              {description}
            </p>
            {warning ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-100">
                {warning}
              </p>
            ) : null}
            {children ? <div className="mt-3">{children}</div> : null}
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 pb-safe sm:flex-row sm:flex-wrap sm:justify-end">
          <GhostButton type="button" disabled={loading} onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {cancelLabel}
          </GhostButton>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-field)] px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 sm:w-auto",
              variant === "destructive"
                ? "bg-rose-600 text-white hover:bg-rose-500"
                : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-105"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </DialogPortal>
  );
}
