import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ThemeConfig } from '@/models/ThemeConfig';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = new ThemeConfig();
    }

    theme.primaryColor = '#10B981';
    theme.secondaryColor = '#0F766E';
    theme.updatedBy = session.userId as any;
    await theme.save();

    return NextResponse.json({
      success: true,
      message: 'Global theme reset to default emerald green & teal branding.',
      theme: {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        updatedAt: theme.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

