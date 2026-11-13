import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SavingsGoal } from '@/models/SavingsGoal';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { amount, date = new Date(), notes, accountId } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Contribution amount must be greater than zero.' }, { status: 400 });
    }

    const goal = await SavingsGoal.findOne({ _id: params.id, userId: session.userId });
    if (!goal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    // Deduct from account if accountId is provided
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: session.userId });
      if (account) {
        account.currentBalance = safeSubtract(account.currentBalance, numAmount);
        await account.save();
      }
    }

    goal.currentSavedAmount = safeAdd(goal.currentSavedAmount, numAmount);
    if (goal.currentSavedAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    goal.contributions.push({
      amount: numAmount,
      date: new Date(date),
      notes: notes ? notes.trim() : '',
      accountId: accountId || undefined,
    });

    await goal.save();

    return NextResponse.json({
      message: 'Contribution added successfully!',
      goal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

