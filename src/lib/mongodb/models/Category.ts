import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: String, required: true },
    name: { type: String, required: true },
    group: { type: String, default: "Custom" },
    icon: { type: String, default: "CircleDollarSign" },
    color: { type: String, default: "#0d9488" },
    budgeted: { type: Number, default: 0 },
    budgetBehavior: { type: String, default: "fixed" },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, clientId: 1 }, { unique: true });

export type MongoCategoryDoc = InferSchemaType<typeof CategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CategoryModel: Model<MongoCategoryDoc> =
  (mongoose.models.Category as Model<MongoCategoryDoc> | undefined) ??
  mongoose.model<MongoCategoryDoc>("Category", CategorySchema);
