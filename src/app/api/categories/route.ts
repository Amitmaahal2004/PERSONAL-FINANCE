import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { getAuthSession } from '@/lib/auth';
import { seedDefaultsForUser } from '@/lib/seedDefaults';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'income' or 'expense'

    const filter: Record<string, any> = {
      userId: session.userId,
      isDeleted: { $ne: true },
    };
    if (type) filter.type = type;

    let categories = await Category.find(filter).sort({ name: 1 });

    // If for any reason categories were empty, seed defaults
    if (categories.length === 0) {
      await seedDefaultsForUser(session.userId);
      categories = await Category.find(filter).sort({ name: 1 });
    }

    const incomeCategories = categories.filter((c) => c.type === 'income');
    const expenseCategories = categories.filter((c) => c.type === 'expense');

    return NextResponse.json({ categories, incomeCategories, expenseCategories });
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
    const { name, type, icon = 'Tag', color = '#10b981' } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Category name and type are required.' }, { status: 400 });
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'Type must be either income or expense.' }, { status: 400 });
    }

    const existing = await Category.findOne({
      userId: session.userId,
      type,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Category "${name}" already exists for ${type}.` },
        { status: 409 }
      );
    }

    const category = await Category.create({
      userId: session.userId,
      name: name.trim(),
      type,
      icon,
      color,
      isDefault: false,
    });

    return NextResponse.json({ category, message: 'Category created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

