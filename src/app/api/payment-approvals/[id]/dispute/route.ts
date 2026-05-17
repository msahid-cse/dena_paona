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
    const { reason, proof } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 });
    }

    const paymentResult = await query(
      `SELECT ph.*, t.owner_id, t.contact_user_id
       FROM payment_history ph
       JOIN transactions t ON t.id = ph.transaction_id
       WHERE ph.id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];

    if (payment.contact_user_id !== user.userId && payment.owner_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to dispute this payment' }, { status: 403 });
    }

    await query(
      `UPDATE payment_history
       SET approval_status = 'disputed', dispute_reason = $1, dispute_proof = $2
       WHERE id = $3`,
      [reason, proof || null, id]
    );

    // Notify admins
    const adminResult = await query('SELECT id FROM users WHERE is_admin = TRUE');
    for (const admin of adminResult.rows) {
      await query(
        `INSERT INTO notifications (recipient_id, sender_id, type, title, message, data)
         VALUES ($1, $2, 'payment_dispute', $3, $4, $5)`,
        [
          admin.id,
          user.userId,
          '⚠️ Payment Dispute',
          `A payment entry of ৳${parseFloat(payment.amount).toLocaleString()} is being disputed. Admin review required.`,
          JSON.stringify({ paymentId: id, amount: payment.amount, reason }),
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment dispute error:', error);
    return NextResponse.json({ error: 'Dispute submission failed' }, { status: 500 });
  }
}
