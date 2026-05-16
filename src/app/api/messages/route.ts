import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

// GET - get conversation with a user, or list conversations
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUser = searchParams.get('with');

  try {
    if (withUser) {
      // Get messages between current user and withUser
      const result = await query(
        `SELECT m.*, 
          s.name as sender_name, s.username as sender_username,
          r.name as recipient_name, r.username as recipient_username
         FROM messages m
         JOIN users s ON m.sender_id = s.id
         JOIN users r ON m.recipient_id = r.id
         WHERE (m.sender_id = $1 AND m.recipient_id = $2)
            OR (m.sender_id = $2 AND m.recipient_id = $1)
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [user.userId, withUser]
      );

      // Mark messages from the other user as read
      await query(
        `UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND recipient_id = $2 AND is_read = FALSE`,
        [withUser, user.userId]
      );

      return NextResponse.json({ messages: result.rows });
    }

    // List all conversations (latest message per contact)
    const result = await query(
      `SELECT DISTINCT ON (other_user_id)
        other_user_id,
        u.name as other_name,
        u.username as other_username,
        m.content as last_message,
        m.created_at as last_message_time,
        m.sender_id as last_sender_id,
        COUNT(CASE WHEN m2.is_read = FALSE AND m2.sender_id = other_user_id THEN 1 END) as unread_count
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as other_user_id,
           id, content, created_at, sender_id
         FROM messages
         WHERE sender_id = $1 OR recipient_id = $1
       ) conv
       JOIN messages m ON m.id = conv.id
       JOIN users u ON u.id = conv.other_user_id
       LEFT JOIN messages m2 ON (
         (m2.sender_id = conv.other_user_id AND m2.recipient_id = $1)
       )
       GROUP BY other_user_id, u.name, u.username, m.content, m.created_at, m.sender_id
       ORDER BY other_user_id, m.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ conversations: result.rows });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - send a message
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { recipientId, content } = await req.json();
    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: 'Recipient and message content are required' }, { status: 400 });
    }

    // Verify recipient exists
    const recipientResult = await query('SELECT id, name FROM users WHERE id = $1', [recipientId]);
    if (!recipientResult.rows.length) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [user.userId, recipientId, content.trim()]
    );

    return NextResponse.json({ success: true, message: result.rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
