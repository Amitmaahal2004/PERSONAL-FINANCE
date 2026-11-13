import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import mongoose from 'mongoose';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const filter: Record<string, any> = { userId: session.userId };

    if (type && (type === 'income' || type === 'expense')) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (accountId) {
      filter.accountId = accountId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { account: searchRegex },
        { notes: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    const sortOption: Record<string, 1 | -1> = {};
    if (sortBy === 'amount') {
      sortOption.amount = sortOrder;
    } else {
      sortOption.date = sortOrder;
    }

    const totalCount = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate sum of income and expenses matching this filter
    const aggFilter: Record<string, any> = { ...filter, userId: new mongoose.Types.ObjectId(session.userId) };
    if (filter.accountId) aggFilter.accountId = new mongoose.Types.ObjectId(filter.accountId);

    const statsAgg = await Transaction.aggregate([
      { $match: aggFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const stat of statsAgg) {
      if (stat._id === 'income') totalIncome = stat.total;
      if (stat._id === 'expense') totalExpenses = stat.total;
    }

    return NextResponse.json({
      transactions,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        page,
        limit,
      },
      summary: {
        totalIncome,
        totalExpenses,
        net: safeSubtract(totalIncome, totalExpenses),
      },
    });
  } catch (error: any) {
    console.error('Transactions GET Error:', error);
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
      title,
      amount,
      type,
      category,
      categoryId,
      accountId,
      date = new Date(),
      paymentMethod = 'UPI',
      notes,
      tags = [],
      receiptUrl,
      receiptName,
    } = body;

    if (!title || !amount || !type || !category || !accountId) {
      return NextResponse.json(
        { error: 'Title, amount, type, category, and account are required.' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero.' },
        { status: 400 }
      );
    }

    // Verify account ownership
    const accountDoc = await Account.findOne({ _id: accountId, userId: session.userId });
    if (!accountDoc) {
      return NextResponse.json({ error: 'Selected account not found.' }, { status: 404 });
    }

    // Update account balance
    if (type === 'income') {
      accountDoc.currentBalance = safeAdd(accountDoc.currentBalance, numAmount);
    } else if (type === 'expense') {
      accountDoc.currentBalance = safeSubtract(accountDoc.currentBalance, numAmount);
    } else {
      return NextResponse.json({ error: 'Invalid transaction type.' }, { status: 400 });
    }

    await accountDoc.save();

    // Clean tags
    const cleanedTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const transaction = await Transaction.create({
      userId: session.userId,
      title: title.trim(),
      amount: numAmount,
      type,
      category: category.trim(),
      categoryId: categoryId || undefined,
      account: accountDoc.accountName,
      accountId: accountDoc._id,
      date: new Date(date),
      paymentMethod,
      notes: notes ? notes.trim() : '',
      tags: cleanedTags,
      receiptUrl,
      receiptName,
    });

    return NextResponse.json(
      {
        message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`,
        transaction,
        updatedAccountBalance: accountDoc.currentBalance,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Transaction POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
