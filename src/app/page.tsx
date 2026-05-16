'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 24, margin: '0 auto 16px' }}>💰</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Dena-Paona...</p>
      </div>
    </div>
  );
}
