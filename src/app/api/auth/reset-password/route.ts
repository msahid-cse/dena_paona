import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();
    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Email, code and new password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userResult = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 });
    }

    const userId = userResult.rows[0].id;

    // Verify code
    const codeResult = await query(
      `SELECT id FROM verification_codes
       WHERE user_id = $1 AND code = $2 AND type = 'password_reset' AND expires_at > NOW()`,
      [userId, code.trim()]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);

    // Delete used code
    await query(`DELETE FROM verification_codes WHERE user_id = $1 AND type = 'password_reset'`, [userId]);

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'password_reset', 'Password reset via email code')`,
      [userId]
    );

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Reset failed. Please try again.' }, { status: 500 });
  }
}
