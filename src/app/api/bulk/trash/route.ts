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
    const { module, ids } = body;

    if (!module || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Module and non-empty ids array are required' }, { status: 400 });
    }

    const userId = session.userId;
    const now = new Date();
    let movedCount = 0;

    switch (module) {
      case 'transactions': {
        const transactions = await Transaction.find({
          _id: { $in: ids },
          userId,
          isDeleted: { $ne: true },
        });

        for (const tx of transactions) {
          tx.isDeleted = true;
          tx.deletedAt = now;
          tx.deletedBy = userId as any;
          tx.originalModule = 'transactions';
          await tx.save();

          // Reverse account balance impact:
          // If expense was deducted -> refund to account (+amount)
          // If income was added -> deduct from account (-amount)
          if (tx.accountId) {
            const acc = await Account.findOne({ _id: tx.accountId, userId });
            if (acc) {
              if (tx.type === 'expense') {
                acc.currentBalance = safeAdd(acc.currentBalance, tx.amount);
              } else if (tx.type === 'income') {
                acc.currentBalance = safeSubtract(acc.currentBalance, tx.amount);
              }
              await acc.save();
            }
          }
          movedCount++;
        }
        break;
      }

      case 'udhaar': {
        const udhaars = await Udhaar.find({
          _id: { $in: ids },
          userId,
          isDeleted: { $ne: true },
        });

        for (const ud of udhaars) {
          ud.isDeleted = true;
          ud.deletedAt = now;
          ud.deletedBy = userId as any;
          ud.originalModule = 'udhaar';
          await ud.save();

          // Reverse principal
          if (ud.accountId) {
            const acc = await Account.findOne({ _id: ud.accountId, userId });
            if (acc) {
              if (ud.type === 'lent') {
                acc.currentBalance = safeAdd(acc.currentBalance, ud.originalAmount);
              } else {
                acc.currentBalance = safeSubtract(acc.currentBalance, ud.originalAmount);
              }
              await acc.save();
            }
          }

          // Reverse repayments
          if (ud.repayments && ud.repayments.length > 0) {
            for (const rep of ud.repayments) {
              if (rep.accountId) {
                const repAcc = await Account.findOne({ _id: rep.accountId, userId });
                if (repAcc) {
                  if (ud.type === 'lent') {
                    repAcc.currentBalance = safeSubtract(repAcc.currentBalance, rep.amount);
                  } else {
                    repAcc.currentBalance = safeAdd(repAcc.currentBalance, rep.amount);
                  }
                  await repAcc.save();
                }
              }
            }
          }
          movedCount++;
        }
        break;
      }

      case 'accounts': {
        const res = await Account.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'accounts' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      case 'categories': {
        const res = await Category.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'categories' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      case 'budgets': {
        const res = await Budget.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'budgets' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      case 'savings': {
        const res = await SavingsGoal.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'savings' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      case 'loans': {
        const res = await Loan.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'loans' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      case 'recurring': {
        const res = await RecurringTransaction.updateMany(
          { _id: { $in: ids }, userId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, deletedAt: now, deletedBy: userId, originalModule: 'recurring' } }
        );
        movedCount = res.modifiedCount;
        break;
      }

      default: {
        return NextResponse.json({ error: `Unsupported module: ${module}` }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${movedCount} item(s) moved to Trash.`,
      count: movedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

