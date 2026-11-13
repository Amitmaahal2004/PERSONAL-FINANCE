import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Udhaar } from '@/models/Udhaar';
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

    const {
      amount,
      date = new Date(),
      paymentMethod = 'Cash',
      accountId,
      notes,
      attachmentUrl,
      attachmentName,
    } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Repayment amount must be greater than zero' }, { status: 400 });
    }

    const udhaar = await Udhaar.findOne({
      _id: params.id,
      userId: session.userId,
      isDeleted: { $ne: true },
    });

    if (!udhaar) {
      return NextResponse.json({ error: 'Udhaar record not found' }, { status: 404 });
    }

    if (udhaar.status === 'cleared' || udhaar.remainingAmount <= 0) {
      return NextResponse.json({ error: 'This Udhaar record is already fully cleared' }, { status: 400 });
    }

    // Allow a tiny floating-point margin of 0.01 for rounding
    if (numAmount > udhaar.remainingAmount + 0.01) {
      return NextResponse.json(
        {
          error: `Repayment amount (₹${numAmount.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${udhaar.remainingAmount.toLocaleString('en-IN')}).`,
        },
        { status: 400 }
      );
    }

    let accountName: string | undefined;

    // Financial Account update:
    // If Udhaar was Lent: user is receiving money -> add to account balance
    // If Udhaar was Borrowed: user is repaying money -> deduct from account balance
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: session.userId });
      if (account) {
        accountName = account.accountName;
        if (udhaar.type === 'lent') {
          account.currentBalance = safeAdd(account.currentBalance, numAmount);
        } else {
          account.currentBalance = safeSubtract(account.currentBalance, numAmount);
        }
        await account.save();
      }
    }

    const repaymentDate = new Date(date);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const repaymentId = `REP-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const newRemaining = Math.max(0, safeSubtract(udhaar.remainingAmount, numAmount));
    const newTotalRepaid = safeAdd(udhaar.totalRepaid || 0, numAmount);

    udhaar.remainingAmount = newRemaining;
    udhaar.totalRepaid = newTotalRepaid;

    if (newRemaining <= 0) {
      udhaar.status = 'cleared';
      udhaar.settlementDate = repaymentDate;
      const daysDiff = Math.max(
        0,
        Math.ceil((repaymentDate.getTime() - new Date(udhaar.udhaarDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      udhaar.settlementDurationDays = daysDiff;
    } else {
      udhaar.status = 'partially_paid';
    }

    udhaar.repayments.push({
      repaymentId,
      amount: numAmount,
      date: repaymentDate,
      paymentMethod,
      accountId: accountId || undefined,
      accountName,
      notes: notes ? notes.trim() : undefined,
      attachmentUrl,
      attachmentName,
      createdAt: new Date(),
    });

    await udhaar.save();

    return NextResponse.json({
      success: true,
      message:
        newRemaining <= 0
          ? `Udhaar record cleared! Settled in ${udhaar.settlementDurationDays} days.`
          : `Partial repayment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully. Remaining: ₹${newRemaining.toLocaleString('en-IN')}`,
      data: udhaar,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

