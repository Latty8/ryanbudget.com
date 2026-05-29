import Link from "next/link";
import { ShellCard } from "@/components/fintech/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center p-6">
      <ShellCard className="w-full text-center">
        <p className="text-6xl font-semibold text-sky-400">404</p>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          This route doesn&apos;t exist. Head back to your dashboard to keep planning.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950"
          >
            Dashboard
          </Link>
          <Link
            href="/help"
            className="inline-flex rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
          >
            Help
          </Link>
        </div>
      </ShellCard>
    </div>
  );
}
