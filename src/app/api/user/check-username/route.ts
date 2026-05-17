import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.toLowerCase().trim();

  if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid username format' });
  }

  const result = await query('SELECT id FROM users WHERE username = $1', [username]);
  return NextResponse.json({ available: result.rows.length === 0 });
}
