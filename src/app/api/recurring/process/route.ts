import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { recurringId } = await req.json();

    if (!recurringId) {
      return NextResponse.json({ error: 'recurringId is required.' }, { status: 400 });
    }

    const rec = await RecurringTransaction.findOne({ _id: recurringId, userId: session.userId });
    if (!rec) {
      return NextResponse.json({ error: 'Recurring transaction not found.' }, { status: 404 });
    }

    const account = await Account.findOne({ _id: rec.accountId, userId: session.userId });
    if (!account) {
      return NextResponse.json({ error: 'Linked account not found.' }, { status: 404 });
    }

    // Apply to account balance
    if (rec.type === 'income') {
      account.currentBalance = safeAdd(account.currentBalance, rec.amount);
    } else {
      account.currentBalance = safeSubtract(account.currentBalance, rec.amount);
    }
    await account.save();

    // Create transaction
    const newTx = await Transaction.create({
      userId: session.userId,
      title: rec.title,
      amount: rec.amount,
      type: rec.type,
      category: rec.category,
      categoryId: rec.categoryId,
      account: account.accountName,
      accountId: account._id,
      date: new Date(),
      paymentMethod: rec.paymentMethod,
      notes: `Recurring ${rec.frequency} payment (${rec.notes || ''})`.trim(),
      isRecurring: true,
      recurringId: rec._id,
    });

    // Advance next due date
    const currentDue = new Date(rec.nextDueDate);
    let nextDue = new Date(currentDue);
    if (rec.frequency === 'daily') nextDue.setDate(currentDue.getDate() + 1);
    else if (rec.frequency === 'weekly') nextDue.setDate(currentDue.getDate() + 7);
    else if (rec.frequency === 'monthly') nextDue.setMonth(currentDue.getMonth() + 1);
    else if (rec.frequency === 'yearly') nextDue.setFullYear(currentDue.getFullYear() + 1);

    rec.lastProcessedDate = new Date();
    rec.nextDueDate = nextDue;
    await rec.save();

    return NextResponse.json({
      message: 'Recurring payment executed and recorded successfully!',
      transaction: newTx,
      nextDueDate: rec.nextDueDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

