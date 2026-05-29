import Link from "next/link";
import { articles } from "@/lib/content/articles";

export const metadata = {
  title: "Resources — Bi-weekly budgeting guides",
  description: "Articles and guides for paycheck-based budgeting, safe-to-spend, and household finances.",
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-sky-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-2 text-slate-400">
          Practical guides for bi-weekly pay, safe-to-spend, and calm household budgeting.
        </p>
        <ul className="mt-8 space-y-4">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/resources/${article.slug}`}
                className="block rounded-2xl border border-slate-700 bg-neutral-900/80 p-5 transition hover:border-sky-500/50"
              >
                <p className="text-lg font-medium">{article.title}</p>
                <p className="mt-1 text-sm text-slate-400">{article.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {article.readingMinutes} min read · {article.publishedAt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
