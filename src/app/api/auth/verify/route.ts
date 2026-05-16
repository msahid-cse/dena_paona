import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and code are required' }, { status: 400 });
    }

    // Check verification code
    const result = await query(
      `SELECT id FROM verification_codes 
       WHERE user_id = $1 AND code = $2 AND type = 'email_verify' AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark user as verified
    await query('UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);

    // Delete used verification codes
    await query(`DELETE FROM verification_codes WHERE user_id = $1 AND type = 'email_verify'`, [userId]);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
