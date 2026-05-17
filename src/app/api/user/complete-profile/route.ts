import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import { uploadImage } from '@/lib/cloudinary';

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { phone, bkash_available, age, gender, language_pref } = body;

    // Build update fields dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone || null); }
    if (bkash_available !== undefined) { updates.push(`bkash_available = $${idx++}`); values.push(Boolean(bkash_available)); }
    if (age !== undefined) { updates.push(`age = $${idx++}`); values.push(age ? parseInt(age) : null); }
    if (gender !== undefined) { updates.push(`gender = $${idx++}`); values.push(gender || null); }
    if (language_pref !== undefined) { updates.push(`language_pref = $${idx++}`); values.push(language_pref); }

    // Mark profile_completed
    updates.push(`profile_completed = TRUE`);
    updates.push(`updated_at = NOW()`);
    values.push(user.userId);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'profile_completed', 'User completed profile setup')`,
      [user.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// POST /api/user/complete-profile — handle avatar upload combined
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageData } = await req.json();
    if (!imageData) return NextResponse.json({ error: 'No image data provided' }, { status: 400 });

    const imageUrl = await uploadImage(imageData);

    await query(
      `UPDATE users SET profile_picture = $1, updated_at = NOW() WHERE id = $2`,
      [imageUrl, user.userId]
    );

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Avatar upload failed' }, { status: 500 });
  }
}
