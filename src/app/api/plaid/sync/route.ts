import { NextResponse } from "next/server";
import { plaidConfigured } from "@/lib/plaid/config";
import { syncAllPlaidItems } from "@/lib/plaid/sync";
import type { Category } from "@/lib/types";

export async function POST(req: Request) {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured on the server." },
      { status: 503 }
    );
  }

  let categories: Category[] = [];
  try {
    const body = (await req.json()) as { categories?: Category[] };
    categories = Array.isArray(body.categories) ? body.categories : [];
  } catch {
    categories = [];
  }

  try {
    const result = await syncAllPlaidItems(categories);
    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to sync transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
