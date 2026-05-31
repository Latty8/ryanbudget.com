import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const RecurringTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    cadence: { type: String, required: true },
    nextRunDate: { type: String, required: true },
    paused: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RecurringTransactionSchema.index({ userId: 1, clientId: 1 }, { unique: true });

export type MongoRecurringDoc = InferSchemaType<typeof RecurringTransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RecurringTransactionModel: Model<MongoRecurringDoc> =
  (mongoose.models.RecurringTransaction as Model<MongoRecurringDoc> | undefined) ??
  mongoose.model<MongoRecurringDoc>("RecurringTransaction", RecurringTransactionSchema);
