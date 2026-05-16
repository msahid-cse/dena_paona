import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { generateCode } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const userResult = await query('SELECT name, email, is_verified FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = userResult.rows[0];
    if (user.is_verified) return NextResponse.json({ error: 'Email already verified' }, { status: 400 });

    // Delete old codes
    await query(`DELETE FROM verification_codes WHERE user_id = $1 AND type = 'email_verify'`, [userId]);

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'email_verify', $3)`,
      [userId, code, expiresAt]
    );

    await sendVerificationEmail(user.email, user.name, code);

    return NextResponse.json({ success: true, message: 'Verification code resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend code' }, { status: 500 });
  }
}
