import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { RecurringTransaction } from '@/models/RecurringTransaction';
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
    const { title, amount, frequency, nextDueDate, status, notes } = body;

    const recurring = await RecurringTransaction.findOne({ _id: params.id, userId: session.userId });
    if (!recurring) {
      return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });
    }

    if (title) recurring.title = title.trim();
    if (amount !== undefined) recurring.amount = Number(amount);
    if (frequency) recurring.frequency = frequency;
    if (nextDueDate) recurring.nextDueDate = new Date(nextDueDate);
    if (status) recurring.status = status;
    if (notes !== undefined) recurring.notes = notes ? notes.trim() : '';

    await recurring.save();

    return NextResponse.json({ recurring, message: 'Recurring transaction updated successfully' });
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
    const recurring = await RecurringTransaction.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!recurring) {
      return NextResponse.json({ error: 'Recurring schedule not found' }, { status: 404 });
    }

    recurring.isDeleted = true;
    recurring.deletedAt = new Date();
    recurring.deletedBy = session.userId as any;
    recurring.originalModule = 'recurring';
    await recurring.save();

    return NextResponse.json({ message: 'Recurring schedule moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

