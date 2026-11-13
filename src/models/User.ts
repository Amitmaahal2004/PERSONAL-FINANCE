import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  isBanned: boolean;
  banReason?: string;
  phone?: string;
  bio?: string;
  preferredCurrency: string;
  currencySymbol: string;
  dateFormat?: string;
  timeZone?: string;
  dateOfBirth?: string;
  address?: string;
  country?: string;
  profilePicture?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  notificationPreferences?: {
    emailAlerts: boolean;
    budgetThresholds: boolean;
    recurringReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    isBanned: { type: Boolean, default: false, index: true },
    banReason: { type: String },
    phone: { type: String, trim: true },
    bio: { type: String, trim: true },
    preferredCurrency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timeZone: { type: String, default: 'Asia/Kolkata' },
    dateOfBirth: { type: String },
    address: { type: String },
    country: { type: String, default: 'India' },
    profilePicture: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      budgetThresholds: { type: Boolean, default: true },
      recurringReminders: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js hot reload
export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;

