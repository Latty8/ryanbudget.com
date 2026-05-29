import { LandingPage } from "@/components/marketing/landing-page";
import { MarketingStructuredData } from "@/components/marketing/structured-data";

export const metadata = {
  title: "Paycheck Planner — Better than Google Sheets for real-life budgeting",
  description:
    "Bi-weekly paycheck budgeting with safe-to-spend, recurring bills, AI insights, and household sharing. Try the demo free.",
  openGraph: {
    title: "Paycheck Planner",
    description: "Better than Google Sheets for real-life budgeting.",
  },
};

export default function HomePage() {
  return (
    <>
      <MarketingStructuredData />
      <LandingPage />
    </>
  );
}
