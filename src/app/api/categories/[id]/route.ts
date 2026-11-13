import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { Transaction } from '@/models/Transaction';
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
    const { name, icon, color } = body;

    const oldCategory = await Category.findOne({ _id: params.id, userId: session.userId });
    if (!oldCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updateFields: Record<string, any> = {};
    if (name) updateFields.name = name.trim();
    if (icon) updateFields.icon = icon;
    if (color) updateFields.color = color;

    const updated = await Category.findByIdAndUpdate(
      params.id,
      { $set: updateFields },
      { new: true }
    );

    // If name changed, update corresponding transactions
    if (name && name.trim() !== oldCategory.name) {
      await Transaction.updateMany(
        { userId: session.userId, category: oldCategory.name },
        { $set: { category: name.trim() } }
      );
    }

    return NextResponse.json({ category: updated, message: 'Category updated successfully' });
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
    const category = await Category.findOne({ _id: params.id, userId: session.userId, isDeleted: { $ne: true } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = session.userId as any;
    category.originalModule = 'categories';
    await category.save();

    return NextResponse.json({ message: 'Category moved to Trash successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

