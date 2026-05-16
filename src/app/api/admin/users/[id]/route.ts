import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

type Params = { params: Promise<{ id: string }> };

// GET single user (admin)
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = getUserFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const result = await query(
      `SELECT id, name, username, email, phone, age, gender, is_verified, is_admin, is_banned, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (!result.rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT - Update user (ban/unban/make_admin/remove_admin/verify/edit)
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = getUserFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { action, name, email, phone, password } = body;

    if (id === admin.userId && ['ban', 'remove_admin'].includes(action)) {
      return NextResponse.json({ error: 'Cannot perform this action on your own account' }, { status: 400 });
    }

    if (action === 'ban') {
      await query('UPDATE users SET is_banned = TRUE, updated_at = NOW() WHERE id = $1', [id]);
      await query(`INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'user_banned', $2)`,
        [admin.userId, `Admin banned user ${id}`]);
      return NextResponse.json({ success: true, message: 'User banned' });
    }
    if (action === 'unban') {
      await query('UPDATE users SET is_banned = FALSE, updated_at = NOW() WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'User unbanned' });
    }
    if (action === 'make_admin') {
      await query('UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'User promoted to admin' });
    }
    if (action === 'remove_admin') {
      await query('UPDATE users SET is_admin = FALSE, updated_at = NOW() WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'Admin privileges removed' });
    }
    if (action === 'verify') {
      await query('UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1', [id]);
      return NextResponse.json({ success: true, message: 'User verified' });
    }
    if (action === 'edit') {
      const updates: string[] = [];
      const vals: unknown[] = [];
      let idx = 1;
      if (name) { updates.push(`name = $${idx++}`); vals.push(name); }
      if (email) { updates.push(`email = $${idx++}`); vals.push(email.toLowerCase()); }
      if (phone) { updates.push(`phone = $${idx++}`); vals.push(phone); }
      if (password) {
        const hash = await bcrypt.hash(password, 12);
        updates.push(`password_hash = $${idx++}`); vals.push(hash);
      }
      if (!updates.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      updates.push(`updated_at = NOW()`);
      vals.push(id);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
      return NextResponse.json({ success: true, message: 'User updated' });
    }

    // legacy support
    if (['ban','unban','delete','make_admin','remove_admin'].includes(action)) {
      await query(`UPDATE users SET ${action === 'ban' ? 'is_banned = TRUE' : action === 'unban' ? 'is_banned = FALSE' : action === 'make_admin' ? 'is_admin = TRUE' : 'is_admin = FALSE'}, updated_at = NOW() WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = getUserFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (id === admin.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  try {
    const targetUser = await query('SELECT username FROM users WHERE id = $1', [id]);
    if (targetUser.rows[0]?.username === 'admindenapaona') {
      return NextResponse.json({ error: 'Cannot delete the super admin account' }, { status: 403 });
    }
    await query('DELETE FROM users WHERE id = $1', [id]);
    await query(`INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'user_deleted', $2)`,
      [admin.userId, `Admin deleted user ${id}`]);
    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
