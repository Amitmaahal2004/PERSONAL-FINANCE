import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudgetDocument extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId | null;
  categoryName: string;
  monthlyBudget: number;
  periodType: 'monthly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  alertThreshold70: boolean;
  alertThreshold90: boolean;
  alertThreshold100: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudgetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    categoryName: { type: String, required: true },
    monthlyBudget: { type: Number, required: true, min: 0 },
    periodType: { type: String, enum: ['monthly', 'custom'], default: 'monthly' },
    startDate: { type: Date },
    endDate: { type: Date },
    alertThreshold70: { type: Boolean, default: true },
    alertThreshold90: { type: Boolean, default: true },
    alertThreshold100: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'budgets' },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.index({ userId: 1, categoryName: 1 });
BudgetSchema.index({ userId: 1, isDeleted: 1 });

export const Budget: Model<IBudgetDocument> =
  mongoose.models.Budget || mongoose.model<IBudgetDocument>('Budget', BudgetSchema);

export default Budget;

