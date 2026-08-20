import type { Role } from './types';

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: 'owner', label: 'Owner', description: 'Full access including team management' },
  { id: 'admin', label: 'Admin', description: 'Full access except team management' },
  { id: 'finance', label: 'Finance', description: 'Finance + Overview only' },
  { id: 'support', label: 'Support', description: 'Read-only on Users & Products' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only on Overview & Products' },
];

export type PageKey =
  | 'overview'
  | 'dawaty'
  | 'digital_menu'
  | 'finance'
  | 'ai_usage'
  | 'users'
  | 'settings'
  | 'website';

const PAGE_ACCESS: Record<Role, PageKey[]> = {
  owner: ['overview', 'dawaty', 'digital_menu', 'finance', 'ai_usage', 'users', 'settings', 'website'],
  admin: ['overview', 'dawaty', 'digital_menu', 'finance', 'ai_usage', 'users', 'settings', 'website'],
  finance: ['overview', 'finance'],
  support: ['overview', 'dawaty', 'digital_menu', 'users'],
  viewer: ['overview', 'dawaty', 'digital_menu'],
};

export function canAccess(role: Role, page: PageKey): boolean {
  return PAGE_ACCESS[role].includes(page);
}

export function canApprovePayments(role: Role): boolean {
  return role === 'owner' || role === 'admin' || role === 'finance';
}

export function canManageTeam(role: Role): boolean {
  return role === 'owner';
}

export function canViewSettings(role: Role): boolean {
  return role === 'owner' || role === 'admin';
}
