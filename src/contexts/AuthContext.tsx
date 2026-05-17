'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  isAdmin: boolean;
  usernameSet: boolean;
  profileCompleted: boolean;
  profilePicture: string | null;
  bkashAvailable: boolean;
  languagePref: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; userId?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('dp_token');
    const savedUser = localStorage.getItem('dp_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { identifier, password });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('dp_token', newToken);
      localStorage.setItem('dp_user', JSON.stringify(newUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error,
          needsVerification: error.response.data.needsVerification,
          userId: error.response.data.userId
        };
      }
      return { success: false, error: 'Login failed' };
    }
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('dp_token');
    if (!savedToken) return;
    try {
      const res = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${savedToken}` } });
      const u = res.data.user;
      const updatedUser: User = {
        id: u.id,
        name: u.name,
        username: u.username ?? null,
        email: u.email,
        phone: u.phone ?? null,
        isAdmin: u.is_admin,
        usernameSet: u.username_set ?? false,
        profileCompleted: u.profile_completed ?? false,
        profilePicture: u.profile_picture ?? null,
        bkashAvailable: u.bkash_available ?? false,
        languagePref: u.language_pref ?? 'en',
      };
      setUser(updatedUser);
      localStorage.setItem('dp_user', JSON.stringify(updatedUser));
    } catch {
      // fail silently
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('dp_token');
    localStorage.removeItem('dp_user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
