import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: String, required: true },
    merchant: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionDate: { type: String, required: true },
    accountName: { type: String, default: "Manual" },
    categoryName: { type: String, default: "Uncategorized" },
    recurring: { type: Boolean, default: false },
    currency: { type: String, default: "USD" },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, clientId: 1 }, { unique: true });
TransactionSchema.index({ userId: 1, transactionDate: -1 });

export type MongoTransactionDoc = InferSchemaType<typeof TransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TransactionModel: Model<MongoTransactionDoc> =
  (mongoose.models.Transaction as Model<MongoTransactionDoc> | undefined) ??
  mongoose.model<MongoTransactionDoc>("Transaction", TransactionSchema);
