import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Development-only endpoint to directly verify a user and make them admin
// This should NEVER be used in production
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { email, makeAdmin } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE email = $1`,
      [email]
    );

    if (makeAdmin) {
      await query(
        `UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE email = $1`,
        [email]
      );
    }

    const result = await query('SELECT id, name, username, email, is_verified, is_admin FROM users WHERE email = $1', [email]);
    
    return NextResponse.json({ 
      success: true, 
      message: `User ${email} is now verified${makeAdmin ? ' and admin' : ''}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Dev setup error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
