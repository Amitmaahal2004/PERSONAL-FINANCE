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
    const category = await Category.findOne({ _id: params.id, userId: session.userId });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if any transactions reference this category
    const count = await Transaction.countDocuments({
      userId: session.userId,
      $or: [{ categoryId: category._id }, { category: category.name }],
    });

    if (count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category "${category.name}" because it is used by ${count} transaction(s). Please reassign or delete those transactions first.`,
        },
        { status: 400 }
      );
    }

    await Category.deleteOne({ _id: category._id });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

