import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    await connectToDatabase();
    const transaction = await Transaction.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
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
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    await connectToDatabase();
    const body = await req.json();
    const {
      title,
      amount,
      type,
      category,
      categoryId,
      accountId,
      date,
      paymentMethod,
      notes,
      tags,
      receiptUrl,
      receiptName,
    } = body;

    const oldTx = await Transaction.findOne({ _id: params.id, userId: session.userId });
    if (!oldTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const newAmount = amount !== undefined ? Number(amount) : oldTx.amount;
    const newType = type || oldTx.type;
    const newAccountId = accountId || oldTx.accountId.toString();

    // 1. Revert old transaction effect on old account
    const oldAccount = await Account.findOne({ _id: oldTx.accountId, userId: session.userId });
    if (oldAccount) {
      if (oldTx.type === 'income') {
        oldAccount.currentBalance = safeSubtract(oldAccount.currentBalance, oldTx.amount);
      } else {
        oldAccount.currentBalance = safeAdd(oldAccount.currentBalance, oldTx.amount);
      }
      await oldAccount.save();
    }

    // 2. Apply new transaction effect on target account
    let targetAccount = oldAccount;
    if (newAccountId !== oldTx.accountId.toString()) {
      targetAccount = await Account.findOne({ _id: newAccountId, userId: session.userId });
      if (!targetAccount) {
        return NextResponse.json({ error: 'New account not found' }, { status: 404 });
      }
    }

    if (targetAccount) {
      if (newType === 'income') {
        targetAccount.currentBalance = safeAdd(targetAccount.currentBalance, newAmount);
      } else {
        targetAccount.currentBalance = safeSubtract(targetAccount.currentBalance, newAmount);
      }
      await targetAccount.save();
    }

    // 3. Update transaction document
    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (amount !== undefined) updateData.amount = newAmount;
    if (type) updateData.type = newType;
    if (category) updateData.category = category.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (accountId) {
      updateData.accountId = targetAccount!._id;
      updateData.account = targetAccount!.accountName;
    }
    if (date) updateData.date = new Date(date);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : '';
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags.map((t: string) => String(t).trim()).filter(Boolean)
        : [];
    }
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (receiptName !== undefined) updateData.receiptName = receiptName;

    const updatedTx = await Transaction.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      message: 'Transaction updated successfully',
      transaction: updatedTx,
    });
  } catch (error: any) {
    console.error('Transaction PUT Error:', error);
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
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    await connectToDatabase();
    const transaction = await Transaction.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Revert impact on account balance
    const account = await Account.findOne({ _id: transaction.accountId, userId: session.userId });
    if (account) {
      if (transaction.type === 'income') {
        account.currentBalance = safeSubtract(account.currentBalance, transaction.amount);
      } else {
        account.currentBalance = safeAdd(account.currentBalance, transaction.amount);
      }
      await account.save();
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    transaction.deletedBy = session.userId as any;
    transaction.originalModule = 'transactions';
    await transaction.save();

    return NextResponse.json({
      message: 'Transaction moved to Trash successfully',
      revertedAccountBalance: account?.currentBalance,
    });
  } catch (error: any) {
    console.error('Transaction DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
