import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT id, name, username, email, phone, age, gender, is_admin, is_verified,
              profile_picture, bkash_available, username_set, profile_completed, language_pref, created_at
       FROM users WHERE id = $1`,
      [user.userId]
    );

    if (result.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, age, gender, phone, bkash_available, language_pref } = await req.json();

    await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           age = COALESCE($2::INTEGER, age),
           gender = COALESCE($3, gender),
           phone = COALESCE($4, phone),
           bkash_available = COALESCE($5, bkash_available),
           language_pref = COALESCE($6, language_pref),
           updated_at = NOW()
       WHERE id = $7`,
      [name || null, age || null, gender || null, phone || null, bkash_available ?? null, language_pref || null, user.userId]
    );

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
