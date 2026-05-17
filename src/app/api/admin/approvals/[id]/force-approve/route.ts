import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Admin only
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [user.userId]);
    if (!adminCheck.rows[0]?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const paymentResult = await query('SELECT * FROM payment_history WHERE id = $1', [id]);
    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await query(
      `UPDATE payment_history
       SET approval_status = 'force_approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [user.userId, id]
    );

    const payment = paymentResult.rows[0];

    // Notify both parties
    const transactionResult = await query(
      'SELECT owner_id, contact_user_id FROM transactions WHERE id = $1',
      [payment.transaction_id]
    );
    const tx = transactionResult.rows[0];
    const notifyIds = [tx?.owner_id, tx?.contact_user_id].filter(Boolean);

    for (const recipientId of notifyIds) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
         VALUES ($1, $2, 'admin_force_approved', $3, $4, $5)`,
        [
          recipientId,
          user.userId,
          '🛡️ Admin Approved',
          `A disputed payment of ৳${parseFloat(payment.amount).toLocaleString()} has been force-approved by admin.`,
          JSON.stringify({ paymentId: id, amount: payment.amount }),
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Force approve error:', error);
    return NextResponse.json({ error: 'Force approval failed' }, { status: 500 });
  }
}
