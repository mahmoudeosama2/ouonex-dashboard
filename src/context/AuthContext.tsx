import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, AdminUser } from '@/lib/types';

const TOKEN_KEY = 'ouonex_admin_token';
const ROLE_KEY = 'ouonex_admin_role';
const ADMIN_USER_KEY = 'ouonex_admin_user';

interface AuthCtx {
  token: string | null;
  role: Role | null;
  admin: AdminUser | null;
  login: (token: string, role: Role, admin?: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem(ROLE_KEY) as Role | null) ?? null);
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((t: string, r: Role, user?: AdminUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(ROLE_KEY, r);
    if (user) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    }
    setToken(t);
    setRole(r);
    setAdmin(user ?? null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setToken(null);
    setRole(null);
    setAdmin(null);
  }, []);

  const v: AuthCtx = { token, role, admin, login, logout, isAuthenticated: !!token };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

