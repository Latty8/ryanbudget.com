import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Client-side stable id (matches Zustand AppAccount.id) */
    clientId: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, default: "checking" },
    balance: { type: Number, default: 0 },
    color: { type: String, default: "#38bdf8" },
    icon: { type: String, default: "Wallet" },
    currency: { type: String, default: "USD" },
    hidden: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, clientId: 1 }, { unique: true });

export type MongoAccountDoc = InferSchemaType<typeof AccountSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AccountModel: Model<MongoAccountDoc> =
  (mongoose.models.Account as Model<MongoAccountDoc> | undefined) ??
  mongoose.model<MongoAccountDoc>("Account", AccountSchema);
