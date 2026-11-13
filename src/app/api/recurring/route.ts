import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const recurring = await RecurringTransaction.find({ userId: session.userId, isDeleted: { $ne: true } }).sort({ nextDueDate: 1 });
    return NextResponse.json({ recurring });
  } catch (error: any) {
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
      paymentMethod = 'UPI',
      frequency = 'monthly',
      startDate = new Date(),
      nextDueDate,
      notes,
    } = body;

    if (!title || !amount || !type || !category || !accountId) {
      return NextResponse.json(
        { error: 'Title, amount, type, category, and account are required.' },
        { status: 400 }
      );
    }

    const account = await Account.findOne({ _id: accountId, userId: session.userId });
    if (!account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const calculatedNextDue = nextDueDate ? new Date(nextDueDate) : new Date(startDate);

    const recurring = await RecurringTransaction.create({
      userId: session.userId,
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category.trim(),
      categoryId: categoryId || undefined,
      account: account.accountName,
      accountId: account._id,
      paymentMethod,
      frequency,
      startDate: new Date(startDate),
      nextDueDate: calculatedNextDue,
      status: 'active',
      notes: notes ? notes.trim() : '',
    });

    return NextResponse.json({ recurring, message: 'Recurring transaction scheduled successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

