import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Account } from '@/models/Account';
import { Transaction } from '@/models/Transaction';
import { getAuthSession } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const account = await Account.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const recentTransactions = await Transaction.find({
      userId: session.userId,
      accountId: account._id,
    })
      .sort({ date: -1 })
      .limit(20);

    return NextResponse.json({ account, recentTransactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { accountName, accountType, accountColor, accountIcon, description, isArchived } = body;

    const updateFields: Record<string, any> = {};
    if (accountName) updateFields.accountName = accountName.trim();
    if (accountType) updateFields.accountType = accountType;
    if (accountColor) updateFields.accountColor = accountColor;
    if (accountIcon) updateFields.accountIcon = accountIcon;
    if (description !== undefined) updateFields.description = description;
    if (isArchived !== undefined) updateFields.isArchived = isArchived;

    const account = await Account.findOneAndUpdate(
      { _id: params.id, userId: session.userId },
      { $set: updateFields },
      { new: true }
    );

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Also update account name on transactions if changed
    if (accountName) {
      await Transaction.updateMany(
        { userId: session.userId, accountId: account._id },
        { $set: { account: accountName.trim() } }
      );
    }

    return NextResponse.json({ account, message: 'Account updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const account = await Account.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if transactions exist
    const txCount = await Transaction.countDocuments({
      userId: session.userId,
      accountId: account._id,
    });

    account.isDeleted = true;
    account.deletedAt = new Date();
    account.deletedBy = session.userId as any;
    account.originalModule = 'accounts';
    await account.save();

    return NextResponse.json({ message: 'Account moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

