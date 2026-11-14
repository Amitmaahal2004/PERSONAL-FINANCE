import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ThemeConfig } from '@/models/ThemeConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
        primaryColor: theme.primaryColor || '#10B981',
        secondaryColor: theme.secondaryColor || '#0F766E',
        updatedAt: theme.updatedAt,
      },
    });
  } catch (error: any) {
    // Return standard defaults if DB connection is unavailable
    return NextResponse.json({
      success: true,
      theme: {
        primaryColor: '#10B981',
        secondaryColor: '#0F766E',
      },
    });
  }
}
