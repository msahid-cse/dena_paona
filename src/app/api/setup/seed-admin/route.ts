import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { initializeDatabase } from '@/lib/init-db';

// POST /api/setup/seed-admin
// Seeds the super admin and clears all test data
export async function POST(req: NextRequest) {
  try {
    // Security: only allow if a secret header matches or in dev/setup mode
    const authHeader = req.headers.get('x-setup-secret');
    const setupSecret = process.env.SETUP_SECRET || 'DENA_SETUP_2024';
    
    if (authHeader !== setupSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Initialize DB schema first
    await initializeDatabase();

    // 1. Delete ALL existing data (clean slate)
    await query('DELETE FROM payment_history');
    await query('DELETE FROM activity_logs');
    await query('DELETE FROM system_logs');
    await query('DELETE FROM transactions');
    await query('DELETE FROM verification_codes');
    await query('DELETE FROM contacts');
    await query('DELETE FROM users');

    // 2. Create super admin
    const passwordHash = await bcrypt.hash('DENA@12345#paona', 12);
    
    const result = await query(
      `INSERT INTO users (name, username, email, phone, password_hash, is_verified, is_admin)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       ON CONFLICT (username) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, is_admin = TRUE, is_verified = TRUE
       RETURNING id, name, username, email`,
      [
        'Super Admin',
        'admindenapaona',
        'admin@denapaona.com',
        '01700000000',
        passwordHash,
      ]
    );

    const admin = result.rows[0];

    // Log the setup
    await query(
      `INSERT INTO system_logs (level, message) VALUES ('info', $1)`,
      [`Super admin seeded: ${admin.username} at ${new Date().toISOString()}`]
    );

    return NextResponse.json({
      success: true,
      message: 'Database cleaned and super admin created',
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
      }
    });

  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ error: 'Setup failed', details: String(error) }, { status: 500 });
  }
}

// GET - Initialize DB schema only (no data deletion)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-setup-secret');
    const setupSecret = process.env.SETUP_SECRET || 'DENA_SETUP_2024';
    if (authHeader !== setupSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
