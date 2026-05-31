import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb/connect";
import { AccountModel } from "@/lib/mongodb/models/Account";
import { CategoryModel } from "@/lib/mongodb/models/Category";
import { GoalModel } from "@/lib/mongodb/models/Goal";
import { RecurringTransactionModel } from "@/lib/mongodb/models/RecurringTransaction";
import { TransactionModel } from "@/lib/mongodb/models/Transaction";
import { UserModel } from "@/lib/mongodb/models/User";
import { buildRemoteState } from "@/lib/mongodb/mappers";
import type { RemoteAppState } from "@/lib/supabase/sync/types";
import type { AppPreferences } from "@/types/app-settings";

export async function findUserById(userId: string) {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return null;
  return UserModel.findById(userId).lean();
}

export async function upsertOAuthUser(input: {
  email: string;
  name: string;
  image?: string | null;
  googleId?: string | null;
  appleId?: string | null;
}) {
  await connectMongo();
  const email = input.email.trim().toLowerCase();

  const update: Record<string, unknown> = {
    name: input.name || email.split("@")[0],
    image: input.image ?? null,
  };
  if (input.googleId) update.googleId = input.googleId;
  if (input.appleId) update.appleId = input.appleId;

  const user = await UserModel.findOneAndUpdate(
    { email },
    { $set: update, $setOnInsert: { email } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return user;
}

export async function pullMongoState(
  userId: string,
  fallback?: { email: string; name: string }
): Promise<RemoteAppState | null> {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return null;

  const objectId = new mongoose.Types.ObjectId(userId);

  const [user, accounts, categories, transactions, recurring, goals] = await Promise.all([
    UserModel.findById(objectId).lean(),
    AccountModel.find({ userId: objectId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    CategoryModel.find({ userId: objectId }).sort({ createdAt: 1 }).lean(),
    TransactionModel.find({ userId: objectId }).sort({ transactionDate: -1 }).lean(),
    RecurringTransactionModel.find({ userId: objectId }).sort({ createdAt: 1 }).lean(),
    GoalModel.find({ userId: objectId }).sort({ createdAt: 1 }).lean(),
  ]);

  if (!user && !fallback) return null;

  return buildRemoteState({
    email: user?.email ?? fallback?.email ?? "",
    name: user?.name ?? fallback?.name ?? "",
    onboardingCompleted: user?.onboardingCompleted ?? false,
    preferences: (user?.preferences ?? {}) as AppPreferences,
    accounts,
    categories,
    transactions,
    recurring,
    goals,
  });
}

async function replaceUserCollection(
  model: mongoose.Model<unknown>,
  userId: mongoose.Types.ObjectId,
  clientIds: string[],
  upsertRows: Record<string, unknown>[]
): Promise<boolean> {
  const del = await model.deleteMany({ userId, clientId: { $nin: clientIds } });
  if (!del.acknowledged) return false;

  for (const row of upsertRows) {
    const result = await model.updateOne(
      { userId, clientId: row.clientId },
      { $set: row },
      { upsert: true }
    );
    if (!result.acknowledged) return false;
  }

  return true;
}

export async function pushMongoState(userId: string, state: RemoteAppState): Promise<boolean> {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return false;

  const objectId = new mongoose.Types.ObjectId(userId);

  const profileUpdate = await UserModel.updateOne(
    { _id: objectId },
    {
      $set: {
        email: state.profile.email.trim().toLowerCase(),
        name: state.profile.name,
        preferences: state.preferences,
        onboardingCompleted: state.onboardingCompleted,
      },
    }
  );
  if (profileUpdate.matchedCount === 0) return false;

  const accountRows = state.accounts.map((account, index) => ({
    userId: objectId,
    clientId: account.id,
    name: account.name,
    kind: account.kind,
    balance: account.balance,
    color: account.color,
    icon: account.icon,
    currency: account.currency ?? "USD",
    hidden: account.hidden ?? false,
    sortOrder: index,
  }));

  const accountsOk = await replaceUserCollection(
    AccountModel as mongoose.Model<unknown>,
    objectId,
    state.accounts.map((a) => a.id),
    accountRows
  );
  if (!accountsOk) return false;

  const categoryRows = state.categories.map((category) => ({
    userId: objectId,
    clientId: category.id,
    name: category.name,
    group: category.group,
    icon: category.icon,
    color: category.color,
    budgeted: category.budgeted,
    budgetBehavior: category.budgetBehavior ?? "fixed",
  }));

  const categoriesOk = await replaceUserCollection(
    CategoryModel as mongoose.Model<unknown>,
    objectId,
    state.categories.map((c) => c.id),
    categoryRows
  );
  if (!categoriesOk) return false;

  const transactionRows = state.transactions.map((tx) => ({
    userId: objectId,
    clientId: tx.id,
    merchant: tx.merchant,
    amount: tx.amount,
    transactionDate: tx.date,
    accountName: tx.account,
    categoryName: tx.category,
    recurring: tx.recurring ?? false,
    currency: tx.currency ?? "USD",
  }));

  const txOk = await replaceUserCollection(
    TransactionModel as mongoose.Model<unknown>,
    objectId,
    state.transactions.map((t) => t.id),
    transactionRows
  );
  if (!txOk) return false;

  const recurringRows = state.recurring.map((rule) => ({
    userId: objectId,
    clientId: rule.id,
    name: rule.name,
    amount: rule.amount,
    cadence: rule.cadence,
    nextRunDate: rule.nextDate,
    paused: rule.paused ?? false,
  }));

  const recurringOk = await replaceUserCollection(
    RecurringTransactionModel as mongoose.Model<unknown>,
    objectId,
    state.recurring.map((r) => r.id),
    recurringRows
  );
  if (!recurringOk) return false;

  const goalRows = state.goals.map((goal) => ({
    userId: objectId,
    clientId: goal.id,
    name: goal.name,
    targetAmount: goal.target,
    currentAmount: goal.current,
    targetDate: goal.targetDate ?? "",
    icon: goal.icon,
    color: goal.color,
  }));

  return replaceUserCollection(
    GoalModel as mongoose.Model<unknown>,
    objectId,
    state.goals.map((g) => g.id),
    goalRows
  );
}

export async function setMongoOnboardingCompleted(userId: string, completed: boolean): Promise<boolean> {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return false;
  const result = await UserModel.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { onboardingCompleted: completed } }
  );
  return result.matchedCount > 0;
}

export async function getMongoOnboardingCompleted(userId: string): Promise<boolean | null> {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return null;
  const user = await UserModel.findById(userId).select("onboardingCompleted").lean();
  return user?.onboardingCompleted ?? false;
}

export async function ensureMongoUserProfile(
  userId: string,
  email: string,
  name: string
): Promise<boolean> {
  await connectMongo();
  if (!mongoose.isValidObjectId(userId)) return false;
  const result = await UserModel.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { email: email.trim().toLowerCase(), name } },
    { upsert: true }
  );
  return result.acknowledged;
}
