import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Loan } from '@/models/Loan';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeSubtract, safeAdd } from '@/lib/currency';

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
      return NextResponse.json({ error: 'Repayment amount must be greater than zero.' }, { status: 400 });
    }

    const loan = await Loan.findOne({ _id: params.id, userId: session.userId });
    if (!loan) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    if (numAmount > loan.remainingAmount) {
      return NextResponse.json(
        { error: `Repayment amount (${numAmount}) cannot exceed remaining balance (${loan.remainingAmount}).` },
        { status: 400 }
      );
    }

    // Optional account balance adjustment:
    // If Money I Lent is repaid to me: I receive money into my account (+ amount)
    // If Money I Borrowed is repaid by me: I pay money from my account (- amount)
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: session.userId });
      if (account) {
        if (loan.type === 'lent') {
          account.currentBalance = safeAdd(account.currentBalance, numAmount);
        } else {
          account.currentBalance = safeSubtract(account.currentBalance, numAmount);
        }
        await account.save();
      }
    }

    loan.remainingAmount = safeSubtract(loan.remainingAmount, numAmount);
    loan.status = loan.remainingAmount === 0 ? 'settled' : 'partially_paid';

    loan.repayments.push({
      amount: numAmount,
      date: new Date(date),
      notes: notes ? notes.trim() : '',
      accountId: accountId || undefined,
    });

    await loan.save();

    return NextResponse.json({
      message: 'Repayment recorded successfully!',
      loan,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

