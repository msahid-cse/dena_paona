import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

// GET - fetch notifications for current user
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const whereExtra = unreadOnly ? 'AND n.is_read = FALSE' : '';

    const result = await query(
      `SELECT n.*, u.name as sender_name, u.username as sender_username
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = $1 ${whereExtra}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [user.userId]
    );

    const unreadCount = await query(
      `SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = FALSE`,
      [user.userId]
    );

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: parseInt(String(unreadCount.rows[0].count)),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT - mark notifications as read
export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { notificationId, markAllRead } = await req.json();

    if (markAllRead) {
      await query(
        `UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1`,
        [user.userId]
      );
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2`,
        [notificationId, user.userId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
