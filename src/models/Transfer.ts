import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransferDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fromAccountId: mongoose.Types.ObjectId;
  fromAccountName: string;
  toAccountId: mongoose.Types.ObjectId;
  toAccountName: string;
  amount: number;
  date: Date;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  originalModule: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema = new Schema<ITransferDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    fromAccountName: { type: String, required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    toAccountName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalModule: { type: String, default: 'transfers' },
  },
  {
    timestamps: true,
  }
);

TransferSchema.index({ userId: 1, date: -1 });
TransferSchema.index({ userId: 1, isDeleted: 1 });

export const Transfer: Model<ITransferDocument> =
  mongoose.models.Transfer || mongoose.model<ITransferDocument>('Transfer', TransferSchema);

export default Transfer;
