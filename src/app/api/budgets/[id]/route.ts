import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Budget } from '@/models/Budget';
import { getAuthSession } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const {
      monthlyBudget,
      alertThreshold70,
      alertThreshold90,
      alertThreshold100,
      startDate,
      endDate,
    } = body;

    const budget = await Budget.findOne({ _id: params.id, userId: session.userId });
    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    if (monthlyBudget !== undefined) budget.monthlyBudget = Number(monthlyBudget);
    if (alertThreshold70 !== undefined) budget.alertThreshold70 = alertThreshold70;
    if (alertThreshold90 !== undefined) budget.alertThreshold90 = alertThreshold90;
    if (alertThreshold100 !== undefined) budget.alertThreshold100 = alertThreshold100;
    if (startDate !== undefined) budget.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) budget.endDate = endDate ? new Date(endDate) : undefined;

    await budget.save();

    return NextResponse.json({ budget, message: 'Budget updated successfully' });
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
    const budget = await Budget.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    budget.isDeleted = true;
    budget.deletedAt = new Date();
    budget.deletedBy = session.userId as any;
    budget.originalModule = 'budgets';
    await budget.save();

    return NextResponse.json({ message: 'Budget moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

