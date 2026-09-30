import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role } from '@/lib/types';
import { canAccess, canApprovePayments, canManageTeam, canViewSettings, type PageKey } from '@/lib/rbac';
import { useAuth } from './AuthContext';

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  can: (page: PageKey) => boolean;
  canApprove: boolean;
  canManageTeam: boolean;
  canViewSettings: boolean;
  actorName: string;
  isOwner: boolean;
  assignedApps: string[];
  permissions: PageKey[];
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children, initialRole }: { children: ReactNode; initialRole?: Role }) {
  const { admin, role: authRole } = useAuth();
  const [role, setRole] = useState<Role>(initialRole ?? authRole ?? 'owner');

  useEffect(() => {
    if (authRole) setRole(authRole);
  }, [authRole]);

  const customPermissions = admin?.permissions as PageKey[] | undefined;
  const assignedApps = (admin?.assigned_apps ?? []) as string[];
  const isOwner = role === 'owner';
  const actorName = admin?.name || 'You';

  const v: RoleCtx = {
    role,
    setRole,
    can: (p) => canAccess(role, p, customPermissions, assignedApps),
    canApprove: canApprovePayments(role, customPermissions),
    canManageTeam: canManageTeam(role),
    canViewSettings: canViewSettings(role, customPermissions),
    actorName,
    isOwner,
    assignedApps,
    permissions: customPermissions ?? [],
  };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRole must be inside RoleProvider');
  return c;
}

