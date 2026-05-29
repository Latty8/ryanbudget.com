"use client";

import { Toaster } from "sonner";
import { useFintechTheme } from "@/components/fintech/theme";

export function ToastProvider() {
  const { theme } = useFintechTheme();
  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border text-sm shadow-lg",
        },
      }}
    />
  );
}
