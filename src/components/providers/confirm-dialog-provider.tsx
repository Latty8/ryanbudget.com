"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog, type ConfirmDialogProps } from "@/components/ui/confirm-dialog";

export type ConfirmRequest = Omit<ConfirmDialogProps, "open" | "onOpenChange" | "loading" | "onConfirm"> & {
  onConfirm: () => void | Promise<void>;
};

type ConfirmDialogContextValue = {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmRequest & { open: boolean }) | null>(null);
  const [loading, setLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((request: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...request, open: true });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState((prev) => (prev ? { ...prev, open: false } : null));
    resolverRef.current?.(result);
    resolverRef.current = null;
    window.setTimeout(() => setState(null), 200);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {state ? (
        <ConfirmDialog
          open={state.open}
          onOpenChange={(open) => {
            if (!open && !loading) close(false);
          }}
          title={state.title}
          description={state.description}
          warning={state.warning}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          variant={state.variant}
          loading={loading}
          children={state.children}
          onConfirm={async () => {
            setLoading(true);
            try {
              await state.onConfirm();
              close(true);
            } catch {
              close(false);
            } finally {
              setLoading(false);
            }
          }}
        />
      ) : null}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context.confirm;
}
