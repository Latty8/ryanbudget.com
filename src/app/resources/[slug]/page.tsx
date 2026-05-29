import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, articles } from "@/lib/content/articles";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.description,
    openGraph: { title: article.title, description: article.description },
  };
}

const articleBodies: Record<string, string[]> = {
  "budget-on-bi-weekly-paychecks": [
    "Most budgeting apps assume you get paid once a month. If you're paid every two weeks, that mismatch creates phantom money in the 'extra' paycheck months and stress in the tight ones.",
    "Start by listing your next three paycheck dates and every bill due before each one. Assign monthly bills to the paycheck that lands closest before the due date.",
    "Use a safe-to-spend number that subtracts committed bills and category targets from your checking balance — not your full account balance.",
    "Paycheck Planner is built for this rhythm: bi-weekly income rules, bill projections, and a dashboard that answers 'what can I spend today?'",
  ],
  "safe-to-spend-explained": [
    "Safe-to-spend is what's left after bills and budget targets — not your bank balance.",
    "Spreadsheets break because they don't update when you swipe your card. A live safe-to-spend updates as transactions land.",
    "Pair safe-to-spend with recurring rules for rent, subscriptions, and paychecks so projections stay accurate between pay cycles.",
  ],
  "household-budgeting-with-a-partner": [
    "Shared money needs shared visibility — but not everyone needs edit access.",
    "Owner: full control. Editor: can adjust transactions and budgets. Viewer: read-only for transparency.",
    "Use activity logs to see who changed what, and keep big decisions aligned with a weekly money check-in.",
  ],
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const paragraphs = articleBodies[slug] ?? [article.description];

  return (
    <article className="min-h-screen bg-neutral-950 px-4 py-12 text-slate-100">
      <div className="prose prose-invert mx-auto max-w-2xl">
        <Link href="/resources" className="text-sm text-sky-400 no-underline hover:underline">
          ← Resources
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">{article.title}</h1>
        <p className="text-slate-400">{article.description}</p>
        <div className="mt-8 space-y-4 text-slate-300">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <Link
          href="/login"
          className="mt-10 inline-block rounded-xl bg-sky-500 px-4 py-2 font-medium text-slate-950 no-underline"
        >
          Try Paycheck Planner free
        </Link>
      </div>
    </article>
  );
}
