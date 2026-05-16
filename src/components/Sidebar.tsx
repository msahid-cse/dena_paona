'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/transactions', icon: '💳', label: 'Transactions' },
  { href: '/transactions/new', icon: '➕', label: 'Add Transaction' },
  { href: '/contacts', icon: '👥', label: 'Contacts' },
  { href: '/activity', icon: '📋', label: 'Activity Log' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

const adminNavItems = [
  { href: '/admin', icon: '🛡️', label: 'Admin Panel' },
  { href: '/admin/users', icon: '👥', label: 'Manage Users' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{ zIndex: 39 }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="logo">
            <div className="logo-icon">💰</div>
            <div>
              <div className="logo-text gradient-text">Dena-Paona</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Finance Ledger</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar avatar-sm">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user?.username}</div>
            </div>
            {user?.isAdmin && (
              <span className="badge badge-purple" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 'auto' }}>ADMIN</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ marginBottom: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px 8px' }}>
            Main Menu
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {user?.isAdmin && (
            <>
              <div style={{ margin: '16px 0 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px' }}>
                Administration
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button className="nav-link" onClick={logout} style={{ color: 'var(--accent-red-light)' }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
