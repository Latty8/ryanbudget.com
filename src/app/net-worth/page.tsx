import { redirect } from "next/navigation";

export default function NetWorthRedirectPage() {
  redirect("/insights?tab=net-worth");
}
