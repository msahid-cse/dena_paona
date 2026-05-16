import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './jwt';

export function withAuth(handler: (req: NextRequest, user: { userId: string; email: string; username: string; isAdmin: boolean }) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, user);
  };
}

export function withAdminAuth(handler: (req: NextRequest, user: { userId: string; email: string; username: string; isAdmin: boolean }) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    return handler(req, user);
  };
}

export function validateInput(data: Record<string, unknown>, required: string[]): string | null {
  for (const field of required) {
    if (!data[field] || (typeof data[field] === 'string' && !(data[field] as string).trim())) {
      return `${field} is required`;
    }
  }
  return null;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
