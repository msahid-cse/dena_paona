import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const totalUsers = await query('SELECT COUNT(*) FROM users');
    const verifiedUsers = await query('SELECT COUNT(*) FROM users WHERE is_verified = TRUE');
    const bannedUsers = await query('SELECT COUNT(*) FROM users WHERE is_banned = TRUE');
    const totalTransactions = await query('SELECT COUNT(*) FROM transactions');
    const totalVolume = await query('SELECT COALESCE(SUM(amount), 0) as total FROM transactions');
    const recentLogs = await query(
      'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50'
    );
    const recentActivity = await query(
      `SELECT al.*, u.name, u.username FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC LIMIT 20`
    );

    return NextResponse.json({
      stats: {
        totalUsers: parseInt(String(totalUsers.rows[0].count)),
        verifiedUsers: parseInt(String(verifiedUsers.rows[0].count)),
        bannedUsers: parseInt(String(bannedUsers.rows[0].count)),
        totalTransactions: parseInt(String(totalTransactions.rows[0].count)),
        totalVolume: parseFloat(String(totalVolume.rows[0].total)),
      },
      recentLogs: recentLogs.rows,
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
