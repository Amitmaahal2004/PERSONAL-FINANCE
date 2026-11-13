import mongoose, { Schema, Document, Model } from 'mongoose';
import { AccountType } from '@/types';

export interface IAccountDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  description?: string;
  accountColor: string;
  accountIcon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccountDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountName: { type: String, required: true, trim: true },
    accountType: { 
      type: String, 
      required: true,
      enum: [
        'Cash Wallet',
        'Bank Account',
        'Savings Account',
        'Credit Card',
        'UPI',
        'Digital Wallet',
        'Investment',
        'Other'
      ],
      default: 'Bank Account'
    },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    description: { type: String, trim: true },
    accountColor: { type: String, default: '#10b981' },
    accountIcon: { type: String, default: 'Wallet' },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

AccountSchema.index({ userId: 1, accountName: 1 });

export const Account: Model<IAccountDocument> =
  mongoose.models.Account || mongoose.model<IAccountDocument>('Account', AccountSchema);

export default Account;

