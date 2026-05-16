import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import { sendTransactionNotification } from '@/lib/email';

// GET single transaction
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const result = await query(
      `SELECT t.*, u.name as contact_registered_name, u.username as contact_username, u.email as contact_email
       FROM transactions t
       LEFT JOIN users u ON t.contact_user_id = u.id
       WHERE t.id = $1 AND (t.owner_id = $2 OR t.contact_user_id = $2)`,
      [id, user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const paymentHistory = await query(
      'SELECT * FROM payment_history WHERE transaction_id = $1 ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json({ transaction: result.rows[0], paymentHistory: paymentHistory.rows });
  } catch (error) {
    console.error('Transaction get error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

// PUT - Update transaction (partial payment or edit)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const body = await req.json();
    const { paymentAmount, amount, notes, dueDate } = body;

    // Verify ownership
    const existing = await query(
      'SELECT * FROM transactions WHERE id = $1 AND owner_id = $2',
      [id, user.userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
    }

    const transaction = existing.rows[0];

    let updateQuery = '';
    let updateParams: unknown[] = [];

    if (paymentAmount !== undefined) {
      // Partial payment
      const newPaidAmount = parseFloat(transaction.paid_amount) + parseFloat(paymentAmount);
      if (newPaidAmount > parseFloat(transaction.amount)) {
        return NextResponse.json({ error: 'Payment exceeds remaining balance' }, { status: 400 });
      }

      updateQuery = `UPDATE transactions SET paid_amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
      updateParams = [newPaidAmount, id];

      // Record payment history
      await query(
        'INSERT INTO payment_history (transaction_id, amount, notes) VALUES ($1, $2, $3)',
        [id, paymentAmount, notes || `Payment of ৳${paymentAmount}`]
      );
    } else {
      // Edit transaction
      updateQuery = `UPDATE transactions SET 
        amount = COALESCE($1, amount), 
        notes = COALESCE($2, notes),
        due_date = COALESCE($3, due_date),
        updated_at = NOW() 
        WHERE id = $4 RETURNING *`;
      updateParams = [amount || null, notes || null, dueDate || null, id];
    }

    const result = await query(updateQuery, updateParams);
    const updatedTransaction = result.rows[0];

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'transaction_updated', $2)`,
      [user.userId, `Updated transaction ${id}`]
    );

    // Notify contact if registered
    if (transaction.contact_user_id) {
      try {
        const contactUser = await query('SELECT name, email FROM users WHERE id = $1', [transaction.contact_user_id]);
        const ownerUser = await query('SELECT name FROM users WHERE id = $1', [user.userId]);
        if (contactUser.rows.length > 0 && ownerUser.rows.length > 0) {
          const notifType = parseFloat(updatedTransaction.remaining_amount) === 0 ? 'cleared' : 'updated';
          await sendTransactionNotification(
            contactUser.rows[0].email,
            contactUser.rows[0].name,
            ownerUser.rows[0].name,
            notifType,
            updatedTransaction.type,
            updatedTransaction.amount,
            updatedTransaction.remaining_amount,
            notes
          );
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return NextResponse.json({ success: true, transaction: updatedTransaction });
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE - Delete transaction
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const result = await query(
      'DELETE FROM transactions WHERE id = $1 AND owner_id = $2 RETURNING id',
      [id, user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
    }

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'transaction_deleted', $2)`,
      [user.userId, `Deleted transaction ${id}`]
    );

    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    console.error('Transaction delete error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
