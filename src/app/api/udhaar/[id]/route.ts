import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Udhaar } from '@/models/Udhaar';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const udhaar = await Udhaar.findOne({
      $or: [{ _id: params.id }, { recordId: params.id }],
      userId: session.userId,
    }).lean();

    if (!udhaar) {
      return NextResponse.json({ error: 'Udhaar record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: udhaar });
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
    const udhaar = await Udhaar.findOne({
      _id: params.id,
      userId: session.userId,
      isDeleted: { $ne: true },
    });

    if (!udhaar) {
      return NextResponse.json({ error: 'Udhaar record not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      personName,
      phoneNumber,
      expectedRepaymentDate,
      description,
      notes,
      attachmentUrl,
      attachmentName,
    } = body;

    if (personName !== undefined) udhaar.personName = personName.trim();
    if (phoneNumber !== undefined) udhaar.phoneNumber = phoneNumber.trim();
    if (expectedRepaymentDate !== undefined) {
      udhaar.expectedRepaymentDate = expectedRepaymentDate ? new Date(expectedRepaymentDate) : undefined;
      // Re-evaluate overdue status if not cleared
      if (udhaar.status !== 'cleared') {
        if (udhaar.expectedRepaymentDate && new Date(udhaar.expectedRepaymentDate) < new Date()) {
          udhaar.status = 'overdue';
        } else if (udhaar.totalRepaid > 0) {
          udhaar.status = 'partially_paid';
        } else {
          udhaar.status = 'pending';
        }
      }
    }
    if (description !== undefined) udhaar.description = description.trim();
    if (notes !== undefined) udhaar.notes = notes.trim();
    if (attachmentUrl !== undefined) udhaar.attachmentUrl = attachmentUrl;
    if (attachmentName !== undefined) udhaar.attachmentName = attachmentName;

    await udhaar.save();

    return NextResponse.json({
      success: true,
      message: 'Udhaar record updated successfully',
      data: udhaar,
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
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const udhaar = await Udhaar.findOne({
      _id: params.id,
      userId: session.userId,
      isDeleted: { $ne: true },
    });

    if (!udhaar) {
      return NextResponse.json({ error: 'Udhaar record not found' }, { status: 404 });
    }

    // Soft delete: move to Trash
    udhaar.isDeleted = true;
    udhaar.deletedAt = new Date();
    udhaar.deletedBy = session.userId as any;
    udhaar.originalModule = 'udhaar';
    await udhaar.save();

    // Reverse financial account impact:
    // 1. Revert original principal
    if (udhaar.accountId) {
      const account = await Account.findOne({ _id: udhaar.accountId, userId: session.userId });
      if (account) {
        if (udhaar.type === 'lent') {
          // Money lent was deducted; refund to account
          account.currentBalance = safeAdd(account.currentBalance, udhaar.originalAmount);
        } else {
          // Money borrowed was added; deduct from account
          account.currentBalance = safeSubtract(account.currentBalance, udhaar.originalAmount);
        }
        await account.save();
      }
    }

    // 2. Revert any repayments made
    if (udhaar.repayments && udhaar.repayments.length > 0) {
      for (const rep of udhaar.repayments) {
        if (rep.accountId) {
          const repAccount = await Account.findOne({ _id: rep.accountId, userId: session.userId });
          if (repAccount) {
            if (udhaar.type === 'lent') {
              // Received repayment was added; now deduct
              repAccount.currentBalance = safeSubtract(repAccount.currentBalance, rep.amount);
            } else {
              // Repayment paid was deducted; now refund
              repAccount.currentBalance = safeAdd(repAccount.currentBalance, rep.amount);
            }
            await repAccount.save();
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Udhaar record moved to Trash successfully',
      data: udhaar,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

