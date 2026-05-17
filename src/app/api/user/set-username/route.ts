import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import { sanitizeString } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

    const cleanUsername = sanitizeString(username).toLowerCase().trim();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json({ error: 'Username must be 3-30 characters, letters, numbers and underscores only' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [cleanUsername, user.userId]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Username already taken. Please choose another.' }, { status: 409 });
    }

    await query(
      `UPDATE users SET username = $1, username_set = TRUE, updated_at = NOW() WHERE id = $2`,
      [cleanUsername, user.userId]
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'username_set', $2)`,
      [user.userId, `Username set to @${cleanUsername}`]
    );

    return NextResponse.json({ success: true, username: cleanUsername });
  } catch (error) {
    console.error('Set username error:', error);
    return NextResponse.json({ error: 'Failed to set username. Please try again.' }, { status: 500 });
  }
}
