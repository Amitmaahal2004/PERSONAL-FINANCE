import mongoose, { Schema, Document, Model } from 'mongoose';
import { UdhaarType, UdhaarStatus } from '@/types';

export interface IUdhaarRepaymentDoc {
  _id?: mongoose.Types.ObjectId;
  repaymentId: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  accountId?: mongoose.Types.ObjectId;
  accountName?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: Date;
}

export interface IUdhaarDocument extends Document {
  userId: mongoose.Types.ObjectId;
  recordId: string;
  type: UdhaarType;
  personName: string;
  phoneNumber?: string;
  originalAmount: number;
  remainingAmount: number;
  totalRepaid: number;
  udhaarDate: Date;
  expectedRepaymentDate?: Date;
  settlementDate?: Date;
  settlementDurationDays?: number;
  paymentMethod: string;
  accountId?: mongoose.Types.ObjectId;
  accountName?: string;
  description?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: UdhaarStatus;
  repayments: IUdhaarRepaymentDoc[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const UdhaarRepaymentSchema = new Schema(
  {
    repaymentId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, default: 'Cash' },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    accountName: { type: String },
    notes: { type: String, trim: true },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UdhaarSchema = new Schema<IUdhaarDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recordId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ['lent', 'borrowed'] },
    personName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true },
    originalAmount: { type: Number, required: true, min: 1 },
    remainingAmount: { type: Number, required: true, min: 0 },
    totalRepaid: { type: Number, default: 0, min: 0 },
    udhaarDate: { type: Date, required: true, default: Date.now },
    expectedRepaymentDate: { type: Date },
    settlementDate: { type: Date },
    settlementDurationDays: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'Cash' },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    accountName: { type: String },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'cleared', 'overdue'],
      default: 'pending',
      index: true,
    },
    repayments: [UdhaarRepaymentSchema],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'udhaar' },
  },
  {
    timestamps: true,
  }
);

UdhaarSchema.index({ userId: 1, type: 1, status: 1 });
UdhaarSchema.index({ userId: 1, isDeleted: 1 });
UdhaarSchema.index({ userId: 1, udhaarDate: -1 });

export const Udhaar: Model<IUdhaarDocument> =
  mongoose.models.Udhaar || mongoose.model<IUdhaarDocument>('Udhaar', UdhaarSchema);

export default Udhaar;

