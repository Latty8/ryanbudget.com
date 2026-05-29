import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";

export function plaidConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim()
  );
}

export function getPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) {
    throw new Error("Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET.");
  }

  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
        },
      },
    })
  );
}

export function plaidInstitutionIds(): string[] | undefined {
  const raw = process.env.PLAID_INSTITUTION_IDS?.trim();
  if (!raw) return undefined;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}
