// Single typed API client. Swap MOCK to false (or set VITE_API_BASE_URL) to go live.
// All components import from here — never scatter fetch calls in components.

import type {
  OverviewKPIs, RevenuePoint, UserGrowthPoint, ProductComparison,
  ActivityItem, Payment, Invitation, Restaurant, Order, AIScan,
  AIUsageSummary, AuditLogEntry, TeamMember, HealthIndicator,
  UserSearchResult, Paginated, Product, WebsiteContent,
} from './types';

import * as mock from './mock-data';

const MOCK = !(import.meta.env.VITE_API_BASE_URL ?? '').startsWith('http');
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.ouonex.com/v1';

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ouonex_admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

async function httpPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

// Simulated latency for mock mode
function delay<T>(v: T, ms = 350): Promise<T> {
  return new Promise(r => setTimeout(() => r(v), ms));
}

export const api = {
  isMock: MOCK,

  overview: {
    kpis: (): Promise<OverviewKPIs> => MOCK ? delay(mock.overviewKPIs) : http('/dashboard/overview'),
    revenueTrend: (days: number): Promise<RevenuePoint[]> => MOCK ? delay(mock.revenueTrend(days)) : http(`/dashboard/analytics/revenue?period=${days}d`),
    userGrowth: (days: number): Promise<UserGrowthPoint[]> => MOCK ? delay(mock.userGrowthTrend(days)) : http(`/dashboard/analytics/users?period=${days}d`),
    comparison: (): Promise<ProductComparison[]> => MOCK ? delay(mock.productComparison) : http('/dashboard/overview/comparison'),
    activity: (): Promise<ActivityItem[]> => MOCK ? delay(mock.recentActivity) : http('/dashboard/overview/activity'),
  },

  payments: {
    list: (f?: { product?: Product; status?: string; from?: string; to?: string; page?: number; per_page?: number }): Promise<Paginated<Payment>> =>
      MOCK ? delay(mock.payments(f)) : http(`/dashboard/payments?${new URLSearchParams(f as Record<string,string>).toString()}`),
    pending: (): Promise<Payment[]> => MOCK ? delay(mock.pendingPayments()) : http('/dashboard/payments?status=pending_review'),
    approve: (id: string, actor: string): Promise<Payment | undefined> =>
      MOCK ? delay(mock.approvePayment(id, actor)) : httpPost(`/dashboard/payments/${id}/approve`),
    reject: (id: string, reason: string, actor: string): Promise<Payment | undefined> =>
      MOCK ? delay(mock.rejectPayment(id, reason, actor)) : httpPost(`/dashboard/payments/${id}/reject`, { reason }),
  },

  dawaty: {
    invitations: (f?: { status?: string; page?: number; per_page?: number }): Promise<Paginated<Invitation>> =>
      MOCK ? delay(mock.invitations(f)) : http(`/dashboard/dawaty/invitations?${new URLSearchParams(f as Record<string,string>).toString()}`),
    invitation: (id: string): Promise<Invitation | undefined> =>
      MOCK ? delay(mock.invitationDetail(id)) : http(`/dashboard/dawaty/invitations/${id}`),
  },

  digitalMenu: {
    restaurants: (f?: { status?: string; page?: number; per_page?: number }): Promise<Paginated<Restaurant>> =>
      MOCK ? delay(mock.restaurants(f)) : http(`/dashboard/digital-menu/restaurants?${new URLSearchParams(f as Record<string,string>).toString()}`),
    restaurant: (id: string): Promise<Restaurant | undefined> =>
      MOCK ? delay(mock.restaurantDetail(id)) : http(`/dashboard/digital-menu/restaurants/${id}`),
    orders: (f?: { status?: string; page?: number; per_page?: number }): Promise<Paginated<Order>> =>
      MOCK ? delay(mock.orders(f)) : http(`/dashboard/digital-menu/orders?${new URLSearchParams(f as Record<string,string>).toString()}`),
  },

  ai: {
    scans: (f?: { from?: string; to?: string; product?: Product; page?: number; per_page?: number }): Promise<Paginated<AIScan>> =>
      MOCK ? delay(mock.aiScans(f)) : http(`/dashboard/ai/usage?${new URLSearchParams(f as Record<string,string>).toString()}`),
    summary: (f?: { from?: string; to?: string }): Promise<AIUsageSummary> =>
      MOCK ? delay(mock.aiUsageSummary(f)) : http(`/dashboard/ai/usage/summary?${new URLSearchParams(f as Record<string,string>).toString()}`),
  },

  audit: {
    list: (f?: { from?: string; to?: string; page?: number; per_page?: number }): Promise<Paginated<AuditLogEntry>> =>
      MOCK ? delay(mock.auditLogEntries(f)) : http(`/dashboard/audit-log?${new URLSearchParams(f as Record<string,string>).toString()}`),
  },

  users: {
    search: (q: string, page?: number): Promise<Paginated<UserSearchResult>> =>
      MOCK ? delay(mock.searchUsers(q, page)) : http(`/dashboard/users?search=${encodeURIComponent(q)}&page=${page ?? 1}`),
    detail: (id: string): Promise<UserSearchResult | undefined> =>
      MOCK ? delay(mock.userDetail(id)) : http(`/dashboard/users/${id}`),
  },

  team: {
    list: (): Promise<TeamMember[]> => MOCK ? delay(mock.teamMembers) : http('/dashboard/team'),
    health: (): Promise<HealthIndicator[]> => MOCK ? delay(mock.healthIndicators) : http('/dashboard/health'),
  },

  settings: {
    save: (values: Record<string, unknown>): Promise<{ ok: boolean }> =>
      MOCK ? delay({ ok: true }) : httpPost('/dashboard/settings', values),
  },

  website: {
    getContent: (): Promise<WebsiteContent> => MOCK ? delay(mock.websiteContent) : http('/admin/website/content'),
    updateContent: (content: WebsiteContent): Promise<{ ok: boolean }> =>
      MOCK ? delay({ ok: true }) : httpPost('/admin/website/content', content),
  },
};
