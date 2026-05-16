'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        {/* Mobile header */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }} className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >
            ☰
          </button>
          <span className="logo-text gradient-text" style={{ marginLeft: 12, fontSize: 16, fontWeight: 800 }}>💰 Dena-Paona</span>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .mobile-header { display: flex !important; }
          }
        `}</style>
        {children}
      </main>
    </div>
  );
}
