"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function FeedbackButton() {
  return (
    <button
      type="button"
      className="fixed bottom-24 right-4 z-30 inline-flex h-11 items-center gap-2 rounded-full border border-slate-600 bg-neutral-900 px-4 text-sm text-slate-200 shadow-lg md:bottom-6"
      aria-label="Send feedback"
      onClick={() => {
        const subject = encodeURIComponent("Paycheck Planner feedback");
        const body = encodeURIComponent("I'd like to share feedback about:\n\n");
        window.location.href = `mailto:feedback@paycheckplanner.app?subject=${subject}&body=${body}`;
        toast.message("Opening your email app…");
      }}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      Feedback
    </button>
  );
}
