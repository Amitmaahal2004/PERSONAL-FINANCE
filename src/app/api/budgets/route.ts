import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { getAuthSession } from '@/lib/auth';
import { safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const userObjectId = new mongoose.Types.ObjectId(session.userId);
    const budgets = await Budget.find({ userId: session.userId }).sort({ createdAt: 1 });

    // Aggregate monthly expenses for current month
    const expensesAgg = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const expenseMap = new Map<string, number>();
    let overallSpent = 0;

    for (const exp of expensesAgg) {
      expenseMap.set(exp._id, exp.totalSpent);
      overallSpent += exp.totalSpent;
    }

    const budgetsWithProgress = budgets.map((b) => {
      let spent = 0;
      if (b.categoryName.toLowerCase() === 'overall') {
        spent = overallSpent;
      } else {
        spent = expenseMap.get(b.categoryName) || 0;
      }

      const remaining = safeSubtract(b.monthlyBudget, spent);
      const percentageUsed = b.monthlyBudget > 0 ? Math.round((spent / b.monthlyBudget) * 100) : 0;

      return {
        ...b.toObject(),
        spent,
        remaining,
        percentageUsed,
        isAlert70: b.alertThreshold70 && percentageUsed >= 70 && percentageUsed < 90,
        isAlert90: b.alertThreshold90 && percentageUsed >= 90 && percentageUsed <= 100,
        isExceeded: b.alertThreshold100 && percentageUsed > 100,
      };
    });

    return NextResponse.json({
      budgets: budgetsWithProgress,
      overallSpent,
    });
  } catch (error: any) {
    console.error('Budgets GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const {
      categoryId,
      categoryName,
      monthlyBudget,
      periodType = 'monthly',
      startDate,
      endDate,
      alertThreshold70 = true,
      alertThreshold90 = true,
      alertThreshold100 = true,
    } = body;

    if (!categoryName || monthlyBudget === undefined) {
      return NextResponse.json(
        { error: 'Category name and monthly budget amount are required.' },
        { status: 400 }
      );
    }

    const numBudget = Number(monthlyBudget);
    if (isNaN(numBudget) || numBudget < 0) {
      return NextResponse.json(
        { error: 'Budget amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Upsert budget for category
    const existing = await Budget.findOne({
      userId: session.userId,
      categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
    });

    if (existing) {
      existing.monthlyBudget = numBudget;
      existing.periodType = periodType;
      existing.alertThreshold70 = alertThreshold70;
      existing.alertThreshold90 = alertThreshold90;
      existing.alertThreshold100 = alertThreshold100;
      if (startDate) existing.startDate = new Date(startDate);
      if (endDate) existing.endDate = new Date(endDate);
      await existing.save();

      return NextResponse.json({ budget: existing, message: 'Budget updated successfully' });
    }

    const budget = await Budget.create({
      userId: session.userId,
      categoryId: categoryId || null,
      categoryName: categoryName.trim(),
      monthlyBudget: numBudget,
      periodType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      alertThreshold70,
      alertThreshold90,
      alertThreshold100,
    });

    return NextResponse.json({ budget, message: 'Budget created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
