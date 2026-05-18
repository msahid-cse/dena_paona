'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Temporarily set token directly to localStorage and axios before calling refreshUser
      localStorage.setItem('dp_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      refreshUser().then(() => {
        router.push('/dashboard');
      }).catch((err) => {
        console.error('Failed to fetch user profile after OAuth:', err);
        router.push('/login?error=failed_to_fetch_user');
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Completing Login</h2>
        <p className="text-[var(--text-secondary)]">Please wait a moment while we set up your account...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
