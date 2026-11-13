import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Loan } from '@/models/Loan';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'lent' or 'borrowed'

    const filter: Record<string, any> = {
      userId: session.userId,
      isDeleted: { $ne: true },
    };
    if (type && (type === 'lent' || type === 'borrowed')) {
      filter.type = type;
    }

    const loans = await Loan.find(filter).sort({ createdAt: -1 });

    let totalMoneyLent = 0;
    let totalMoneyBorrowed = 0;
    let pendingReceivables = 0; // remaining lent to others
    let pendingPayables = 0;    // remaining borrowed from others
    let overdueCount = 0;
    const now = new Date();

    for (const l of loans) {
      if (l.type === 'lent') {
        totalMoneyLent = safeAdd(totalMoneyLent, l.initialAmount);
        pendingReceivables = safeAdd(pendingReceivables, l.remainingAmount);
      } else {
        totalMoneyBorrowed = safeAdd(totalMoneyBorrowed, l.initialAmount);
        pendingPayables = safeAdd(pendingPayables, l.remainingAmount);
      }

      if (l.dueDate && new Date(l.dueDate) < now && l.remainingAmount > 0) {
        overdueCount++;
      }
    }

    return NextResponse.json({
      loans,
      summary: {
        totalMoneyLent,
        totalMoneyBorrowed,
        pendingReceivables,
        pendingPayables,
        overdueCount,
      },
    });
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
    const { type, personName, amount, date = new Date(), dueDate, notes } = body;

    if (!type || !personName || !amount) {
      return NextResponse.json(
        { error: 'Loan type, person name, and amount are required.' },
        { status: 400 }
      );
    }

    if (!['lent', 'borrowed'].includes(type)) {
      return NextResponse.json({ error: 'Type must be either lent or borrowed.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
    }

    const loan = await Loan.create({
      userId: session.userId,
      type,
      personName: personName.trim(),
      amount: numAmount,
      initialAmount: numAmount,
      remainingAmount: numAmount,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
      notes: notes ? notes.trim() : '',
      repayments: [],
    });

    return NextResponse.json({ loan, message: 'Loan record created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

