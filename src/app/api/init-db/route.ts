import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';
import { getUserFromRequest } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}

// Allow unauthenticated initialization during first setup
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
