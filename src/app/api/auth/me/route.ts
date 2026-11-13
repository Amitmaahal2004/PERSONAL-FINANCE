import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { getAuthSession } from '@/lib/auth';
import { CURRENCY_MAP } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching user' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      name,
      phone,
      bio,
      preferredCurrency,
      timeZone,
      dateFormat,
      dateOfBirth,
      address,
      country,
      profilePicture,
      notificationPreferences,
    } = body;

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (timeZone) updateData.timeZone = timeZone;
    if (dateFormat) updateData.dateFormat = dateFormat;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

    if (preferredCurrency) {
      updateData.preferredCurrency = preferredCurrency;
      const currencyInfo = CURRENCY_MAP[preferredCurrency];
      if (currencyInfo) {
        updateData.currencySymbol = currencyInfo.symbol;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error updating profile' },
      { status: 500 }
    );
  }
}

