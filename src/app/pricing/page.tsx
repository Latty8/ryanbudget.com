import { PricingTable } from "@/components/billing/pricing-table";
import Link from "next/link";

export const metadata = {
  title: "Pricing",
  description: "Free and Premium plans for paycheck-first budgeting.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-sky-400 hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-slate-400">Choose the plan that fits your household.</p>
        <div className="mt-8">
          <PricingTable />
        </div>
      </div>
    </div>
  );
}
