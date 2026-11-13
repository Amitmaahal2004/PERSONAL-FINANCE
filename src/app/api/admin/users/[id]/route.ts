import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Account } from '@/models/Account';
import { Transaction } from '@/models/Transaction';
import { Category } from '@/models/Category';
import { Budget } from '@/models/Budget';
import { SavingsGoal } from '@/models/SavingsGoal';
import { Loan } from '@/models/Loan';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { Transfer } from '@/models/Transfer';
import { getAuthSession } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    await connectToDatabase();
    const targetUserId = params.id;

    // Prevent modifying self
    if (session.userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot modify your own administrator account from here.' }, { status: 400 });
    }

    const body = await req.json();
    const { isBanned, banReason, isEmailVerified } = body;

    const user = await User.findById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot ban or modify another administrator.' }, { status: 400 });
    }

    if (isBanned !== undefined) {
      user.isBanned = isBanned;
      user.banReason = isBanned ? (banReason || 'Administrative suspension') : undefined;
    }

    if (isEmailVerified !== undefined) {
      user.isEmailVerified = isEmailVerified;
    }

    await user.save();

    return NextResponse.json({
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
        banReason: user.banReason,
      },
    });
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
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    await connectToDatabase();
    const targetUserId = params.id;

    // Prevent admin from deleting themselves
    if (session.userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot delete your own administrative account.' }, { status: 400 });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete an administrator account.' }, { status: 400 });
    }

    // Cascade delete all user's private financial data according to retention policy
    await Promise.all([
      User.deleteOne({ _id: targetUserId }),
      Account.deleteMany({ userId: targetUserId }),
      Transaction.deleteMany({ userId: targetUserId }),
      Transfer.deleteMany({ userId: targetUserId }),
      Category.deleteMany({ userId: targetUserId }),
      Budget.deleteMany({ userId: targetUserId }),
      SavingsGoal.deleteMany({ userId: targetUserId }),
      Loan.deleteMany({ userId: targetUserId }),
      RecurringTransaction.deleteMany({ userId: targetUserId }),
    ]);

    return NextResponse.json({
      message: 'User and all associated financial records deleted successfully in accordance with data retention policy.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

