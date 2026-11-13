import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SavingsGoal } from '@/models/SavingsGoal';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const goals = await SavingsGoal.find({ userId: session.userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    const formattedGoals = goals.map((g) => {
      const progressPercentage =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentSavedAmount / g.targetAmount) * 100))
          : 0;
      return {
        ...g.toObject(),
        progressPercentage,
      };
    });

    const totalSaved = goals.reduce((acc, curr) => acc + (curr.currentSavedAmount || 0), 0);
    const totalTarget = goals.reduce((acc, curr) => acc + (curr.targetAmount || 0), 0);

    return NextResponse.json({
      savingsGoals: formattedGoals,
      totalSaved,
      totalTarget,
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
      goalName,
      targetAmount,
      currentSavedAmount = 0,
      targetDate,
      description,
      goalImage,
      accountId,
    } = body;

    if (!goalName || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: 'Goal name, target amount, and target date are required.' },
        { status: 400 }
      );
    }

    const numTarget = Number(targetAmount);
    const numCurrent = Number(currentSavedAmount) || 0;

    const goal = await SavingsGoal.create({
      userId: session.userId,
      goalName: goalName.trim(),
      targetAmount: numTarget,
      currentSavedAmount: numCurrent,
      targetDate: new Date(targetDate),
      description: description ? description.trim() : '',
      goalImage: goalImage || undefined,
      accountId: accountId || undefined,
      status: numCurrent >= numTarget ? 'completed' : 'active',
      contributions: numCurrent > 0 ? [{ amount: numCurrent, date: new Date(), notes: 'Initial savings' }] : [],
    });

    return NextResponse.json({ goal, message: 'Savings goal created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

