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
import { toast } from "sonner";
import { ConfirmDialog, type ConfirmDialogProps } from "@/components/ui/confirm-dialog";

export type ConfirmRequest = Omit<ConfirmDialogProps, "open" | "onOpenChange" | "loading" | "onConfirm"> & {
  onConfirm: () => void | Promise<void>;
};

type ConfirmDialogContextValue = {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

function ConfirmDialogHost({
  state,
  loading,
  onClose,
  onConfirm,
}: {
  state: ConfirmRequest;
  loading: boolean;
  onClose: (result: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open && !loading) onClose(false);
      }}
      title={state.title}
      description={state.description}
      warning={state.warning}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      loading={loading}
      children={state.children}
      onConfirm={onConfirm}
    />
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const openRef = useRef(false);

  const confirm = useCallback((request: ConfirmRequest) => {
    if (openRef.current) {
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      openRef.current = true;
      resolverRef.current = resolve;
      setState(request);
    });
  }, []);

  const close = useCallback((result: boolean) => {
    openRef.current = false;
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {state ? (
        <ConfirmDialogHost
          state={state}
          loading={loading}
          onClose={close}
          onConfirm={async () => {
            setLoading(true);
            try {
              await state.onConfirm();
              close(true);
            } catch (error) {
              const message = error instanceof Error ? error.message : "Something went wrong";
              toast.error(message);
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
