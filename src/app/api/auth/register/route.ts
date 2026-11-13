import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword, signToken, TOKEN_COOKIE_NAME, generateRandomToken } from '@/lib/auth';
import { seedDefaultsForUser } from '@/lib/seedDefaults';
import { CURRENCY_MAP } from '@/lib/currency';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, confirmPassword, preferredCurrency = 'INR' } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields: Name, Email, Password.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // 3. Security: Never allow public registration to set role to admin
    const hashedPassword = await hashPassword(password);
    const verificationToken = generateRandomToken();
    const currencyInfo = CURRENCY_MAP[preferredCurrency] || { symbol: '₹' };

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user', // strictly enforced
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      preferredCurrency,
      currencySymbol: currencyInfo.symbol,
      isBanned: false,
    });

    // 4. Seed default categories and accounts for the new user
    try {
      await seedDefaultsForUser(newUser._id.toString());
    } catch (seedErr) {
      console.error('Error seeding defaults for new user:', seedErr);
    }

    // 5. Generate session token
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully!',
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          preferredCurrency: newUser.preferredCurrency,
          currencySymbol: newUser.currencySymbol,
          isEmailVerified: newUser.isEmailVerified,
        },
      },
      { status: 201 }
    );

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while creating account.' },
      { status: 500 }
    );
  }
}

