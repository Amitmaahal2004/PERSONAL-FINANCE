import mongoose, { Schema, Document, Model } from 'mongoose';
import { TransactionType } from '@/types';

export interface ICategoryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    icon: { type: String, default: 'Tag' },
    color: { type: String, default: '#10b981' },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ userId: 1, type: 1, name: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;

