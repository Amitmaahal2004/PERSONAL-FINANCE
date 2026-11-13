import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'lent' | 'borrowed';
  personName: string;
  amount: number;
  initialAmount: number;
  date: Date;
  dueDate?: Date;
  remainingAmount: number;
  status: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  notes?: string;
  repayments: {
    _id?: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    notes?: string;
    accountId?: mongoose.Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LoanRepaymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  },
  { _id: true }
);

const LoanSchema = new Schema<ILoanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: ['lent', 'borrowed'] },
    personName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    initialAmount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    remainingAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'partially_paid', 'settled', 'overdue'], 
      default: 'pending' 
    },
    notes: { type: String, trim: true },
    repayments: [LoanRepaymentSchema],
  },
  {
    timestamps: true,
  }
);

LoanSchema.index({ userId: 1, type: 1, status: 1 });

export const Loan: Model<ILoanDocument> =
  mongoose.models.Loan || mongoose.model<ILoanDocument>('Loan', LoanSchema);

export default Loan;

