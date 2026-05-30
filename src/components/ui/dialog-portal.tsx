"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { acquireModalBodyLock, releaseModalBodyLock } from "@/components/ui/modal-body-lock";

export const MODAL_ROOT_ATTR = "data-modal-root";
export const MODAL_HOST_ID = "modal-root";

const LAYER_Z: Record<"modal" | "confirm", string> = {
  modal: "z-[99998]",
  confirm: "z-[99999]",
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
  layer?: "modal" | "confirm";
};

/** Renders at document root — above nav/FAB, centered on desktop and mobile. */
export function DialogPortal({ open, children, layer = "modal" }: DialogPortalProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    acquireModalBodyLock();
    const host = getModalHost();
    if (host?.id === MODAL_HOST_ID) {
      host.removeAttribute("aria-hidden");
      host.removeAttribute("inert");
    }
    return () => {
      releaseModalBodyLock();
      if (host?.id === MODAL_HOST_ID && !host.querySelector(`[${MODAL_ROOT_ATTR}]`)) {
        host.setAttribute("aria-hidden", "true");
      }
    };
  }, [open]);

  if (!isClient || !open) return null;

  const host = getModalHost();
  if (!host) return null;

  return createPortal(
    <div
      {...{ [MODAL_ROOT_ATTR]: "" }}
      data-layer={layer}
      className={`fixed inset-0 ${LAYER_Z[layer]} isolate flex min-h-[100dvh] w-full items-center justify-center overscroll-none ${
        layer === "confirm"
          ? "p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          : "p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:p-6"
      }`}
      style={{ pointerEvents: "auto" }}
    >
      {children}
    </div>,
    host
  );
}
