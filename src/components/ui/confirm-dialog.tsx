"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { GhostButton, ShellCard } from "@/components/fintech/ui";
import { useShellTheme } from "@/components/fintech/ui";
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
  const { isLight } = useShellTheme();

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
          <motion.button
            type="button"
            aria-label="Close dialog backdrop"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onOpenChange(false)}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-md"
          >
            <ShellCard className="shadow-2xl">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-xl p-2",
                    variant === "destructive"
                      ? "bg-rose-500/15 text-rose-400"
                      : isLight
                        ? "bg-sky-100 text-sky-600"
                        : "bg-sky-500/15 text-sky-300"
                  )}
                >
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="confirm-dialog-title" className="text-lg font-semibold">
                    {title}
                  </h2>
                  <p
                    id="confirm-dialog-description"
                    className={cn("mt-2 text-sm", isLight ? "text-slate-600" : "text-slate-300")}
                  >
                    {description}
                  </p>
                  {warning ? (
                    <p
                      className={cn(
                        "mt-3 rounded-xl border px-3 py-2 text-xs",
                        isLight
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-100"
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
                  onClick={() => void handleConfirm()}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50",
                    variant === "destructive"
                      ? "bg-rose-600 text-white hover:bg-rose-500"
                      : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                  )}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {confirmLabel}
                </button>
              </div>
            </ShellCard>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
