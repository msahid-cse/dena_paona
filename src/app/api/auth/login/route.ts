import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/jwt';

interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const result = await query(
      `SELECT id, name, username, email, phone, password_hash, is_verified, is_admin, is_banned
       FROM users WHERE email = $1 OR username = $1`,
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0] as unknown as UserRow;

    if (user.is_banned) {
      return NextResponse.json({ error: 'Your account has been banned. Contact support.' }, { status: 403 });
    }

    if (!user.is_verified) {
      return NextResponse.json({
        error: 'Please verify your email before logging in.',
        userId: user.id,
        needsVerification: true
      }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin,
    });

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'login', 'User logged in')`,
      [user.id]
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isAdmin: user.is_admin,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
