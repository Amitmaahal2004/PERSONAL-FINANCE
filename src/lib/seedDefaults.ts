import { Category } from '@/models/Category';
import { Account } from '@/models/Account';

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#f97316' },
  { name: 'Transportation', icon: 'Car', color: '#0284c7' },
  { name: 'Travel', icon: 'Plane', color: '#06b6d4' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#eab308' },
  { name: 'Rent', icon: 'Home', color: '#8b5cf6' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Education', icon: 'GraduationCap', color: '#3b82f6' },
  { name: 'Entertainment', icon: 'Film', color: '#a855f7' },
  { name: 'Mobile & Internet', icon: 'Wifi', color: '#14b8a6' },
  { name: 'Subscriptions', icon: 'Tv', color: '#6366f1' },
  { name: 'Personal Care', icon: 'Sparkles', color: '#f43f5e' },
  { name: 'Family', icon: 'Users', color: '#10b981' },
  { name: 'Gifts', icon: 'Gift', color: '#d946ef' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelancing', icon: 'Laptop', color: '#059669' },
  { name: 'Business Income', icon: 'TrendingUp', color: '#047857' },
  { name: 'Commission', icon: 'Percent', color: '#14b8a6' },
  { name: 'Investments', icon: 'PieChart', color: '#3b82f6' },
  { name: 'Interest', icon: 'Coins', color: '#f59e0b' },
  { name: 'Refund', icon: 'RotateCcw', color: '#8b5cf6' },
  { name: 'Other Income', icon: 'Wallet', color: '#64748b' },
];

export async function seedDefaultsForUser(userId: string) {
  // Check if categories already exist
  const existingCategories = await Category.find({ userId });
  if (existingCategories.length === 0) {
    const expenseDocs = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      userId,
      name: c.name,
      type: 'expense',
      icon: c.icon,
      color: c.color,
      isDefault: true,
    }));

    const incomeDocs = DEFAULT_INCOME_CATEGORIES.map((c) => ({
      userId,
      name: c.name,
      type: 'income',
      icon: c.icon,
      color: c.color,
      isDefault: true,
    }));

    await Category.insertMany([...expenseDocs, ...incomeDocs]);
  }

  // Check if accounts already exist
  const existingAccounts = await Account.find({ userId });
  if (existingAccounts.length === 0) {
    await Account.create([
      {
        userId,
        accountName: 'Cash Wallet',
        accountType: 'Cash Wallet',
        openingBalance: 0,
        currentBalance: 0,
        currency: 'INR',
        description: 'Physical cash on hand',
        accountColor: '#10b981',
        accountIcon: 'Wallet',
        isArchived: false,
      },
      {
        userId,
        accountName: 'Main Bank Account',
        accountType: 'Bank Account',
        openingBalance: 0,
        currentBalance: 0,
        currency: 'INR',
        description: 'Primary checking/savings account',
        accountColor: '#0284c7',
        accountIcon: 'Building2',
        isArchived: false,
      },
    ]);
  }
}

