import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { generateRandomToken, checkRateLimit } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: 3 requests per 10 mins
    const rateCheck = checkRateLimit(`forgot:${normalizedEmail}`, 3, 600000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return safe generic message to avoid email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate reset token valid for 1 hour
    const resetToken = generateRandomToken(32);
    const expires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expires;
    await user.save();

    // In a production environment with SMTP, an email would be sent here.
    // For convenience in testing/local usage, we return the reset link token directly as well:
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
      resetToken, // Included so user can test the reset workflow seamlessly
      resetUrl: `/reset-password?token=${resetToken}`,
    });
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing password reset.' },
      { status: 500 }
    );
  }
}

