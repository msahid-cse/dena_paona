import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { action } = await req.json(); // ban, unban, delete, make_admin, remove_admin

    if (id === user.userId) {
      return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
    }

    switch (action) {
      case 'ban':
        await query('UPDATE users SET is_banned = TRUE, updated_at = NOW() WHERE id = $1', [id]);
        break;
      case 'unban':
        await query('UPDATE users SET is_banned = FALSE, updated_at = NOW() WHERE id = $1', [id]);
        break;
      case 'delete':
        await query('DELETE FROM users WHERE id = $1', [id]);
        break;
      case 'make_admin':
        await query('UPDATE users SET is_admin = TRUE, updated_at = NOW() WHERE id = $1', [id]);
        break;
      case 'remove_admin':
        await query('UPDATE users SET is_admin = FALSE, updated_at = NOW() WHERE id = $1', [id]);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await query(
      `INSERT INTO system_logs (level, message, metadata) VALUES ('info', $1, $2)`,
      [`Admin action: ${action} on user ${id}`, JSON.stringify({ adminId: user.userId, targetUserId: id, action })]
    );

    return NextResponse.json({ success: true, message: `Action '${action}' completed` });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Admin action failed' }, { status: 500 });
  }
}
