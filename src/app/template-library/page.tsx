import { Suspense } from "react";
import { TemplateLibraryView } from "@/components/fintech/template-library-view";

export default function TemplateLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="page-enter px-4 py-10 text-sm text-[var(--muted)]">Loading templates…</div>
      }
    >
      <TemplateLibraryView />
    </Suspense>
  );
}
