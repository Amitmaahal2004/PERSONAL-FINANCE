import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SavingsGoal } from '@/models/SavingsGoal';
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
    const { goalName, targetAmount, targetDate, description, goalImage, status, accountId } = body;

    const goal = await SavingsGoal.findOne({ _id: params.id, userId: session.userId });
    if (!goal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    if (goalName) goal.goalName = goalName.trim();
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (description !== undefined) goal.description = description ? description.trim() : '';
    if (goalImage !== undefined) goal.goalImage = goalImage;
    if (status) goal.status = status;
    if (accountId !== undefined) goal.accountId = accountId || undefined;

    await goal.save();

    return NextResponse.json({ goal, message: 'Savings goal updated successfully' });
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
    const goal = await SavingsGoal.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!goal) {
      return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
    }

    goal.isDeleted = true;
    goal.deletedAt = new Date();
    goal.deletedBy = session.userId as any;
    goal.originalModule = 'savings';
    await goal.save();

    return NextResponse.json({ message: 'Savings goal moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

