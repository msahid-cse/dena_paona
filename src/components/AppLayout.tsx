'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 22, padding: '4px 8px', lineHeight: 1 }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="logo-text gradient-text" style={{ marginLeft: 12, fontSize: 16, fontWeight: 800 }}>
            💰 {t('appName')}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
