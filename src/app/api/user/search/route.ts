import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const result = await query(
      `SELECT id, name, username, email, phone
       FROM users 
       WHERE is_verified = TRUE AND is_banned = FALSE AND id != $1
         AND (
           username ILIKE $2 OR 
           phone ILIKE $2 OR
           email ILIKE $2 OR
           name ILIKE $2
         )
       LIMIT 10`,
      [user.userId, `%${q}%`]
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
