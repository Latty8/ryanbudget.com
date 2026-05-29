import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-neutral-950 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-semibold text-white">Paycheck Planner</p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Calm money planning for bi-weekly pay, real bills, and goals that stick.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/templates" className="hover:text-sky-400">
                Templates
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-sky-400">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/changelog" className="hover:text-sky-400">
                Changelog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/help" className="hover:text-sky-400">
                Help center
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-sky-400">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-sky-400">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-center text-xs text-slate-500">
        Made with ❤️ for real-life budgets
      </p>
      <p className="mx-auto mt-2 max-w-6xl px-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Paycheck Planner
      </p>
    </footer>
  );
}
