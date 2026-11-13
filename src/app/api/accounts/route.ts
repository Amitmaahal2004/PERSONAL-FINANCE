import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const filter: Record<string, any> = { userId: session.userId };
    if (!includeArchived) {
      filter.isArchived = { $ne: true };
    }

    const accounts = await Account.find(filter).sort({ createdAt: 1 });
    const totalBalance = accounts.reduce((acc, curr) => safeAdd(acc, curr.currentBalance), 0);

    return NextResponse.json({ accounts, totalBalance });
  } catch (error: any) {
    console.error('Accounts GET Error:', error);
    return NextResponse.json({ error: error.message || 'Error fetching accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      accountName,
      accountType,
      openingBalance = 0,
      currency = 'INR',
      description,
      accountColor = '#10b981',
      accountIcon = 'Wallet',
    } = body;

    if (!accountName || !accountType) {
      return NextResponse.json(
        { error: 'Account name and account type are required.' },
        { status: 400 }
      );
    }

    const numOpeningBalance = Number(openingBalance) || 0;

    const newAccount = await Account.create({
      userId: session.userId,
      accountName: accountName.trim(),
      accountType,
      openingBalance: numOpeningBalance,
      currentBalance: numOpeningBalance,
      currency,
      description: description ? description.trim() : '',
      accountColor,
      accountIcon,
      isArchived: false,
    });

    return NextResponse.json({ account: newAccount, message: 'Account created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Account POST Error:', error);
    return NextResponse.json({ error: error.message || 'Error creating account' }, { status: 500 });
  }
}

