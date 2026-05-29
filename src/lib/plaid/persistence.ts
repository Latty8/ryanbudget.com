import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export interface StoredPlaidItem {
  id: string;
  accessToken: string;
  institutionId: string | null;
  institutionName: string | null;
  /** Plaid transactions/sync cursor */
  cursor: string | null;
  createdAt: string;
}

interface PlaidPersistenceFile {
  items: StoredPlaidItem[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "plaid.json");

async function ensureStore(): Promise<PlaidPersistenceFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as PlaidPersistenceFile;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

async function writeStore(data: PlaidPersistenceFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function listPlaidItems(): Promise<StoredPlaidItem[]> {
  const store = await ensureStore();
  return store.items;
}

export async function getPlaidItem(id: string): Promise<StoredPlaidItem | null> {
  const store = await ensureStore();
  return store.items.find((i) => i.id === id) ?? null;
}

export async function addPlaidItem(input: {
  accessToken: string;
  institutionId: string | null;
  institutionName: string | null;
}): Promise<StoredPlaidItem> {
  const store = await ensureStore();
  const item: StoredPlaidItem = {
    id: nanoid(),
    accessToken: input.accessToken,
    institutionId: input.institutionId,
    institutionName: input.institutionName,
    cursor: null,
    createdAt: new Date().toISOString(),
  };
  store.items.push(item);
  await writeStore(store);
  return item;
}

export async function updatePlaidItemCursor(
  id: string,
  cursor: string | null
): Promise<void> {
  const store = await ensureStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return;
  item.cursor = cursor;
  await writeStore(store);
}

export async function removePlaidItem(id: string): Promise<boolean> {
  const store = await ensureStore();
  const next = store.items.filter((i) => i.id !== id);
  if (next.length === store.items.length) return false;
  await writeStore({ items: next });
  return true;
}
