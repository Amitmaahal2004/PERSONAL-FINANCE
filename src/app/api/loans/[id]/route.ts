import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Loan } from '@/models/Loan';
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
    const { personName, dueDate, notes, status } = body;

    const loan = await Loan.findOne({ _id: params.id, userId: session.userId });
    if (!loan) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    if (personName) loan.personName = personName.trim();
    if (dueDate !== undefined) loan.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (notes !== undefined) loan.notes = notes ? notes.trim() : '';
    if (status) loan.status = status;

    await loan.save();

    return NextResponse.json({ loan, message: 'Loan record updated successfully' });
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
    const loan = await Loan.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!loan) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    loan.isDeleted = true;
    loan.deletedAt = new Date();
    loan.deletedBy = session.userId as any;
    loan.originalModule = 'loans';
    await loan.save();

    return NextResponse.json({ message: 'Loan record moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

