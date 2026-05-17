import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { sanitizeString, generateCode } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validation — only name, email, password required now
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();

    // Check email uniqueness only
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user — username/phone left NULL, will be set later
    const result = await query(
      `INSERT INTO users (name, email, password_hash, is_verified, username_set, profile_completed)
       VALUES ($1, $2, $3, FALSE, FALSE, FALSE)
       RETURNING id, name, email`,
      [cleanName, cleanEmail, passwordHash]
    );

    const newUser = result.rows[0];

    // Generate email verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'email_verify', $3)`,
      [newUser.id, code, expiresAt]
    );

    let emailSent = true;
    try {
      await sendVerificationEmail(cleanEmail, cleanName, code);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      emailSent = false;
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Registration successful! Please check your email for verification code.'
        : 'Registration successful! Email sending failed — please use resend code option.',
      userId: newUser.id,
      emailSent,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
