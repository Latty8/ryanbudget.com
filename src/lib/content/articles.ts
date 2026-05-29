export type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  tags: string[];
};

export const articles: Article[] = [
  {
    slug: "budget-on-bi-weekly-paychecks",
    title: "How to Budget on Bi-Weekly Paychecks",
    description:
      "A practical guide to aligning monthly bills, weekly groceries, and savings with real pay dates — not calendar months.",
    publishedAt: "2026-05-01",
    readingMinutes: 8,
    tags: ["bi-weekly", "paycheck", "beginner"],
  },
  {
    slug: "safe-to-spend-explained",
    title: "What Is Safe to Spend (and Why It Beats a Spreadsheet)",
    description:
      "Learn how safe-to-spend helps you avoid overdrafts between paychecks while still funding goals and recurring bills.",
    publishedAt: "2026-05-10",
    readingMinutes: 6,
    tags: ["safe-to-spend", "dashboard"],
  },
  {
    slug: "household-budgeting-with-a-partner",
    title: "Household Budgeting: Owner, Editor, and Viewer Roles",
    description:
      "Share a budget with a partner using clear permissions — who can edit, who can view, and how to stay aligned.",
    publishedAt: "2026-05-20",
    readingMinutes: 7,
    tags: ["household", "premium"],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
