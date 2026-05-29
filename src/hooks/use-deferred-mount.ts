"use client";

import { useEffect, useState } from "react";

/** Defer non-critical work until the browser is idle (or after a timeout). */
export function useDeferredMount(timeoutMs = 2000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => setReady(true), { timeout: timeoutMs });
      return () => window.cancelIdleCallback(id);
    }

    const id = setTimeout(() => setReady(true), timeoutMs);
    return () => clearTimeout(id);
  }, [timeoutMs]);

  return ready;
}
