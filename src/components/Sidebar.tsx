'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: '/dashboard', icon: '📊', label: t('dashboard') },
    { href: '/transactions', icon: '💳', label: t('transactions') },
    { href: '/transactions/new', icon: '➕', label: t('addTransaction') },
    { href: '/contacts', icon: '👥', label: t('contacts') },
    { href: '/activity', icon: '📋', label: t('activityLog') },
    { href: '/profile', icon: '👤', label: t('profile') },
  ];

  const adminNavItems = [
    { href: '/admin', icon: '🛡️', label: t('adminPanel') },
    { href: '/admin/users', icon: '👥', label: t('manageUsers') },
  ];

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {mobileOpen && (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{ zIndex: 39, background: 'rgba(0,0,0,0.6)' }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="logo">
            <div className="logo-icon">💰</div>
            <div>
              <div className="logo-text gradient-text">{t('appName')}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{t('tagline')}</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar avatar-sm">{getInitials(user.name)}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user.username}</div>
              </div>
              {user.isAdmin && (
                <span className="badge badge-purple" style={{ fontSize: 9, padding: '2px 6px' }}>ADMIN</span>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '10px 10px', overflow: 'auto' }}>
          <div style={{ marginBottom: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 6px 6px' }}>
            {t('mainMenu')}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 13 }}>{item.label}</span>
            </Link>
          ))}

          {user?.isAdmin && (
            <>
              <div style={{ margin: '14px 0 6px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 6px' }}>
                {t('administration')}
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Theme + Language + Logout */}
        <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Theme & Language row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
              style={{ flex: '0 0 auto' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <select
              className="lang-select"
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
              style={{ flex: 1 }}
            >
              <option value="en">🇬🇧 English</option>
              <option value="bn">🇧🇩 বাংলা</option>
              <option value="banglish">🔤 Banglish</option>
            </select>
          </div>

          {/* Logout */}
          <button className="nav-link" onClick={logout} style={{ color: 'var(--accent-red-light)', padding: '10px 14px' }}>
            <span style={{ fontSize: 15 }}>🚪</span>
            <span style={{ fontSize: 13 }}>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
