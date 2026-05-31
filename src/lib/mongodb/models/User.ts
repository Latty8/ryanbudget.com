import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { AppPreferences } from "@/types/app-settings";

const defaultPreferences: AppPreferences = {
  currency: "USD",
  dateFormat: "MDY",
  weekStart: "sunday",
  budgetPeriod: "bi-weekly",
  locale: "en",
};

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    passwordHash: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    preferences: { type: Schema.Types.Mixed, default: () => ({ ...defaultPreferences }) },
    subscriptionTier: { type: String, enum: ["free", "premium"], default: "free" },
    subscriptionStatus: { type: String, default: "none" },
    subscriptionPeriodEnd: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
  },
  { timestamps: true }
);

export type MongoUserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel: Model<MongoUserDoc> =
  (mongoose.models.User as Model<MongoUserDoc> | undefined) ??
  mongoose.model<MongoUserDoc>("User", UserSchema);
