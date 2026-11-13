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
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { module, id, ids } = body;

    const targetIds: string[] = ids && Array.isArray(ids) ? ids : id ? [id] : [];
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'No item IDs provided for restoration' }, { status: 400 });
    }

    const userId = session.userId;
    let restoredCount = 0;

    switch (module) {
      case 'transactions': {
        const transactions = await Transaction.find({
          _id: { $in: targetIds },
          userId,
          isDeleted: true,
        });

        for (const tx of transactions) {
          tx.isDeleted = false;
          tx.deletedAt = undefined;
          tx.deletedBy = undefined;
          await tx.save();

          // Re-apply account balance effect
          if (tx.accountId) {
            const acc = await Account.findOne({ _id: tx.accountId, userId });
            if (acc) {
              if (tx.type === 'expense') {
                acc.currentBalance = safeSubtract(acc.currentBalance, tx.amount);
              } else if (tx.type === 'income') {
                acc.currentBalance = safeAdd(acc.currentBalance, tx.amount);
              }
              await acc.save();
            }
          }
          restoredCount++;
        }
        break;
      }

      case 'accounts': {
        const res = await Account.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      case 'categories': {
        const res = await Category.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      case 'budgets': {
        const res = await Budget.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      case 'savings': {
        const res = await SavingsGoal.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      case 'loans': {
        const res = await Loan.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      case 'udhaar': {
        const udhaars = await Udhaar.find({
          _id: { $in: targetIds },
          userId,
          isDeleted: true,
        });

        for (const ud of udhaars) {
          ud.isDeleted = false;
          ud.deletedAt = undefined;
          ud.deletedBy = undefined;
          await ud.save();

          // Re-apply principal account effect
          if (ud.accountId) {
            const acc = await Account.findOne({ _id: ud.accountId, userId });
            if (acc) {
              if (ud.type === 'lent') {
                acc.currentBalance = safeSubtract(acc.currentBalance, ud.originalAmount);
              } else {
                acc.currentBalance = safeAdd(acc.currentBalance, ud.originalAmount);
              }
              await acc.save();
            }
          }

          // Re-apply repayments account effects
          if (ud.repayments && ud.repayments.length > 0) {
            for (const rep of ud.repayments) {
              if (rep.accountId) {
                const repAcc = await Account.findOne({ _id: rep.accountId, userId });
                if (repAcc) {
                  if (ud.type === 'lent') {
                    repAcc.currentBalance = safeAdd(repAcc.currentBalance, rep.amount);
                  } else {
                    repAcc.currentBalance = safeSubtract(repAcc.currentBalance, rep.amount);
                  }
                  await repAcc.save();
                }
              }
            }
          }
          restoredCount++;
        }
        break;
      }

      case 'recurring': {
        const res = await RecurringTransaction.updateMany(
          { _id: { $in: targetIds }, userId, isDeleted: true },
          { $set: { isDeleted: false }, $unset: { deletedAt: '', deletedBy: '' } }
        );
        restoredCount = res.modifiedCount;
        break;
      }

      default: {
        return NextResponse.json({ error: `Invalid or unsupported module: ${module}` }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${restoredCount} record(s) restored successfully.`,
      restoredCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

