import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { generateCode } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();
    const result = await query('SELECT id, name FROM users WHERE email = $1 AND is_verified = TRUE', [cleanEmail]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
    }

    const user = result.rows[0];
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Invalidate previous reset codes
    await query(
      `DELETE FROM verification_codes WHERE user_id = $1 AND type = 'password_reset'`,
      [user.id]
    );

    await query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'password_reset', $3)`,
      [user.id, code, expiresAt]
    );

    try {
      await sendPasswordResetEmail(cleanEmail, user.name, code);
    } catch (emailErr) {
      console.error('Reset email failed:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
