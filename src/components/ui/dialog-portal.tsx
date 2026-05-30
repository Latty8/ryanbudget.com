"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const MODAL_ROOT_ATTR = "data-modal-root";
export const MODAL_HOST_ID = "modal-root";

const LAYER_Z: Record<"modal" | "confirm", string> = {
  modal: "z-[10000]",
  confirm: "z-[10001]",
};

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** True after hydration — avoids SSR mismatch and the one-frame `mounted` flash. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function getModalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(MODAL_HOST_ID) ?? document.body;
}

type DialogPortalProps = {
  open: boolean;
  children: React.ReactNode;
  /** confirm dialogs stack above standard modals */
  layer?: "modal" | "confirm";
};

/**
 * Renders children at document root (shadcn DialogPortal equivalent).
 * Centers content with a full-viewport flex host and locks body scroll while open.
 */
export function DialogPortal({ open, children, layer = "modal" }: DialogPortalProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!isClient || !open) return null;

  const host = getModalHost();
  if (!host) return null;

  return createPortal(
    <div
      {...{ [MODAL_ROOT_ATTR]: "" }}
      className={`fixed inset-0 ${LAYER_Z[layer]} isolate flex items-center justify-center p-4 sm:p-6`}
      style={{ pointerEvents: "auto" }}
    >
      {children}
    </div>,
    host
  );
}
