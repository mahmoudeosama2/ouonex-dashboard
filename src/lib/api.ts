// Single typed API client. Set VITE_API_BASE_URL in .env.local to go live.
// All components import from here — never scatter fetch calls in components.

import type {
  OverviewKPIs, RevenuePoint, UserGrowthPoint, ProductComparison,
  ActivityItem, Payment, Invitation, Restaurant, Order, AIScan,
  AIUsageSummary, AuditLogEntry, TeamMember, HealthIndicator,
  UserSearchResult, Paginated, Product, WebsiteContent,
} from './types';

import * as mock from './mock-data';

const MOCK = false;
const BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.ouonex.com/api/v1';

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ouonex_admin_token') : null;
  return token ? { 
    Authorization: `Bearer ${token}`,
    'X-Authorization': `Bearer ${token}`
  } : {};
}

async function http<T>(path: string): Promise<T> {
  console.log(`🚀 [API Request] GET ${BASE}${path}`);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
    });
    if (!res.ok) {
      console.error(`❌ [API Error] GET ${BASE}${path} -> Status ${res.status}`);
      throw new Error(`API ${res.status} on ${path}`);
    }
    console.log(`✅ [API Success] GET ${BASE}${path} -> Status ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`❌ [API Failed] GET ${BASE}${path} ->`, err);
    throw err;
  }
}

async function httpPost<T>(path: string, body?: unknown): Promise<T> {
  console.log(`🚀 [API Request] POST ${BASE}${path}`, body);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!res.ok) {
      console.error(`❌ [API Error] POST ${BASE}${path} -> Status ${res.status}`);
      throw new Error(`API ${res.status} on ${path}`);
    }
    console.log(`✅ [API Success] POST ${BASE}${path} -> Status ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`❌ [API Failed] POST ${BASE}${path} ->`, err);
    throw err;
  }
}

