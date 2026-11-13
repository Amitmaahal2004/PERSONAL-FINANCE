import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { Budget } from '@/models/Budget';
import { SavingsGoal } from '@/models/SavingsGoal';
import { Loan } from '@/models/Loan';
import { getAuthSession } from '@/lib/auth';
import { safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filterRange = searchParams.get('range') || 'thisMonth';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filterRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case 'last7Days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (customStart) startDate = new Date(customStart);
        if (customEnd) {
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const txMatch = {
      userId: new mongoose.Types.ObjectId(session.userId),
      date: { $gte: startDate, $lte: endDate },
    };

    // 1. Transactions in period
    const transactions = await Transaction.find(txMatch).sort({ date: -1 });

    // 2. Summary stats
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpenses += t.amount;
    }
    const netSavings = safeSubtract(totalIncome, totalExpenses);

    // 3. Category breakdown
    const categoryAgg = await Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const expenseCategories = categoryAgg
      .filter((c) => c._id.type === 'expense')
      .map((c) => ({
        category: c._id.category,
        total: c.total,
        count: c.count,
        percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
      }));

    const incomeCategories = categoryAgg
      .filter((c) => c._id.type === 'income')
      .map((c) => ({
        category: c._id.category,
        total: c.total,
        count: c.count,
        percentage: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100) : 0,
      }));

    // 4. Account breakdown
    const accountAgg = await Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: { account: '$account', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const accountBreakdownMap = new Map<string, { income: number; expense: number; count: number }>();
    for (const a of accountAgg) {
      const accName = a._id.account;
      const current = accountBreakdownMap.get(accName) || { income: 0, expense: 0, count: 0 };
      if (a._id.type === 'income') current.income += a.total;
      if (a._id.type === 'expense') current.expense += a.total;
      current.count += a.count;
      accountBreakdownMap.set(accName, current);
    }

    const accountBreakdown = Array.from(accountBreakdownMap.entries()).map(([account, data]) => ({
      account,
      income: data.income,
      expense: data.expense,
      net: safeSubtract(data.income, data.expense),
      count: data.count,
    }));

    // 5. Savings goals progress
    const savingsGoals = await SavingsGoal.find({ userId: session.userId });

    // 6. Budgets
    const budgets = await Budget.find({ userId: session.userId });

    // 7. Loans
    const loans = await Loan.find({ userId: session.userId });

    return NextResponse.json({
      period: {
        filterRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate: totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0,
        transactionCount: transactions.length,
      },
      expenseCategories,
      incomeCategories,
      accountBreakdown,
      savingsGoals,
      budgets,
      loans,
      transactions,
    });
  } catch (error: any) {
    console.error('Reports Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
