import { CountryCode, Products } from "plaid";
import { NextResponse } from "next/server";
import { getPlaidClient, plaidConfigured, plaidInstitutionIds } from "@/lib/plaid/config";

export async function POST() {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const client = getPlaidClient();
    const institutionIds = plaidInstitutionIds();
    const res = await client.linkTokenCreate({
      user: { client_user_id: "ryanbudget-user" },
      client_name: "Ryan Budget",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      ...(institutionIds ? { institution_id: institutionIds[0] } : {}),
    });

    return NextResponse.json({ linkToken: res.data.link_token });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create link token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
