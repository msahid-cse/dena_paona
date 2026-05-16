import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';
import { sendTransactionNotification } from '@/lib/email';

// GET - List all transactions for current user
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // dena, paona
    const status = searchParams.get('status'); // pending, partial, cleared
    const search = searchParams.get('search') || '';

    let queryText = `
      SELECT 
        t.*,
        u.name as contact_registered_name,
        u.username as contact_username,
        u.email as contact_email
      FROM transactions t
      LEFT JOIN users u ON t.contact_user_id = u.id
      WHERE t.owner_id = $1
    `;
    const params: unknown[] = [user.userId];
    let paramIndex = 2;

    if (type) {
      queryText += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (t.contact_name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY t.updated_at DESC';

    const result = await query(queryText, params);
    return NextResponse.json({ transactions: result.rows });
  } catch (error) {
    console.error('Transaction list error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST - Create new transaction
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contactUserId, contactName, contactPhone, amount, type, notes, dueDate } = body;

    if (!amount || !type || (!contactUserId && !contactName)) {
      return NextResponse.json({ error: 'Amount, type, and contact information are required' }, { status: 400 });
    }

    if (!['dena', 'paona'].includes(type)) {
      return NextResponse.json({ error: 'Type must be dena or paona' }, { status: 400 });
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    // Get contact name if registered user
    let finalContactName = contactName;
    let contactEmail = null;
    if (contactUserId) {
      const contactUser = await query('SELECT name, email FROM users WHERE id = $1', [contactUserId]);
      if (contactUser.rows.length > 0) {
        finalContactName = contactUser.rows[0].name;
        contactEmail = contactUser.rows[0].email;
      }
    }

    const result = await query(
      `INSERT INTO transactions (owner_id, contact_user_id, contact_name, contact_phone, amount, paid_amount, type, notes, due_date)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
       RETURNING *`,
      [user.userId, contactUserId || null, finalContactName, contactPhone || null, parseFloat(amount), type, notes || null, dueDate || null]
    );

    const transaction = result.rows[0];

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, description, metadata)
       VALUES ($1, 'transaction_created', $2, $3)`,
      [user.userId, `Created ${type} transaction of ৳${amount} with ${finalContactName}`, JSON.stringify({ transactionId: transaction.id, type, amount })]
    );

    // Send email notification if contact is registered
    if (contactEmail && contactUserId) {
      try {
        const ownerResult = await query('SELECT name FROM users WHERE id = $1', [user.userId]);
        const ownerName = ownerResult.rows[0]?.name || 'Someone';
        await sendTransactionNotification(
          contactEmail,
          finalContactName,
          ownerName,
          'created',
          type,
          parseFloat(amount),
          parseFloat(amount),
          notes
        );
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    console.error('Transaction create error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
