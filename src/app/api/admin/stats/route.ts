import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    await connectToDatabase();

    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isBanned: false });
    const bannedUsers = await User.countDocuments({ role: 'user', isBanned: true });
    const verifiedUsers = await User.countDocuments({ role: 'user', isEmailVerified: true });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo },
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      verifiedUsers,
      recentSignups,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

