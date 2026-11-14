import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { Budget } from '@/models/Budget';
import { SavingsGoal } from '@/models/SavingsGoal';
import { Loan } from '@/models/Loan';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { Udhaar } from '@/models/Udhaar';
import { Category } from '@/models/Category';
import { User } from '@/models/User';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const userId = session.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userId).select('preferredCurrency currencySymbol');
    const currencySymbol = user?.currencySymbol || '₹';

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. All accounts -> Available Balance
    const accounts = await Account.find({ userId, isArchived: { $ne: true }, isDeleted: { $ne: true } });
    const availableBalance = accounts.reduce((acc, curr) => safeAdd(acc, curr.currentBalance), 0);

    // 2. All-time Income & Expenses
    const allTimeStats = await Transaction.aggregate([
      { $match: { userId: userObjectId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const s of allTimeStats) {
      if (s._id === 'income') totalIncome = s.total;
      if (s._id === 'expense') totalExpenses = s.total;
    }

    // 3. Current Month Income & Expenses
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          isDeleted: { $ne: true },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    for (const m of monthlyStats) {
      if (m._id === 'income') monthlyIncome = m.total;
      if (m._id === 'expense') monthlyExpenses = m.total;
    }

    // 4. Savings Goals
    const savingsGoals = await SavingsGoal.find({ userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const totalSavings = savingsGoals.reduce((acc, curr) => safeAdd(acc, curr.currentSavedAmount), 0);

    // 5. Outstanding Money (Loans & Udhaar)
    const loans = await Loan.find({ userId, status: { $ne: 'settled' }, isDeleted: { $ne: true } });
    const udhaars = await Udhaar.find({ userId, status: { $ne: 'cleared' }, isDeleted: { $ne: true } });
    let lentPending = 0;
    let borrowedPending = 0;
    for (const l of loans) {
      if (l.type === 'lent') lentPending = safeAdd(lentPending, l.remainingAmount);
      if (l.type === 'borrowed') borrowedPending = safeAdd(borrowedPending, l.remainingAmount);
    }
    for (const u of udhaars) {
      if (u.type === 'lent') lentPending = safeAdd(lentPending, u.remainingAmount);
      if (u.type === 'borrowed') borrowedPending = safeAdd(borrowedPending, u.remainingAmount);
    }

    // 6. Budgets
    const budgets = await Budget.find({ userId, isDeleted: { $ne: true } });
    let totalMonthlyBudget = 0;
    const overallBudgetDoc = budgets.find((b) => b.categoryName.toLowerCase() === 'overall');
    if (overallBudgetDoc) {
      totalMonthlyBudget = overallBudgetDoc.monthlyBudget;
    } else {
      totalMonthlyBudget = budgets.reduce((acc, b) => safeAdd(acc, b.monthlyBudget), 0);
    }
    const budgetRemainingVal = safeSubtract(totalMonthlyBudget, monthlyExpenses);

    // 7. Last 6 Months Income vs Expense
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyHistoryAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          isDeleted: { $ne: true },
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build ordered 6-month array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeVsExpenseMonthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const monthLabel = `${monthNames[mo - 1]} ${yr.toString().slice(-2)}`;

      const inc = monthlyHistoryAgg.find((h) => h._id.year === yr && h._id.month === mo && h._id.type === 'income')?.total || 0;
      const exp = monthlyHistoryAgg.find((h) => h._id.year === yr && h._id.month === mo && h._id.type === 'expense')?.total || 0;

      incomeVsExpenseMonthly.push({
        month: monthLabel,
        income: inc,
        expense: exp,
      });
    }

    // 8. Monthly Expense Trend (Day by Day in current month)
    const expenseTrendAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          isDeleted: { $ne: true },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    const monthlyExpenseTrend = expenseTrendAgg.map((item) => ({
      date: `Day ${item._id}`,
      amount: item.amount,
    }));

    // 9. Category-wise Expense Breakdown (Current Month)
    const categoriesList = await Category.find({ userId, type: 'expense', isDeleted: { $ne: true } });
    const categoryColors = new Map<string, string>();
    categoriesList.forEach((c) => categoryColors.set(c.name, c.color));

    const categoryExpAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          isDeleted: { $ne: true },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const categoryWiseExpenses = categoryExpAgg.map((item) => {
      const percentage = monthlyExpenses > 0 ? Math.round((item.amount / monthlyExpenses) * 100) : 0;
      const defaultColors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];
      const color = categoryColors.get(item._id) || defaultColors[Math.floor(Math.random() * defaultColors.length)];
      return {
        category: item._id,
        amount: item.amount,
        percentage,
        color,
      };
    });

    // 10. Recent Transactions
    const recentTransactions = await Transaction.find({ userId, isDeleted: { $ne: true } })
      .sort({ date: -1 })
      .limit(6);

    // 11. Upcoming Recurring
    const upcomingRecurring = await RecurringTransaction.find({
      userId,
      status: 'active',
      isDeleted: { $ne: true },
    })
      .sort({ nextDueDate: 1 })
      .limit(4);

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      availableBalance,
      totalSavings,
      monthlyIncome,
      monthlyExpenses,
      outstandingMoney: {
        lentPending,
        borrowedPending,
      },
      budgetRemaining: {
        budgetTotal: totalMonthlyBudget,
        spentTotal: monthlyExpenses,
        remaining: budgetRemainingVal,
      },
      incomeVsExpenseMonthly,
      monthlyExpenseTrend,
      categoryWiseExpenses,
      recentTransactions,
      upcomingRecurring,
      budgetProgress: budgets,
      savingsGoals,
      currencySymbol,
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
