import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=no_code`);
  }

  const redirectUri = `${url.origin}/api/auth/oauth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_not_configured`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Google');
    }

    // 2. Get user info using access token
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userRes.json();

    if (!userData.email) {
      throw new Error('No email found in Google profile');
    }

    // 3. Check if user already exists in DB
    let userResult = await query('SELECT * FROM users WHERE email = $1', [userData.email]);
    let user = userResult.rows[0];

    // 4. Create user if they don't exist
    if (!user) {
      const insertRes = await query(
        `INSERT INTO users (name, email, password_hash, is_verified, profile_picture) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userData.name, userData.email, uuidv4(), true, userData.picture]
      );
      user = insertRes.rows[0];
    } else if (!user.profile_picture && userData.picture) {
      // Update profile picture if user exists but has none
      await query(`UPDATE users SET profile_picture = $1 WHERE id = $2`, [userData.picture, user.id]);
      user.profile_picture = userData.picture;
    }

    // 5. Generate JWT token for our system
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 6. Redirect to frontend callback page with the token
    return NextResponse.redirect(`${url.origin}/oauth-callback?token=${jwtToken}&provider=google`);

  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${url.origin}/login?error=oauth_error`);
  }
}
