import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThemeConfigDocument extends Document {
  primaryColor: string;
  secondaryColor: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ThemeConfigSchema = new Schema<IThemeConfigDocument>(
  {
    primaryColor: {
      type: String,
      required: true,
      default: '#10b981',
      trim: true,
    },
    secondaryColor: {
      type: String,
      required: true,
      default: '#0f766e',
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const ThemeConfig: Model<IThemeConfigDocument> =
  mongoose.models.ThemeConfig ||
  mongoose.model<IThemeConfigDocument>('ThemeConfig', ThemeConfigSchema);

export default ThemeConfig;

