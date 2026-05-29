import Link from "next/link";

const entries = [
  { date: "May 2026", title: "Launch prep", items: ["Stripe subscriptions", "Household sharing", "Marketing homepage", "Enhanced reports"] },
  { date: "Apr 2026", title: "AI & PWA", items: ["AI insights panel", "PWA install", "Template gallery", "Swipe to delete transactions"] },
  { date: "Mar 2026", title: "Core app", items: ["Bi-weekly recurring", "Onboarding flow", "Settings & export"] },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-sky-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Changelog</h1>
        <p className="mt-2 text-slate-400">What&apos;s new in Paycheck Planner.</p>
        <div className="mt-8 space-y-6">
          {entries.map((entry) => (
            <article key={entry.date} className="rounded-2xl border border-slate-700 bg-neutral-900 p-5">
              <p className="text-xs uppercase tracking-wide text-sky-400">{entry.date}</p>
              <h2 className="mt-1 text-lg font-medium">{entry.title}</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-300">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Feature requests: use the in-app Feedback button or email feedback@paycheckplanner.app
        </p>
      </div>
    </div>
  );
}
