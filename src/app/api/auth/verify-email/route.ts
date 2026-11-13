import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    await connectToDatabase();

    if (token) {
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
      }
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();
      return NextResponse.json({ message: 'Email address verified successfully!' });
    }

    // Otherwise check session
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return NextResponse.json({ message: 'Email address verified successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}

