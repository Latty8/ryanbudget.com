import { CountryCode } from "plaid";
import { NextResponse } from "next/server";
import { getPlaidClient, plaidConfigured } from "@/lib/plaid/config";
import { addPlaidItem } from "@/lib/plaid/persistence";
import { listLinkedAccounts } from "@/lib/plaid/sync";

export async function POST(req: Request) {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured on the server." },
      { status: 503 }
    );
  }

  let publicToken: string;
  try {
    const body = (await req.json()) as { public_token?: string };
    if (!body.public_token?.trim()) {
      return NextResponse.json(
        { error: "public_token is required" },
        { status: 400 }
      );
    }
    publicToken = body.public_token.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const client = getPlaidClient();
    const exchange = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    let institutionName: string | null = null;
    let institutionId: string | null = null;
    try {
      const itemRes = await client.itemGet({ access_token: accessToken });
      institutionId = itemRes.data.item.institution_id ?? null;
      if (institutionId) {
        const inst = await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = inst.data.institution.name;
      }
    } catch {
      institutionName = null;
    }

    const stored = await addPlaidItem({
      accessToken,
      institutionId,
      institutionName,
    });

    const accounts = await listLinkedAccounts();

    return NextResponse.json({
      item: {
        id: stored.id,
        institutionName: stored.institutionName,
        plaidItemId: itemId,
      },
      accounts,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to link bank account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
