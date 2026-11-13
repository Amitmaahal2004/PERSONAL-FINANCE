import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType } from '@/types';

export interface IRecurringTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId?: mongoose.Types.ObjectId;
  account: string;
  accountId: mongoose.Types.ObjectId;
  paymentMethod: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  nextDueDate: Date;
  lastProcessedDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    category: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    account: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    paymentMethod: { type: String, default: 'UPI' },
    frequency: { 
      type: String, 
      required: true, 
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    startDate: { type: Date, required: true, default: Date.now },
    nextDueDate: { type: Date, required: true },
    lastProcessedDate: { type: Date },
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'recurring' },
  },
  {
    timestamps: true,
  }
);

RecurringTransactionSchema.index({ userId: 1, status: 1, nextDueDate: 1 });
RecurringTransactionSchema.index({ userId: 1, isDeleted: 1 });

export const RecurringTransaction: Model<IRecurringTransactionDocument> =
  mongoose.models.RecurringTransaction ||
  mongoose.model<IRecurringTransactionDocument>('RecurringTransaction', RecurringTransactionSchema);

export default RecurringTransaction;

