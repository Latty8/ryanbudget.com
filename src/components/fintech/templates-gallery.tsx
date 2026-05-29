"use client";

import { PublicTemplatesGallery } from "@/components/marketing/public-templates-gallery";
import { PageFrame } from "@/components/fintech/ui";

/** In-app route — same gallery with app chrome from layout shell. */
export function TemplatesGallery() {
  return (
    <PageFrame title="Template gallery">
      <div className="-mt-2 rounded-2xl border border-slate-700/50 bg-neutral-950/50 p-4">
        <PublicTemplatesGallery />
      </div>
    </PageFrame>
  );
}
