import { redirect } from "next/navigation";

export default function ReportsRedirectPage() {
  redirect("/insights?tab=reports");
}
