import { redirect } from "next/navigation";

/** Legacy OAuth callback — social sign-in removed; redirect to email login. */
export default function AuthCallbackPage() {
  redirect("/login");
}
