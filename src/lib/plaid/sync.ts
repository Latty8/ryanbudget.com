import type { AccountBase, RemovedTransaction, Transaction } from "plaid";
import { getPlaidClient } from "@/lib/plaid/config";
import {
  listPlaidItems,
  updatePlaidItemCursor,
  type StoredPlaidItem,
} from "@/lib/plaid/persistence";
import { plaidTransactionToImport } from "@/lib/plaid/normalize";
import { suggestCategoryId } from "@/lib/plaid/categorize";
import type { Category } from "@/lib/types";
import type { LinkedBankAccount, PlaidSyncResult } from "@/lib/plaid/types";

function mapAccount(
  item: StoredPlaidItem,
  account: AccountBase
): LinkedBankAccount {
  const balances = account.balances;
  return {
    id: `${item.id}:${account.account_id}`,
    itemId: item.id,
    plaidAccountId: account.account_id,
    name: account.name,
    officialName: account.official_name ?? null,
    mask: account.mask ?? null,
    type: account.type ?? "other",
    subtype: account.subtype ?? null,
    institutionName: item.institutionName,
    currentBalance:
      balances?.current != null ? balances.current : balances?.available ?? null,
  };
}

async function fetchAccountsForItem(
  item: StoredPlaidItem
): Promise<LinkedBankAccount[]> {
  const client = getPlaidClient();
  const res = await client.accountsGet({ access_token: item.accessToken });
  return res.data.accounts.map((a) => mapAccount(item, a));
}

async function syncItemTransactions(
  item: StoredPlaidItem
): Promise<{
  added: Transaction[];
  modified: Transaction[];
  removed: RemovedTransaction[];
}> {
  const client = getPlaidClient();
  let cursor = item.cursor ?? undefined;
  const added: Transaction[] = [];
  const modified: Transaction[] = [];
  const removed: RemovedTransaction[] = [];

  let hasMore = true;
  while (hasMore) {
    const res = await client.transactionsSync({
      access_token: item.accessToken,
      cursor,
    });
    added.push(...res.data.added);
    modified.push(...res.data.modified);
    removed.push(...res.data.removed);
    cursor = res.data.next_cursor;
    hasMore = res.data.has_more;
  }

  await updatePlaidItemCursor(item.id, cursor ?? null);

  return { added, modified, removed };
}

export async function syncAllPlaidItems(
  categories: Category[]
): Promise<PlaidSyncResult> {
  const items = await listPlaidItems();
  const accounts: LinkedBankAccount[] = [];
  const imported: PlaidSyncResult["imported"] = [];
  const removedExternalIds: string[] = [];

  for (const item of items) {
    accounts.push(...(await fetchAccountsForItem(item)));

    const { added, modified, removed } = await syncItemTransactions(item);

    for (const id of removed) {
      if (id.transaction_id) removedExternalIds.push(id.transaction_id);
    }

    const plaidTxs = [...added, ...modified];
    for (const tx of plaidTxs) {
      const base = plaidTransactionToImport(tx);
      imported.push({
        ...base,
        suggestedCategoryId: suggestCategoryId(
          categories,
          base.type,
          base.description,
          base.plaidCategoryPrimary
        ),
      });
    }
  }

  return { accounts, imported, removedExternalIds };
}

export async function listLinkedAccounts(): Promise<LinkedBankAccount[]> {
  const items = await listPlaidItems();
  const accounts: LinkedBankAccount[] = [];
  for (const item of items) {
    try {
      accounts.push(...(await fetchAccountsForItem(item)));
    } catch {
      // Item may need re-link
    }
  }
  return accounts;
}
