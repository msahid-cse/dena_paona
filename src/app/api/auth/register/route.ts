import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { sanitizeString, generateCode } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, phone, age, gender, password } = body;

    // Validation
    if (!name || !username || !email || !phone || !password) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const cleanName = sanitizeString(name);
    const cleanUsername = sanitizeString(username).toLowerCase();
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanPhone = sanitizeString(phone);

    // Check uniqueness
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2 OR phone = $3',
      [cleanEmail, cleanUsername, cleanPhone]
    );

    if (existingUser.rows.length > 0) {
      const existing = await query(
        'SELECT email, username, phone FROM users WHERE email = $1 OR username = $2 OR phone = $3',
        [cleanEmail, cleanUsername, cleanPhone]
      );
      const row = existing.rows[0];
      if (row.email === cleanEmail) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      if (row.username === cleanUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      if (row.phone === cleanPhone) return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (name, username, email, phone, age, gender, password_hash, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, name, email`,
      [cleanName, cleanUsername, cleanEmail, cleanPhone, age || null, gender || null, passwordHash]
    );

    const newUser = result.rows[0];

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at)
       VALUES ($1, $2, 'email_verify', $3)`,
      [newUser.id, code, expiresAt]
    );

    // Send verification email (non-blocking - don't fail registration if email fails)
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
        : 'Registration successful! Email sending failed - please use resend code option.',
      userId: newUser.id,
      emailSent,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
