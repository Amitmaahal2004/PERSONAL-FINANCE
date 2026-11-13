import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({
        transactions: [],
        accounts: [],
        categories: [],
      });
    }

    await connectToDatabase();
    const queryRegex = new RegExp(q, 'i');
    const numericQuery = parseFloat(q);

    // Search transactions
    const txConditions: any[] = [
      { title: queryRegex },
      { category: queryRegex },
      { account: queryRegex },
      { notes: queryRegex },
      { tags: { $in: [queryRegex] } },
    ];

    if (!isNaN(numericQuery)) {
      txConditions.push({ amount: numericQuery });
    }

    const transactions = await Transaction.find({
      userId: session.userId,
      $or: txConditions,
    })
      .sort({ date: -1 })
      .limit(20);

    // Search accounts
    const accounts = await Account.find({
      userId: session.userId,
      $or: [{ accountName: queryRegex }, { description: queryRegex }],
    }).limit(5);

    // Search categories
    const categories = await Category.find({
      userId: session.userId,
      name: queryRegex,
    }).limit(5);

    return NextResponse.json({
      transactions,
      accounts,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

