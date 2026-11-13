import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { verifyPassword, signToken, TOKEN_COOKIE_NAME, checkRateLimit, hashPassword } from '@/lib/auth';
import { seedDefaultsForUser } from '@/lib/seedDefaults';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: 7 attempts per minute
    const rateCheck = checkRateLimit(`login:${normalizedEmail}`, 7, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    // Provision or verify Super Admin if configured in env
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    if (superAdminEmail && normalizedEmail === superAdminEmail) {
      const existingAdmin = await User.findOne({ email: superAdminEmail });
      if (!existingAdmin && process.env.SUPER_ADMIN_PASSWORD) {
        // Provision super admin securely
        const hashedPassword = await hashPassword(process.env.SUPER_ADMIN_PASSWORD);
        const adminUser = await User.create({
          name: process.env.SUPER_ADMIN_NAME || 'Super Administrator',
          email: superAdminEmail,
          password: hashedPassword,
          role: 'admin',
          isEmailVerified: true,
          preferredCurrency: 'INR',
          currencySymbol: '₹',
          isBanned: false,
        });
        await seedDefaultsForUser(adminUser._id.toString());
      }
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (user.isBanned) {
      return NextResponse.json(
        { 
          error: `Your account has been suspended: ${user.banReason || 'Please contact platform administration.'}` 
        },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredCurrency: user.preferredCurrency || 'INR',
        currencySymbol: user.currencySymbol || '₹',
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
      },
    });

    // Set cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during login.' },
      { status: 500 }
    );
  }
}

