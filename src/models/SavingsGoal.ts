import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavingsGoalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  goalName: string;
  targetAmount: number;
  currentSavedAmount: number;
  targetDate: Date;
  description?: string;
  goalImage?: string;
  status: 'active' | 'completed' | 'paused';
  accountId?: mongoose.Types.ObjectId;
  contributions: {
    _id?: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    notes?: string;
    accountId?: mongoose.Types.ObjectId;
  }[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsContributionSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  },
  { _id: true }
);

const SavingsGoalSchema = new Schema<ISavingsGoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalName: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentSavedAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    description: { type: String, trim: true },
    goalImage: { type: String },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    contributions: [SavingsContributionSchema],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'savings' },
  },
  {
    timestamps: true,
  }
);

SavingsGoalSchema.index({ userId: 1, status: 1 });
SavingsGoalSchema.index({ userId: 1, isDeleted: 1 });

export const SavingsGoal: Model<ISavingsGoalDocument> =
  mongoose.models.SavingsGoal || mongoose.model<ISavingsGoalDocument>('SavingsGoal', SavingsGoalSchema);

export default SavingsGoal;

