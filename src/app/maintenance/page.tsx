import { ShellCard } from "@/components/fintech/ui";

export const metadata = {
  title: "Maintenance | Paycheck Planner",
  robots: { index: false },
};

export default function MaintenancePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center p-6">
      <ShellCard className="w-full text-center">
        <h1 className="text-xl font-semibold">We&apos;ll be right back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Paycheck Planner is undergoing scheduled maintenance. Your data is safe — try again in a few minutes.
        </p>
      </ShellCard>
    </div>
  );
}
