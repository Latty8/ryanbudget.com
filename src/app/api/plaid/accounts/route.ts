import { NextResponse } from "next/server";
import { plaidConfigured } from "@/lib/plaid/config";
import { listPlaidItems } from "@/lib/plaid/persistence";
import { listLinkedAccounts } from "@/lib/plaid/sync";

export async function GET() {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const items = await listPlaidItems();
    const accounts = await listLinkedAccounts();
    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        institutionName: i.institutionName,
        createdAt: i.createdAt,
      })),
      accounts,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
