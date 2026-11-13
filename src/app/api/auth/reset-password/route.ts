import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      message: 'Password has been successfully updated! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting password.' },
      { status: 500 }
    );
  }
}