async function httpPut<T>(path: string, body?: unknown): Promise<T> {
  console.log(`🚀 [API Request] PUT ${BASE}${path}`, body);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!res.ok) {
      console.error(`❌ [API Error] PUT ${BASE}${path} -> Status ${res.status}`);
      throw new Error(`API ${res.status} on ${path}`);
    }
    console.log(`✅ [API Success] PUT ${BASE}${path} -> Status ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`❌ [API Failed] PUT ${BASE}${path} ->`, err);
    throw err;
  }
}

// Simulated latency for mock mode
function delay<T>(v: T, ms = 350): Promise<T> {
  return new Promise(r => setTimeout(() => r(v), ms));
}

// Helper to build query string from object, ignoring undefined/null values
function qs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
  const str = new URLSearchParams(filtered).toString();
  return str ? `?${str}` : '';
}

export const api = {
  isMock: MOCK,

  overview: {
    kpis: (): Promise<OverviewKPIs> =>
      MOCK ? delay(mock.overviewKPIs) : http('/admin/stats/overview'),
    revenueTrend: (days: number): Promise<RevenuePoint[]> =>
      MOCK ? delay(mock.revenueTrend(days)) : http(`/admin/stats/revenue${qs({ period: `${days}d` })}`),
    userGrowth: (days: number): Promise<UserGrowthPoint[]> =>
      MOCK ? delay(mock.userGrowthTrend(days)) : http(`/admin/stats/users${qs({ period: `${days}d` })}`),
    comparison: (): Promise<ProductComparison[]> =>
      MOCK ? delay(mock.productComparison) : http('/admin/stats/comparison'),
    activity: (): Promise<ActivityItem[]> =>
      MOCK ? delay(mock.recentActivity) : http('/admin/stats/activity'),
  },

  payments: {
    list: (f?: { product?: Product; status?: string; from?: string; to?: string; page?: number; per_page?: number }): Promise<Paginated<Payment>> =>
      MOCK ? delay(mock.payments(f)) : http(`/admin/payments${qs(f as Record<string, unknown>)}`),
    pending: (): Promise<Payment[]> =>
      MOCK ? delay(mock.pendingPayments()) : http('/admin/payments?status=pending_review'),
    approve: (id: string, _actor: string): Promise<Payment | undefined> =>
      MOCK ? delay(mock.approvePayment(id, _actor)) : httpPost(`/admin/payments/${id}/review`, { action: 'approve' }),
    reject: (id: string, reason: string, _actor: string): Promise<Payment | undefined> =>
      MOCK ? delay(mock.rejectPayment(id, reason, _actor)) : httpPost(`/admin/payments/${id}/review`, { action: 'reject', reason }),
  },

  dawaty: {
    invitations: (f?: { status?: string; page?: number; per_page?: number; search?: string }): Promise<Paginated<Invitation>> =>
      MOCK ? delay(mock.invitations(f)) : http(`/admin/dawaty/invitations${qs(f as Record<string, unknown>)}`),
    invitation: (id: string): Promise<Invitation | undefined> =>
      MOCK ? delay(mock.invitationDetail(id)) : http<{ data: Invitation }>(`/admin/dawaty/invitations/${id}`).then(r => (r && 'data' in r && r.data ? r.data : (r as unknown as Invitation))),
    togglePublish: (id: string): Promise<{ message: string; data: Invitation }> =>
      MOCK ? delay(mock.togglePublishInvitation(id)) : httpPost<{ message: string; data: Invitation }>(`/admin/dawaty/invitations/${id}/toggle-publish`),
  },

  digitalMenu: {
    restaurants: (f?: { status?: string; page?: number; per_page?: number }): Promise<Paginated<Restaurant>> =>
      MOCK ? delay(mock.restaurants(f)) : http(`/admin/digital-menu/restaurants${qs(f as Record<string, unknown>)}`),
    restaurant: (id: string): Promise<Restaurant | undefined> =>
      MOCK ? delay(mock.restaurantDetail(id)) : http(`/admin/digital-menu/restaurants/${id}`),
    orders: (f?: { status?: string; page?: number; per_page?: number }): Promise<Paginated<Order>> =>
      MOCK ? delay(mock.orders(f)) : http(`/admin/digital-menu/orders${qs(f as Record<string, unknown>)}`),
  },

  ai: {
    scans: (f?: { from?: string; to?: string; product?: Product; page?: number; per_page?: number }): Promise<Paginated<AIScan>> =>
      MOCK ? delay(mock.aiScans(f)) : http(`/admin/ai/usage${qs(f as Record<string, unknown>)}`),
    summary: (f?: { from?: string; to?: string }): Promise<AIUsageSummary> =>
      MOCK ? delay(mock.aiUsageSummary(f)) : http(`/admin/ai/usage/summary${qs(f as Record<string, unknown>)}`),
  },

  audit: {
    list: (f?: { from?: string; to?: string; page?: number; per_page?: number }): Promise<Paginated<AuditLogEntry>> =>
      MOCK ? delay(mock.auditLogEntries(f)) : http(`/admin/audit-log${qs(f as Record<string, unknown>)}`),
  },

  users: {
    search: (q: string, page?: number): Promise<Paginated<UserSearchResult>> =>
      MOCK ? delay(mock.searchUsers(q, page)) : http(`/admin/users${qs({ search: q, page: page ?? 1 })}`),
    detail: (id: string): Promise<UserSearchResult | undefined> =>
      MOCK ? delay(mock.userDetail(id)) : http(`/admin/users/${id}`),
  },

  team: {
    list: (): Promise<TeamMember[]> =>
      MOCK ? delay(mock.teamMembers) : http('/admin/team'),
    health: (): Promise<HealthIndicator[]> =>
      MOCK ? delay(mock.healthIndicators) : http('/admin/health'),
  },

  settings: {
    get: (): Promise<any> =>
      MOCK ? delay({
        dashboard_name: 'Ouonex Dashboard',
        timezone: 'Africa/Cairo',
        currency: 'EGP',
        email_notifications: true,
        auto_refresh_seconds: 30,
        menu_price_monthly: 100,
        menu_price_yearly: 1000,
        menu_free_mode: false,
        dawaty_invitation_price: 150,
        dawaty_free_mode: false,
        vodafone_cash_number: '01019603225',
        instapay_address: 'instapay@address'
      }) : http('/admin/settings'),
    save: (values: Record<string, unknown>): Promise<{ ok: boolean }> =>
      MOCK ? delay({ ok: true }) : httpPost('/admin/settings', values),
  },

  website: {
    getContent: (): Promise<WebsiteContent> =>
      MOCK ? delay(mock.websiteContent) : http('/admin/website/content'),
    updateContent: (content: WebsiteContent): Promise<{ ok: boolean }> =>
      MOCK ? delay({ ok: true }) : httpPost('/admin/website/content', content),
  },
};

