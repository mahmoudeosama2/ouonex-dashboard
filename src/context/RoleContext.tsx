import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Role } from '@/lib/types';
import { canAccess, canApprovePayments, canManageTeam, canViewSettings, type PageKey } from '@/lib/rbac';

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  can: (page: PageKey) => boolean;
  canApprove: boolean;
  canManageTeam: boolean;
  canViewSettings: boolean;
  actorName: string;
}

const Ctx = createContext<RoleCtx | null>(null);

const ACTOR: Record<Role, string> = {
  owner: 'You',
  admin: 'You',
  finance: 'Nour Hassan',
  support: 'Omar Fouad',
  viewer: 'Salma Ibrahim',
};

export function RoleProvider({ children, initialRole }: { children: ReactNode; initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole ?? 'owner');
  const v: RoleCtx = {
    role,
    setRole,
    can: (p) => canAccess(role, p),
    canApprove: canApprovePayments(role),
    canManageTeam: canManageTeam(role),
    canViewSettings: canViewSettings(role),
    actorName: ACTOR[role],
  };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRole must be inside RoleProvider');
  return c;
}
