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

    const { id } = await params;

    // Get the payment record
    const paymentResult = await query(
      `SELECT ph.*, t.owner_id, t.contact_user_id, t.type, t.amount as transaction_amount, t.contact_name
       FROM payment_history ph
       JOIN transactions t ON t.id = ph.transaction_id
       WHERE ph.id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];

    // Only the contact user (the other party) can approve
    if (payment.contact_user_id !== user.userId && payment.owner_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to approve this payment' }, { status: 403 });
    }

    // Approver should not be the recorder
    if (payment.recorded_by === user.userId) {
      return NextResponse.json({ error: 'You cannot approve your own payment entry' }, { status: 403 });
    }

    await query(
      `UPDATE payment_history
       SET approval_status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [user.userId, id]
    );

    // Notify the recorder
    const recorderResult = await query('SELECT name FROM users WHERE id = $1', [payment.recorded_by || payment.owner_id]);
    const recorderName = recorderResult.rows[0]?.name || 'Someone';

    await query(
      `INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
       VALUES ($1, $2, 'payment_approved', $3, $4, $5)`,
      [
        payment.recorded_by || payment.owner_id,
        user.userId,
        '✅ Payment Approved',
        `Your payment entry of ৳${parseFloat(payment.amount).toLocaleString()} has been approved.`,
        JSON.stringify({ paymentId: id, amount: payment.amount }),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment approval error:', error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
