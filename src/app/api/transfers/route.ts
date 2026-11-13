import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Account } from '@/models/Account';
import { Transfer } from '@/models/Transfer';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const transfers = await Transfer.find({ userId: session.userId }).sort({ date: -1 }).limit(50);
    return NextResponse.json({ transfers });
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
    const { fromAccountId, toAccountId, amount, date = new Date(), notes } = body;

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json(
        { error: 'Source account, destination account, and amount are required.' },
        { status: 400 }
      );
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { error: 'Cannot transfer money to the same account.' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Transfer amount must be greater than zero.' },
        { status: 400 }
      );
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, userId: session.userId });
    const toAccount = await Account.findOne({ _id: toAccountId, userId: session.userId });

    if (!fromAccount || !toAccount) {
      return NextResponse.json({ error: 'One or both accounts were not found.' }, { status: 404 });
    }

    // Atomic / safe balance update
    fromAccount.currentBalance = safeSubtract(fromAccount.currentBalance, numAmount);
    toAccount.currentBalance = safeAdd(toAccount.currentBalance, numAmount);

    await fromAccount.save();
    await toAccount.save();

    const transfer = await Transfer.create({
      userId: session.userId,
      fromAccountId: fromAccount._id,
      fromAccountName: fromAccount.accountName,
      toAccountId: toAccount._id,
      toAccountName: toAccount.accountName,
      amount: numAmount,
      date: new Date(date),
      notes: notes ? notes.trim() : '',
    });

    return NextResponse.json({
      message: 'Money transferred successfully',
      transfer,
      fromAccountBalance: fromAccount.currentBalance,
      toAccountBalance: toAccount.currentBalance,
    });
  } catch (error: any) {
    console.error('Transfer Error:', error);
    return NextResponse.json({ error: error.message || 'Transfer failed' }, { status: 500 });
  }
}

