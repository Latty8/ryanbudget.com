import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const GoalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: String, required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, default: 0 },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: String, default: "" },
    icon: { type: String, default: "Target" },
    color: { type: String, default: "#0d9488" },
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, clientId: 1 }, { unique: true });

export type MongoGoalDoc = InferSchemaType<typeof GoalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const GoalModel: Model<MongoGoalDoc> =
  (mongoose.models.Goal as Model<MongoGoalDoc> | undefined) ??
  mongoose.model<MongoGoalDoc>("Goal", GoalSchema);
