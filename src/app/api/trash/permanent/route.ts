import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { Budget } from '@/models/Budget';
import { SavingsGoal } from '@/models/SavingsGoal';
import { Loan } from '@/models/Loan';
import { Udhaar } from '@/models/Udhaar';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { module, id, ids, emptyAll } = body;
    const userId = session.userId;

    if (emptyAll) {
      // Empty entire trash across all models for this user
      const results = await Promise.all([
        Transaction.deleteMany({ userId, isDeleted: true }),
        Account.deleteMany({ userId, isDeleted: true }),
        Category.deleteMany({ userId, isDeleted: true }),
        Budget.deleteMany({ userId, isDeleted: true }),
        SavingsGoal.deleteMany({ userId, isDeleted: true }),
        Loan.deleteMany({ userId, isDeleted: true }),
        Udhaar.deleteMany({ userId, isDeleted: true }),
        RecurringTransaction.deleteMany({ userId, isDeleted: true }),
      ]);

      const totalDeleted = results.reduce((acc, curr) => acc + (curr.deletedCount || 0), 0);

      return NextResponse.json({
        success: true,
        message: `Recycle bin emptied completely (${totalDeleted} records permanently removed).`,
        deletedCount: totalDeleted,
      });
    }

    const targetIds: string[] = ids && Array.isArray(ids) ? ids : id ? [id] : [];
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'No item IDs provided for permanent deletion' }, { status: 400 });
    }

    let deletedCount = 0;

    switch (module) {
      case 'transactions': {
        const res = await Transaction.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'accounts': {
        const res = await Account.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'categories': {
        const res = await Category.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'budgets': {
        const res = await Budget.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'savings': {
        const res = await SavingsGoal.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'loans': {
        const res = await Loan.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'udhaar': {
        const res = await Udhaar.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      case 'recurring': {
        const res = await RecurringTransaction.deleteMany({ _id: { $in: targetIds }, userId, isDeleted: true });
        deletedCount = res.deletedCount || 0;
        break;
      }
      default: {
        return NextResponse.json({ error: `Invalid or unsupported module: ${module}` }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} record(s) permanently removed from database.`,
      deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

