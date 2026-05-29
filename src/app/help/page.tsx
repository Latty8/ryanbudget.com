import { MarketingShell } from "@/components/marketing/marketing-shell";
import { HelpView } from "@/components/fintech/help-view";

export const metadata = {
  title: "Help & Guides | Paycheck Planner",
  description: "Learn bi-weekly budgeting, recurring setup, templates, and household sharing.",
};

export default function HelpPage() {
  return (
    <MarketingShell showDemoCta>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">Help center</h1>
        <p className="mt-2 text-slate-400">Guides that match how you actually get paid.</p>
      </div>
      <HelpView embedded />
    </MarketingShell>
  );
}
