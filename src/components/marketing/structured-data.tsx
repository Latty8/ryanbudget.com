const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paycheckplanner.app";

export function MarketingStructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Paycheck Planner",
        url: siteUrl,
        description: "Bi-weekly paycheck budgeting with safe-to-spend, recurring bills, and AI insights.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/resources?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Paycheck Planner",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "128",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
