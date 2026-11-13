import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType } from '@/types';

export interface ITransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId?: mongoose.Types.ObjectId;
  account: string;
  accountId: mongoose.Types.ObjectId;
  date: Date;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  receiptName?: string;
  isRecurring?: boolean;
  recurringId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    category: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    account: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, default: 'UPI' },
    notes: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    receiptUrl: { type: String },
    receiptName: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringTransaction' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'transactions' },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, isDeleted: 1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, accountId: 1 });
TransactionSchema.index({ userId: 1, category: 1 });

export const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction || mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

export default Transaction;

