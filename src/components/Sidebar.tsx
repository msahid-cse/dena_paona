'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'dashboard' },
  { href: '/transactions', icon: '💳', label: 'transactions' },
  { href: '/transactions/new', icon: '➕', label: 'addTransaction' },
  { href: '/contacts', icon: '👥', label: 'contacts' },
  { href: '/activity', icon: '📋', label: 'activityLog' },
  { href: '/profile', icon: '👤', label: 'profile' },
];

const adminNavItems = [
  { href: '/admin', icon: '🛡️', label: 'adminPanel' },
  { href: '/admin/users', icon: '👥', label: 'manageUsers' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'banglish', label: 'বাংলিশ' },
  ];

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
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user?.username}</div>
            </div>
            {user?.isAdmin && (
              <span className="badge badge-purple" style={{ fontSize: 9, padding: '2px 6px' }}>ADMIN</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ marginBottom: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px 8px' }}>
            {t('mainMenu', language)}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {t(item.label as keyof typeof t, language)}
            </Link>
          ))}

          {user?.isAdmin && (
            <>
              <div style={{ margin: '16px 0 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px' }}>
                {t('administration', language)}
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {t(item.label as keyof typeof t, language)}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Settings */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="nav-link"
            style={{ color: 'var(--text-secondary)', justifyContent: 'space-between' }}
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>{theme === 'dark' ? t('darkMode', language) : t('lightMode', language)}</span>
          </button>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="nav-link"
              style={{ color: 'var(--text-secondary)', justifyContent: 'space-between' }}
            >
              <span>🌐</span>
              <span>{language === 'en' ? '📍' : ''}</span>
            </button>
            {showLanguageMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 8,
                right: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: 4,
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: language === lang.code ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      color: language === lang.code ? 'var(--accent-purple-light)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: language === lang.code ? 600 : 500,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      if (language !== lang.code) {
                        el.style.background = 'rgba(99, 102, 241, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      if (language !== lang.code) {
                        el.style.background = 'transparent';
                      }
                    }}
                  >
                    {lang.label} {language === lang.code && '✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: '12px' }}>
          <button className="nav-link" onClick={logout} style={{ color: 'var(--accent-red-light)' }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            {t('logout', language)}
          </button>
        </div>
      </aside>
    </>
  );
}
