import { Suspense } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicTemplatesGallery } from "@/components/marketing/public-templates-gallery";

export const metadata = {
  title: "Budget Templates | Paycheck Planner",
  description:
    "Free public budget templates for bi-weekly paychecks, debt snowball, aggressive savings, and household sharing.",
};

export default function TemplatesPage() {
  return (
    <MarketingShell>
      <Suspense fallback={<p className="text-center text-slate-400">Loading templates…</p>}>
        <PublicTemplatesGallery />
      </Suspense>
    </MarketingShell>
  );
}
