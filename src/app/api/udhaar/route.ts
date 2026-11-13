import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Udhaar } from '@/models/Udhaar';
import { Account } from '@/models/Account';
import { getAuthSession } from '@/lib/auth';
import { safeAdd, safeSubtract } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const tab = searchParams.get('tab') || 'all'; // lent | borrowed | active | cleared | all
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const sortBy = searchParams.get('sortBy') || 'udhaarDate';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Base filter for all non-deleted records belonging to user
    const baseFilter: Record<string, any> = {
      userId: session.userId,
      isDeleted: { $ne: true },
    };

    // Calculate overall summary from all non-deleted records
    const allRecords = await Udhaar.find(baseFilter).lean();

    let totalMoneyLent = 0;
    let totalMoneyBorrowed = 0;
    let totalAmountReceived = 0;
    let totalAmountRepaid = 0;
    let pendingReceivables = 0;
    let pendingPayables = 0;
    let partiallyRepaidCount = 0;
    let fullyClearedCount = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const r of allRecords) {
      const isCleared = r.status === 'cleared' || r.remainingAmount <= 0;
      const isOverdue = !isCleared && r.expectedRepaymentDate && new Date(r.expectedRepaymentDate) < now;

      if (r.type === 'lent') {
        totalMoneyLent = safeAdd(totalMoneyLent, r.originalAmount);
        totalAmountReceived = safeAdd(totalAmountReceived, r.totalRepaid || 0);
        if (!isCleared) {
          pendingReceivables = safeAdd(pendingReceivables, r.remainingAmount);
        }
      } else {
        totalMoneyBorrowed = safeAdd(totalMoneyBorrowed, r.originalAmount);
        totalAmountRepaid = safeAdd(totalAmountRepaid, r.totalRepaid || 0);
        if (!isCleared) {
          pendingPayables = safeAdd(pendingPayables, r.remainingAmount);
        }
      }

      if (isCleared) {
        fullyClearedCount++;
      } else if (r.status === 'partially_paid' || (r.totalRepaid || 0) > 0) {
        partiallyRepaidCount++;
      }

      if (isOverdue || r.status === 'overdue') {
        overdueCount++;
      }
    }

    // Now build query filter for the specific tab/search/status
    const queryFilter: Record<string, any> = {
      userId: session.userId,
      isDeleted: { $ne: true },
    };

    if (tab === 'lent') {
      queryFilter.type = 'lent';
    } else if (tab === 'borrowed') {
      queryFilter.type = 'borrowed';
    } else if (tab === 'active') {
      queryFilter.status = { $ne: 'cleared' };
      queryFilter.remainingAmount = { $gt: 0 };
    } else if (tab === 'cleared') {
      queryFilter.status = 'cleared';
    }

    if (type && (type === 'lent' || type === 'borrowed')) {
      queryFilter.type = type;
    }

    if (status) {
      if (status === 'overdue') {
        queryFilter.status = { $ne: 'cleared' };
        queryFilter.remainingAmount = { $gt: 0 };
        queryFilter.expectedRepaymentDate = { $lt: now };
      } else {
        queryFilter.status = status;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      queryFilter.$or = [
        { personName: searchRegex },
        { phoneNumber: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
        { recordId: searchRegex },
      ];
    }

    const totalCount = await Udhaar.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;

    const sortObj: Record<string, any> = {};
    sortObj[sortBy] = sortOrder;

    const records = await Udhaar.find(queryFilter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Dynamically update status if overdue for presentation
    const formattedRecords = records.map((rec) => {
      let currentStatus = rec.status;
      if (currentStatus !== 'cleared' && rec.remainingAmount > 0 && rec.expectedRepaymentDate && new Date(rec.expectedRepaymentDate) < now) {
        currentStatus = 'overdue';
      }
      return {
        ...rec,
        status: currentStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      summary: {
        totalMoneyLent,
        totalMoneyBorrowed,
        totalAmountReceived,
        totalAmountRepaid,
        pendingReceivables,
        pendingPayables,
        partiallyRepaidCount,
        fullyClearedCount,
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

    const {
      type,
      personName,
      phoneNumber,
      originalAmount,
      udhaarDate = new Date(),
      expectedRepaymentDate,
      paymentMethod = 'Cash',
      accountId,
      description,
      notes,
      attachmentUrl,
      attachmentName,
    } = body;

    if (!type || !['lent', 'borrowed'].includes(type)) {
      return NextResponse.json({ error: 'Transaction type must be "lent" or "borrowed"' }, { status: 400 });
    }

    if (!personName || !personName.trim()) {
      return NextResponse.json({ error: 'Person name is required' }, { status: 400 });
    }

    const numAmount = Number(originalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Original amount must be greater than zero' }, { status: 400 });
    }

    // Generate unique record ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const recordId = `UDH-${dateStr}-${randomSuffix}`;

    let accountName: string | undefined;

    // Optional account balance adjustment:
    // If Money Lent: deduct money from selected account
    // If Money Borrowed: add money to selected account
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: session.userId });
      if (account) {
        accountName = account.accountName;
        if (type === 'lent') {
          account.currentBalance = safeSubtract(account.currentBalance, numAmount);
        } else {
          account.currentBalance = safeAdd(account.currentBalance, numAmount);
        }
        await account.save();
      }
    }

    let initialStatus: 'pending' | 'overdue' = 'pending';
    if (expectedRepaymentDate && new Date(expectedRepaymentDate) < new Date()) {
      initialStatus = 'overdue';
    }

    const newUdhaar = await Udhaar.create({
      userId: session.userId,
      recordId,
      type,
      personName: personName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      originalAmount: numAmount,
      remainingAmount: numAmount,
      totalRepaid: 0,
      udhaarDate: new Date(udhaarDate),
      expectedRepaymentDate: expectedRepaymentDate ? new Date(expectedRepaymentDate) : undefined,
      paymentMethod,
      accountId: accountId || undefined,
      accountName,
      description: description ? description.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      attachmentUrl,
      attachmentName,
      status: initialStatus,
      repayments: [],
      isDeleted: false,
      originalModule: 'udhaar',
    });

    return NextResponse.json({
      success: true,
      message: `Udhaar record ${recordId} created successfully!`,
      data: newUdhaar,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

