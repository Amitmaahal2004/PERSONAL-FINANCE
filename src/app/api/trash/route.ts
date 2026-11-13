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
import { ITrashItem } from '@/types';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const moduleFilter = searchParams.get('module') || 'all';
    const search = searchParams.get('search')?.trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const userId = session.userId;
    const filter = { userId, isDeleted: true };

    const trashItems: ITrashItem[] = [];
    const moduleCounts: Record<string, number> = {
      all: 0,
      transactions: 0,
      accounts: 0,
      categories: 0,
      budgets: 0,
      savings: 0,
      loans: 0,
      udhaar: 0,
      recurring: 0,
    };

    // Helper to query each model
    const fetchPromises = [];

    if (moduleFilter === 'all' || moduleFilter === 'transactions') {
      fetchPromises.push(
        Transaction.find(filter).lean().then((items) => {
          moduleCounts.transactions = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: item.title || 'Untitled Transaction',
              originalModule: 'transactions',
              recordType: item.type,
              amount: item.amount,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Transaction.countDocuments(filter).then((c) => (moduleCounts.transactions = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'accounts') {
      fetchPromises.push(
        Account.find(filter).lean().then((items) => {
          moduleCounts.accounts = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: item.accountName || 'Unnamed Account',
              originalModule: 'accounts',
              recordType: item.accountType,
              amount: item.currentBalance,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Account.countDocuments(filter).then((c) => (moduleCounts.accounts = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'categories') {
      fetchPromises.push(
        Category.find(filter).lean().then((items) => {
          moduleCounts.categories = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: item.name || 'Unnamed Category',
              originalModule: 'categories',
              recordType: item.type,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Category.countDocuments(filter).then((c) => (moduleCounts.categories = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'budgets') {
      fetchPromises.push(
        Budget.find(filter).lean().then((items) => {
          moduleCounts.budgets = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: `${item.categoryName || 'General'} Budget`,
              originalModule: 'budgets',
              recordType: item.periodType,
              amount: item.monthlyBudget,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Budget.countDocuments(filter).then((c) => (moduleCounts.budgets = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'savings') {
      fetchPromises.push(
        SavingsGoal.find(filter).lean().then((items) => {
          moduleCounts.savings = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: item.goalName || 'Unnamed Goal',
              originalModule: 'savings',
              recordType: item.status,
              amount: item.targetAmount,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        SavingsGoal.countDocuments(filter).then((c) => (moduleCounts.savings = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'loans') {
      fetchPromises.push(
        Loan.find(filter).lean().then((items) => {
          moduleCounts.loans = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: `${item.personName} (${item.type})`,
              originalModule: 'loans',
              recordType: item.type,
              amount: item.initialAmount,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Loan.countDocuments(filter).then((c) => (moduleCounts.loans = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'udhaar') {
      fetchPromises.push(
        Udhaar.find(filter).lean().then((items) => {
          moduleCounts.udhaar = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: `${item.personName} (${item.type === 'lent' ? 'Lent' : 'Borrowed'}) - ${item.recordId}`,
              originalModule: 'udhaar',
              recordType: item.type,
              amount: item.originalAmount,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        Udhaar.countDocuments(filter).then((c) => (moduleCounts.udhaar = c))
      );
    }

    if (moduleFilter === 'all' || moduleFilter === 'recurring') {
      fetchPromises.push(
        RecurringTransaction.find(filter).lean().then((items) => {
          moduleCounts.recurring = items.length;
          items.forEach((item: any) => {
            trashItems.push({
              _id: item._id.toString(),
              recordName: item.title || 'Untitled Recurring',
              originalModule: 'recurring',
              recordType: `${item.frequency} ${item.type}`,
              amount: item.amount,
              deletedAt: item.deletedAt ? item.deletedAt.toISOString() : new Date().toISOString(),
              createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
              originalData: item,
            });
          });
        })
      );
    } else {
      fetchPromises.push(
        RecurringTransaction.countDocuments(filter).then((c) => (moduleCounts.recurring = c))
      );
    }

    await Promise.all(fetchPromises);

    moduleCounts.all =
      moduleCounts.transactions +
      moduleCounts.accounts +
      moduleCounts.categories +
      moduleCounts.budgets +
      moduleCounts.savings +
      moduleCounts.loans +
      moduleCounts.udhaar +
      moduleCounts.recurring;

    // Filter by search query if present
    let filteredItems = trashItems;
    if (search) {
      filteredItems = trashItems.filter(
        (it) =>
          it.recordName.toLowerCase().includes(search) ||
          it.originalModule.toLowerCase().includes(search) ||
          (it.recordType && it.recordType.toLowerCase().includes(search)) ||
          (it.amount && it.amount.toString().includes(search))
      );
    }

    // Sort by deletedAt descending
    filteredItems.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    const totalCount = filteredItems.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const skip = (page - 1) * limit;
    const pagedItems = filteredItems.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: pagedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      counts: moduleCounts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

