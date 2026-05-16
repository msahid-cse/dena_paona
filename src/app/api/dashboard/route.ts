import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Total Paona (receivable) - money others owe me
    const paonaResult = await query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
       FROM transactions 
       WHERE owner_id = $1 AND type = 'paona' AND status != 'cleared'`,
      [user.userId]
    );

    // Total Dena (payable) - money I owe others  
    const denaResult = await query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
       FROM transactions 
       WHERE owner_id = $1 AND type = 'dena' AND status != 'cleared'`,
      [user.userId]
    );

    // Transactions summary by contact
    const byContactResult = await query(
      `SELECT 
        COALESCE(u.name, t.contact_name) as person_name,
        t.contact_user_id,
        t.contact_name,
        u.username,
        SUM(CASE WHEN t.type = 'paona' AND t.status != 'cleared' THEN t.remaining_amount ELSE 0 END) as total_paona,
        SUM(CASE WHEN t.type = 'dena' AND t.status != 'cleared' THEN t.remaining_amount ELSE 0 END) as total_dena,
        COUNT(t.id) as transaction_count,
        MAX(t.updated_at) as last_activity
       FROM transactions t
       LEFT JOIN users u ON t.contact_user_id = u.id
       WHERE t.owner_id = $1
       GROUP BY COALESCE(u.name, t.contact_name), t.contact_user_id, t.contact_name, u.username
       ORDER BY last_activity DESC
       LIMIT 20`,
      [user.userId]
    );

    // Recent activity
    const recentActivity = await query(
      `SELECT al.*, u.name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT 10`,
      [user.userId]
    );

    // Monthly stats
    const monthlyStats = await query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        type,
        SUM(amount) as total
       FROM transactions
       WHERE owner_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY month, type
       ORDER BY month DESC`,
      [user.userId]
    );

    const totalPaona = parseFloat(paonaResult.rows[0].total);
    const totalDena = parseFloat(denaResult.rows[0].total);

    return NextResponse.json({
      summary: {
        totalPaona,
        totalDena,
        netBalance: totalPaona - totalDena,
      },
      byContact: byContactResult.rows,
      recentActivity: recentActivity.rows,
      monthlyStats: monthlyStats.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
