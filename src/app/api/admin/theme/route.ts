import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ThemeConfig } from '@/models/ThemeConfig';
import { getAuthSession } from '@/lib/auth';

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = await ThemeConfig.create({
        primaryColor: '#10B981',
        secondaryColor: '#0F766E',
      });
    }

    return NextResponse.json({
      success: true,
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

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { primaryColor, secondaryColor } = body;

    if (!primaryColor || !HEX_REGEX.test(primaryColor.trim())) {
      return NextResponse.json({ error: 'Invalid Primary Color. Must be a valid HEX color code (e.g. #10B981).' }, { status: 400 });
    }

    if (!secondaryColor || !HEX_REGEX.test(secondaryColor.trim())) {
      return NextResponse.json({ error: 'Invalid Secondary Color. Must be a valid HEX color code (e.g. #0F766E).' }, { status: 400 });
    }

    const cleanPrimary = primaryColor.trim().toUpperCase();
    const cleanSecondary = secondaryColor.trim().toUpperCase();

    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = new ThemeConfig({
        primaryColor: cleanPrimary,
        secondaryColor: cleanSecondary,
        updatedBy: session.userId as any,
      });
    } else {
      theme.primaryColor = cleanPrimary;
      theme.secondaryColor = cleanSecondary;
      theme.updatedBy = session.userId as any;
    }

    await theme.save();

    return NextResponse.json({
      success: true,
      message: 'Global theme customized successfully! Changes applied to all users.',
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

export async function POST(req: Request) {
  return PUT(req);
}
