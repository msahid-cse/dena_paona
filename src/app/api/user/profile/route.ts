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

    const { name, username, age, gender, phone, bkash_available, language_pref } = await req.json();

    if (username) {
      // check if username is unique
      const existing = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, user.userId]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           username = COALESCE($2, username),
           age = COALESCE($3::INTEGER, age),
           gender = COALESCE($4, gender),
           phone = COALESCE($5, phone),
           bkash_available = COALESCE($6, bkash_available),
           language_pref = COALESCE($7, language_pref),
           updated_at = NOW()
       WHERE id = $8`,
      [name || null, username || null, age || null, gender || null, phone || null, bkash_available ?? null, language_pref || null, user.userId]
    );

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
