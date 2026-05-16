import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

// Admin-only: Get all users
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1 OR phone ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const totalCount = parseInt(String(countResult.rows[0].count));

    const queryParams = search ? [...params, limit, offset] : [limit, offset];
    const paramOffset = search ? 2 : 1;

    const usersResult = await query(
      `SELECT id, name, username, email, phone, age, gender, is_verified, is_admin, is_banned, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramOffset} OFFSET $${paramOffset + 1}`,
      queryParams
    );

    // Get transaction stats per user
    const userIds = usersResult.rows.map(u => u.id);
    let transactionStats: Record<string, unknown> = {};
    
    if (userIds.length > 0) {
      const statsResult = await query(
        `SELECT owner_id, COUNT(*) as transaction_count, SUM(amount) as total_amount
         FROM transactions WHERE owner_id = ANY($1)
         GROUP BY owner_id`,
        [userIds]
      );
      transactionStats = Object.fromEntries(
        statsResult.rows.map(r => [r.owner_id, r])
      );
    }

    const usersWithStats = usersResult.rows.map(u => ({
      ...u,
      stats: transactionStats[u.id as string] || { transaction_count: 0, total_amount: 0 }
    }));

    return NextResponse.json({
      users: usersWithStats,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
