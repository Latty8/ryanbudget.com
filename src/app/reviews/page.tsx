import { redirect } from "next/navigation";

export default function ReviewsRedirectPage() {
  redirect("/insights?tab=reviews");
}
