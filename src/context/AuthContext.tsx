import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role } from '@/lib/types';

const TOKEN_KEY = 'ouonex_admin_token';
const ROLE_KEY = 'ouonex_admin_role';

interface AuthCtx {
  token: string | null;
  role: Role | null;
  login: (token: string, role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem(ROLE_KEY) as Role | null) ?? null);

  const login = useCallback((t: string, r: Role) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(ROLE_KEY, r);
    setToken(t);
    setRole(r);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setRole(null);
  }, []);

  const v: AuthCtx = { token, role, login, logout, isAuthenticated: !!token };
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
