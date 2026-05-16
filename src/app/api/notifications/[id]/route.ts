import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

// POST - Approve or reject a transaction notification
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action } = await req.json(); // 'approve' | 'reject'

    // Get the notification
    const notifResult = await query(
      `SELECT * FROM notifications WHERE id = $1 AND recipient_id = $2 AND type = 'transaction_request' AND is_actioned = FALSE`,
      [id, user.userId]
    );

    if (!notifResult.rows.length) {
      return NextResponse.json({ error: 'Notification not found or already actioned' }, { status: 404 });
    }

    const notif = notifResult.rows[0];
    const data = notif.data as {
      transactionId: string;
      amount: number;
      senderName: string;
      senderId: string;
      notes?: string;
    };

    if (action === 'approve') {
      // Create the mirrored transaction in the recipient's dena list
      await query(
        `INSERT INTO transactions (owner_id, contact_user_id, contact_name, amount, paid_amount, type, notes)
         VALUES ($1, $2, $3, $4, 0, 'dena', $5)`,
        [user.userId, data.senderId, data.senderName, data.amount, data.notes || `Approved from ${data.senderName}'s paona request`]
      );

      // Log activity
      await query(
        `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'transaction_approved', $2)`,
        [user.userId, `Approved dena of ৳${data.amount} to ${data.senderName}`]
      );

      // Notify the sender that it was approved
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
         VALUES ($1, $2, 'transaction_approved', $3, $4, $5)`,
        [
          data.senderId,
          user.userId,
          'Transaction Approved ✅',
          `Your paona request of ৳${data.amount} was approved by the other party. It's now in their dena list.`,
          JSON.stringify({ amount: data.amount, approvedBy: user.userId }),
        ]
      );
    } else {
      // Notify the sender of rejection
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
         VALUES ($1, $2, 'transaction_rejected', $3, $4, $5)`,
        [
          data.senderId,
          user.userId,
          'Transaction Declined ❌',
          `Your paona request of ৳${data.amount} was declined.`,
          JSON.stringify({ amount: data.amount }),
        ]
      );
    }

    // Mark notification as actioned
    await query(
      `UPDATE notifications SET is_actioned = TRUE, action_taken = $1, is_read = TRUE WHERE id = $2`,
      [action, id]
    );

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
