import { redirect } from "next/navigation";

export default function TransactionTemplatesRedirectPage() {
  redirect("/template-library?tab=transactions");
}
