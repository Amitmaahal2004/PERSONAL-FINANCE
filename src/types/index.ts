export type TransactionType = 'income' | 'expense';

export type AccountType = 
  | 'Cash Wallet'
  | 'Bank Account'
  | 'Savings Account'
  | 'Credit Card'
  | 'UPI'
  | 'Digital Wallet'
  | 'Investment'
  | 'Other';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  phone?: string;
  bio?: string;
  preferredCurrency: string; // e.g. 'INR', 'USD', 'EUR', 'GBP'
  currencySymbol: string;   // e.g. '₹', '$', '€', '£'
  dateFormat?: string;
  timeZone?: string;
  dateOfBirth?: string;
  address?: string;
  country?: string;
  profilePicture?: string;
  notificationPreferences?: {
    emailAlerts: boolean;
    budgetThresholds: boolean;
    recurringReminders: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IAccount {
  _id: string;
  userId: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  description?: string;
  accountColor: string;
  accountIcon: string;
  isArchived: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId?: string;
  account: string;
  accountId: string;
  date: string; // ISO string
  paymentMethod: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  receiptName?: string;
  isRecurring?: boolean;
  recurringId?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransfer {
  _id: string;
  userId: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  date: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBudget {
  _id: string;
  userId: string;
  categoryId?: string | null;
  categoryName: string; // 'Overall' or category name
  monthlyBudget: number;
  periodType: 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  alertThreshold70: boolean;
  alertThreshold90: boolean;
  alertThreshold100: boolean;
  spent?: number;
  remaining?: number;
  percentageUsed?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISavingsContribution {
  _id?: string;
  amount: number;
  date: string;
  notes?: string;
  accountId?: string;
}

export interface ISavingsGoal {
  _id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentSavedAmount: number;
  targetDate: string;
  description?: string;
  goalImage?: string;
  status: 'active' | 'completed' | 'paused';
  accountId?: string;
  contributions: ISavingsContribution[];
  progressPercentage?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoanRepayment {
  _id?: string;
  amount: number;
  date: string;
  notes?: string;
  accountId?: string;
}

export interface ILoan {
  _id: string;
  userId: string;
  type: 'lent' | 'borrowed';
  personName: string;
  amount: number;
  initialAmount: number;
  date: string;
  dueDate?: string;
  remainingAmount: number;
  status: 'pending' | 'partially_paid' | 'settled' | 'overdue';
  notes?: string;
  repayments: ILoanRepayment[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRecurringTransaction {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId?: string;
  account: string;
  accountId: string;
  paymentMethod: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDueDate: string;
  lastProcessedDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDashboardStats {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  totalSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  outstandingMoney: {
    lentPending: number;
    borrowedPending: number;
  };
  budgetRemaining: {
    budgetTotal: number;
    spentTotal: number;
    remaining: number;
  };
  incomeVsExpenseMonthly: {
    month: string;
    income: number;
    expense: number;
  }[];
  monthlyExpenseTrend: {
    date: string;
    amount: number;
  }[];
  categoryWiseExpenses: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  recentTransactions: ITransaction[];
  upcomingRecurring: IRecurringTransaction[];
  budgetProgress: IBudget[];
  savingsGoals: ISavingsGoal[];
  currencySymbol: string;
}

export type UdhaarType = 'lent' | 'borrowed';
export type UdhaarStatus = 'pending' | 'partially_paid' | 'cleared' | 'overdue';

export interface IUdhaarRepayment {
  _id?: string;
  repaymentId: string;
  amount: number;
  date: string;
  paymentMethod: string;
  accountId?: string;
  accountName?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt?: string;
}

export interface IUdhaar {
  _id: string;
  recordId: string;
  userId: string;
  type: UdhaarType;
  personName: string;
  phoneNumber?: string;
  originalAmount: number;
  remainingAmount: number;
  totalRepaid: number;
  udhaarDate: string;
  expectedRepaymentDate?: string;
  settlementDate?: string;
  settlementDurationDays?: number;
  paymentMethod: string;
  accountId?: string;
  accountName?: string;
  description?: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: UdhaarStatus;
  repayments: IUdhaarRepayment[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUdhaarSummary {
  totalMoneyLent: number;
  totalMoneyBorrowed: number;
  totalAmountReceived: number;
  totalAmountRepaid: number;
  pendingReceivables: number;
  pendingPayables: number;
  partiallyRepaidCount: number;
  fullyClearedCount: number;
  overdueCount: number;
}

export interface ITrashItem {
  _id: string;
  recordName: string;
  originalModule: 'transactions' | 'accounts' | 'categories' | 'budgets' | 'savings' | 'loans' | 'udhaar' | 'recurring';
  recordType?: string;
  amount?: number;
  deletedAt: string;
  deletedBy?: string;
  createdAt?: string;
  originalData?: any;
}

export interface IPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: IPagination;
  summary?: any;
}
