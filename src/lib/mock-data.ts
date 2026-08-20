import type {
  OverviewKPIs, RevenuePoint, UserGrowthPoint, ProductComparison,
  ActivityItem, Payment, Invitation, Restaurant, Order, AIScan,
  AIUsageSummary, AuditLogEntry, TeamMember, HealthIndicator,
  UserSearchResult, Paginated, Product, WebsiteContent,
} from './types';

// ── helpers ──────────────────────────────────────────────
const now = new Date();
function isoDaysAgo(d: number): string {
  return new Date(now.getTime() - d * 86_400_000).toISOString();
}
function isoDaysFromNow(d: number): string {
  return new Date(now.getTime() + d * 86_40_000).toISOString();
}
function rid(prefix: string, n: number): string {
  return `${prefix}_${n.toString().padStart(4, '0')}`;
}

const egFirst = ['Ahmed', 'Mohamed', 'Mahmoud', 'Omar', 'Youssef', 'Karim', 'Hassan', 'Amr', 'Tarek', 'Sherif', 'Mostafa', 'Khaled', 'Ramy', 'Wael', 'Hany', 'Bassem', 'Nour', 'Adham', 'Fady', 'Marwan'];
const egLast = ['Abdelrahman', 'El-Sayed', 'Hassan', 'Ibrahim', 'Mostafa', 'Fouad', 'Nabil', 'Sami', 'Farouk', 'Galal', 'Abou Zeid', 'El-Masry', 'Rashed', 'Sobhy', 'Abou Bakr', 'El-Shennawy', 'Mansour', 'Adel', 'Zaki', 'Hegazy'];
function name(i: number): string {
  return `${egFirst[i % egFirst.length]} ${egLast[(i * 3 + 1) % egLast.length]}`;
}

const restaurantNames = [
  'Koshary Abou Tarek', 'Zooba Cairo', 'Khedive Restaurant', 'Taboula Lebanese', 'Abou El Sid',
  'Sequoia Zamalek', 'Koshary El Tahrir', 'Felfela Downtown', 'Osmanly Restaurant', 'Cairo Kitchen',
  'Le Pain Quotidien', 'Sufi Mediterranean', 'Andrea Maadi', 'Gaya Korean BBQ', 'Sushi Bar Roppongi',
  'Pizza Mia Heliopolis', 'Burger Republic', 'Tortina Bakery', 'Cilantro New Cairo', 'Maison Thomas',
  'Zitouni Nile', 'L Asiatique', 'Spices Café', 'The Smoky Olive', 'Nile Ritz Brunch',
];

const templates = ['Gold Lux', 'Classic White', 'Floral Garden', 'Modern Geometric', 'Navy Elegance', 'Boho Desert', 'Royal Crest', 'Minimalist Line', 'Watercolor Bloom', 'Calligraphy Black'];
const slugs = ['sara-karim-2025', 'nour-wael-wedding', 'hala-omar', 'mariam-tarek', 'yasmin-bassem', 'farida-sherif', 'laila-mostafa', 'rana-amr', 'dina-hassan', 'menna-ramy'];

// ── Overview ─────────────────────────────────────────────
export const overviewKPIs: OverviewKPIs = {
  totalUsers: 12_847,
  activeUsers: 8_392,
  totalRevenue: 1_284_500,
  pendingPaymentsCount: 7,
  pendingPaymentsAmount: 18_650,
  activeInvitations: 1_934,
  activeRestaurants: 142,
  deltas: {
    totalUsers: { value: 8.2, label: 'vs last month', direction: 'up' },
    activeUsers: { value: 12.4, label: 'vs last month', direction: 'up' },
    totalRevenue: { value: 15.3, label: 'vs last month', direction: 'up' },
    pendingPaymentsCount: { value: 3, label: 'awaiting review', direction: 'flat' },
    pendingPaymentsAmount: { value: 18_650, label: 'across 7 payments', direction: 'flat' },
    activeInvitations: { value: 6.1, label: 'vs last month', direction: 'up' },
    activeRestaurants: { value: 4.8, label: 'vs last month', direction: 'up' },
  },
};

export function revenueTrend(days: number): RevenuePoint[] {
  const pts: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const base = 30_000 + Math.sin(i / 4) * 8_000 + (days - i) * 120;
    const noise = (i * 37) % 5_000;
    pts.push({
      date: new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10),
      value: Math.round(base + noise),
    });
  }
  return pts;
}

export function userGrowthTrend(days: number): UserGrowthPoint[] {
  let total = 11_200;
  const pts: UserGrowthPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const newU = 40 + Math.round(Math.sin(i / 3) * 20 + ((i * 13) % 30));
    total += newU;
    pts.push({
      date: new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10),
      total,
      new: newU,
    });
  }
  return pts;
}

export const productComparison: ProductComparison[] = [
  { product: 'dawaty', users: 7_214, revenue: 486_200, growth: 18.4 },
  { product: 'digital_menu', users: 5_633, revenue: 798_300, growth: 12.7 },
];

export const recentActivity: ActivityItem[] = [
  { id: 'a1', type: 'payment_approved', product: 'digital_menu', message: 'Payment approved for Koshary Abou Tarek — EGP 1,200', actor: 'You', at: isoDaysAgo(0) },
  { id: 'a2', type: 'signup', product: 'dawaty', message: 'New user Sara Karim signed up', actor: 'system', at: isoDaysAgo(0) },
  { id: 'a3', type: 'ai_scan', product: 'digital_menu', message: 'AI scan completed for Zooba Cairo (24 items)', actor: 'system', at: isoDaysAgo(0) },
  { id: 'a4', type: 'payment_submitted', product: 'dawaty', message: 'Payment submitted by Nour Wael — EGP 350 pending review', actor: 'system', at: isoDaysAgo(1) },
  { id: 'a5', type: 'payment_rejected', product: 'digital_menu', message: 'Payment rejected for Sequoia — reference mismatch', actor: 'Mona Adel', at: isoDaysAgo(1) },
  { id: 'a6', type: 'invitation_published', product: 'dawaty', message: 'Invitation "Mariam & Tarek" published', actor: 'system', at: isoDaysAgo(1) },
  { id: 'a7', type: 'payment_approved', product: 'dawaty', message: 'Payment approved for Yasmin Bassem — EGP 450', actor: 'You', at: isoDaysAgo(2) },
  { id: 'a8', type: 'ai_scan', product: 'digital_menu', message: 'AI scan failed for Sufi Mediterranean (timeout)', actor: 'system', at: isoDaysAgo(2) },
];

// ── Payments ─────────────────────────────────────────────
const payments_seed: Payment[] = [
  { id: rid('pay', 1), product: 'digital_menu', reference_id: 'IP-8821-447', user_name: 'Koshary Abou Tarek', user_id: 'usr_0102', expected_amount: 1200, submitted_amount: 1200, status: 'pending_review', method: 'Instapay', receipt_url: 'receipt_pay_1.jpg', created_at: isoDaysAgo(0) },
  { id: rid('pay', 2), product: 'dawaty', reference_id: 'VC-55320-12', user_name: 'Nour Wael', user_id: 'usr_0210', expected_amount: 350, submitted_amount: 350, status: 'pending_review', method: 'Vodafone Cash', created_at: isoDaysAgo(0) },
  { id: rid('pay', 3), product: 'digital_menu', reference_id: 'IP-9912-220', user_name: 'Zooba Cairo', user_id: 'usr_0088', expected_amount: 2400, submitted_amount: 2400, status: 'pending_review', method: 'Instapay', receipt_url: 'receipt_pay_3.jpg', created_at: isoDaysAgo(0) },
  { id: rid('pay', 4), product: 'dawaty', reference_id: 'IP-3344-891', user_name: 'Yasmin Bassem', user_id: 'usr_0312', expected_amount: 450, submitted_amount: 400, status: 'pending_review', method: 'Instapay', created_at: isoDaysAgo(0) },
  { id: rid('pay', 5), product: 'digital_menu', reference_id: 'VC-77120-55', user_name: 'Sequoia Zamalek', user_id: 'usr_0055', expected_amount: 3600, submitted_amount: 3600, status: 'pending_review', method: 'Vodafone Cash', receipt_url: 'receipt_pay_5.jpg', created_at: isoDaysAgo(1) },
  { id: rid('pay', 6), product: 'dawaty', reference_id: 'IP-2299-104', user_name: 'Mariam Tarek', user_id: 'usr_0418', expected_amount: 350, submitted_amount: 350, status: 'pending_review', method: 'Instapay', created_at: isoDaysAgo(1) },
  { id: rid('pay', 7), product: 'digital_menu', reference_id: 'IP-5566-770', user_name: 'Abou El Sid', user_id: 'usr_0072', expected_amount: 1800, submitted_amount: 1800, status: 'pending_review', method: 'Instapay', receipt_url: 'receipt_pay_7.jpg', created_at: isoDaysAgo(1) },
  { id: rid('pay', 8), product: 'digital_menu', reference_id: 'IP-1122-330', user_name: 'Taboula Lebanese', user_id: 'usr_0064', expected_amount: 2400, submitted_amount: 2400, status: 'paid', method: 'Instapay', created_at: isoDaysAgo(2), reviewed_at: isoDaysAgo(1), reviewed_by: 'You' },
  { id: rid('pay', 9), product: 'dawaty', reference_id: 'VC-8843-210', user_name: 'Hala Omar', user_id: 'usr_0501', expected_amount: 350, submitted_amount: 350, status: 'paid', method: 'Vodafone Cash', created_at: isoDaysAgo(3), reviewed_at: isoDaysAgo(2), reviewed_by: 'Mona Adel' },
  { id: rid('pay', 10), product: 'digital_menu', reference_id: 'IP-6677-120', user_name: 'Khedive Restaurant', user_id: 'usr_0091', expected_amount: 1200, submitted_amount: 1200, status: 'paid', method: 'Instapay', created_at: isoDaysAgo(4), reviewed_at: isoDaysAgo(3), reviewed_by: 'You' },
  { id: rid('pay', 11), product: 'dawaty', reference_id: 'VC-1199-443', user_name: 'Farida Sherif', user_id: 'usr_0612', expected_amount: 450, submitted_amount: 450, status: 'paid', method: 'Vodafone Cash', created_at: isoDaysAgo(5), reviewed_at: isoDaysAgo(4), reviewed_by: 'Mona Adel' },
  { id: rid('pay', 12), product: 'digital_menu', reference_id: 'IP-3388-901', user_name: 'Felfela Downtown', user_id: 'usr_0048', expected_amount: 1800, submitted_amount: 1500, status: 'rejected', method: 'Instapay', created_at: isoDaysAgo(3), reviewed_at: isoDaysAgo(2), reviewed_by: 'You', reject_reason: 'Amount mismatch — expected EGP 1,800, received EGP 1,500' },
  { id: rid('pay', 13), product: 'dawaty', reference_id: 'VC-5577-332', user_name: 'Laila Mostafa', user_id: 'usr_0701', expected_amount: 350, submitted_amount: 350, status: 'rejected', method: 'Vodafone Cash', created_at: isoDaysAgo(4), reviewed_at: isoDaysAgo(3), reviewed_by: 'Mona Adel', reject_reason: 'Reference number not found in payment system' },
  { id: rid('pay', 14), product: 'digital_menu', reference_id: 'IP-8899-223', user_name: 'Osmanly Restaurant', user_id: 'usr_0033', expected_amount: 3600, submitted_amount: 3600, status: 'paid', method: 'Instapay', created_at: isoDaysAgo(6), reviewed_at: isoDaysAgo(5), reviewed_by: 'You' },
  { id: rid('pay', 15), product: 'dawaty', reference_id: 'IP-4422-778', user_name: 'Rana Amr', user_id: 'usr_0812', expected_amount: 350, submitted_amount: 350, status: 'paid', method: 'Instapay', created_at: isoDaysAgo(7), reviewed_at: isoDaysAgo(6), reviewed_by: 'You' },
];

export function payments(filters?: { product?: Product; status?: string; from?: string; to?: string; page?: number; per_page?: number }): Paginated<Payment> {
  let rows = [...payments_seed];
  if (filters?.product) rows = rows.filter(p => p.product === filters.product);
  if (filters?.status && filters.status !== 'all') rows = rows.filter(p => p.status === filters.status);
  if (filters?.from) rows = rows.filter(p => p.created_at >= filters.from!);
  if (filters?.to) rows = rows.filter(p => p.created_at <= filters.to!);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 10;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

export function pendingPayments(): Payment[] {
  return payments_seed.filter(p => p.status === 'pending_review');
}

export function approvePayment(id: string, actor: string): Payment | undefined {
  const p = payments_seed.find(x => x.id === id);
  if (p) {
    p.status = 'paid';
    p.reviewed_at = new Date().toISOString();
    p.reviewed_by = actor;
    auditLog.unshift({
      id: rid('aud', auditLog.length + 1),
      action: 'approve',
      entity: 'Payment',
      entity_id: id,
      actor,
      actor_role: 'admin',
      before: 'pending_review',
      after: 'paid',
      at: new Date().toISOString(),
    });
  }
  return p;
}

export function rejectPayment(id: string, reason: string, actor: string): Payment | undefined {
  const p = payments_seed.find(x => x.id === id);
  if (p) {
    p.status = 'rejected';
    p.reviewed_at = new Date().toISOString();
    p.reviewed_by = actor;
    p.reject_reason = reason;
    auditLog.unshift({
      id: rid('aud', auditLog.length + 1),
      action: 'reject',
      entity: 'Payment',
      entity_id: id,
      actor,
      actor_role: 'admin',
      before: 'pending_review',
      after: 'rejected',
      reason,
      at: new Date().toISOString(),
    });
  }
  return p;
}

// ── Invitations ──────────────────────────────────────────
export function invitations(filters?: { status?: string; page?: number; per_page?: number }): Paginated<Invitation> {
  const all: Invitation[] = [];
  for (let i = 0; i < 48; i++) {
    const st = i % 5 === 0 ? 'expired' : i % 3 === 0 ? 'draft' : 'published';
    const visits: { date: string; count: number }[] = [];
    for (let d = 29; d >= 0; d--) {
      visits.push({ date: new Date(now.getTime() - d * 86_400_000).toISOString().slice(0, 10), count: Math.round(Math.sin(d / 3) * 8 + 12 + (d % 5)) });
    }
    all.push({
      id: rid('inv', i + 1),
      couple_names: `${egFirst[i % egFirst.length]} & ${egFirst[(i + 5) % egFirst.length]}`,
      slug: slugs[i % slugs.length] + (i > 9 ? `-${i}` : ''),
      status: st,
      template: templates[i % templates.length],
      owner: name(i + 2),
      owner_id: `usr_${(i + 200).toString().padStart(4, '0')}`,
      created_at: isoDaysAgo(i * 2 + 5),
      event_date: isoDaysFromNow(i * 3 - 10),
      visit_count: 120 + (i * 17) % 400,
      rsvp_attending: 40 + (i * 7) % 80,
      rsvp_declined: 5 + (i * 3) % 20,
      rsvp_pending: 10 + (i * 2) % 30,
      qr_scan_count: 30 + (i * 5) % 60,
      guest_count: 80 + (i * 11) % 120,
      visits_over_time: visits,
    });
  }
  let rows = all;
  if (filters?.status && filters.status !== 'all') rows = all.filter(x => x.status === filters.status);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 10;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

export function invitationDetail(id: string): Invitation | undefined {
  const r = invitations({ per_page: 200 });
  return r.data.find(x => x.id === id);
}

// ── Restaurants ──────────────────────────────────────────
export function restaurants(filters?: { status?: string; page?: number; per_page?: number }): Paginated<Restaurant> {
  const all: Restaurant[] = [];
  for (let i = 0; i < restaurantNames.length; i++) {
    const st = i % 7 === 0 ? 'trial' : i % 11 === 0 ? 'suspended' : 'active';
    const plan = i % 4 === 0 ? 'enterprise' : i % 2 === 0 ? 'pro' : 'free';
    all.push({
      id: rid('rest', i + 1),
      store_name: restaurantNames[i],
      slug: restaurantNames[i].toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
      status: st,
      plan,
      menu_published: i % 6 !== 0,
      owner: name(i + 3),
      owner_id: `usr_${(i + 100).toString().padStart(4, '0')}`,
      created_at: isoDaysAgo(i * 5 + 2),
      categories_count: 4 + (i % 6),
      products_count: 18 + (i * 7) % 40,
      orders_count: 120 + (i * 23) % 800,
      ai_scans_count: 5 + (i * 3) % 30,
      ai_cost: 15 + (i * 7) % 120,
    });
  }
  let rows = all;
  if (filters?.status && filters.status !== 'all') rows = all.filter(x => x.status === filters.status);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 10;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

export function restaurantDetail(id: string): Restaurant | undefined {
  return restaurants({ per_page: 200 }).data.find(x => x.id === id);
}

// ── Orders (may 404 — we simulate available) ──────────────
export function orders(filters?: { status?: string; page?: number; per_page?: number }): Paginated<Order> {
  const all: Order[] = [];
  const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  for (let i = 0; i < 36; i++) {
    all.push({
      id: rid('ord', i + 1),
      restaurant_id: rid('rest', (i % restaurantNames.length) + 1),
      restaurant_name: restaurantNames[i % restaurantNames.length],
      customer: name(i + 7),
      total: 120 + (i * 37) % 600,
      status: statuses[i % statuses.length],
      created_at: isoDaysAgo(i * 0.5),
      items: 1 + (i % 6),
    });
  }
  let rows = all;
  if (filters?.status && filters.status !== 'all') rows = all.filter(x => x.status === filters.status);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 10;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

// ── AI Usage ─────────────────────────────────────────────
export function aiScans(filters?: { from?: string; to?: string; product?: Product; page?: number; per_page?: number }): Paginated<AIScan> {
  const all: AIScan[] = [];
  const errs = ['Timeout', 'Image unreadable', 'No menu detected', 'OCR failure', 'Rate limited', undefined, undefined, undefined, undefined];
  for (let i = 0; i < 80; i++) {
    const ok = i % 5 !== 0;
    all.push({
      id: rid('ai', i + 1),
      product: 'digital_menu',
      restaurant_name: restaurantNames[i % restaurantNames.length],
      status: ok ? 'success' : 'failed',
      cost: 0.8 + (i % 5) * 0.4,
      duration_ms: 1200 + (i * 137) % 3000,
      error: ok ? undefined : errs[i % errs.length],
      created_at: isoDaysAgo(i * 0.3),
    });
  }
  let rows = all;
  if (filters?.product) rows = rows.filter(x => x.product === filters.product);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 10;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

export function aiUsageSummary(filters?: { from?: string; to?: string }): AIUsageSummary {
  const costOverTime: { date: string; cost: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    costOverTime.push({
      date: new Date(now.getTime() - d * 86_400_000).toISOString().slice(0, 10),
      cost: Math.round((20 + Math.sin(d / 3) * 8 + (d % 6)) * 10) / 10,
    });
  }
  return {
    totalScans: 1_842,
    successRate: 94.2,
    failedCount: 107,
    totalCost: 3_840,
    costOverTime,
    topErrors: [
      { error: 'Timeout', count: 42 },
      { error: 'Image unreadable', count: 28 },
      { error: 'No menu detected', count: 19 },
      { error: 'OCR failure', count: 12 },
      { error: 'Rate limited', count: 6 },
    ],
    byRestaurant: restaurantNames.slice(0, 8).map((r, i) => ({
      name: r,
      scans: 240 - i * 22,
      cost: Math.round((48 - i * 5) * 10) / 10,
    })),
  };
}

// ── Audit log ────────────────────────────────────────────
export const auditLog: AuditLogEntry[] = [
  { id: rid('aud', 1), action: 'approve', entity: 'Payment', entity_id: rid('pay', 8), actor: 'You', actor_role: 'admin', before: 'pending_review', after: 'paid', at: isoDaysAgo(1) },
  { id: rid('aud', 2), action: 'reject', entity: 'Payment', entity_id: rid('pay', 12), actor: 'You', actor_role: 'admin', before: 'pending_review', after: 'rejected', reason: 'Amount mismatch — expected EGP 1,800, received EGP 1,500', at: isoDaysAgo(2) },
  { id: rid('aud', 3), action: 'approve', entity: 'Payment', entity_id: rid('pay', 9), actor: 'Mona Adel', actor_role: 'admin', before: 'pending_review', after: 'paid', at: isoDaysAgo(2) },
  { id: rid('aud', 4), action: 'reject', entity: 'Payment', entity_id: rid('pay', 13), actor: 'Mona Adel', actor_role: 'admin', before: 'pending_review', after: 'rejected', reason: 'Reference number not found in payment system', at: isoDaysAgo(3) },
  { id: rid('aud', 5), action: 'approve', entity: 'Payment', entity_id: rid('pay', 10), actor: 'You', actor_role: 'admin', before: 'pending_review', after: 'paid', at: isoDaysAgo(3) },
  { id: rid('aud', 6), action: 'approve', entity: 'Payment', entity_id: rid('pay', 14), actor: 'You', actor_role: 'admin', before: 'pending_review', after: 'paid', at: isoDaysAgo(5) },
];

export function auditLogEntries(filters?: { from?: string; to?: string; page?: number; per_page?: number }): Paginated<AuditLogEntry> {
  let rows = [...auditLog];
  if (filters?.from) rows = rows.filter(x => x.at >= filters.from!);
  if (filters?.to) rows = rows.filter(x => x.at <= filters.to!);
  const page = filters?.page ?? 1;
  const per_page = filters?.per_page ?? 15;
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

// ── Team ─────────────────────────────────────────────────
export const teamMembers: TeamMember[] = [
  { id: 'tm_1', name: 'You', email: 'you@ouonex.com', role: 'owner', avatar_color: '#06b6d4', last_active: isoDaysAgo(0) },
  { id: 'tm_2', name: 'Mona Adel', email: 'mona@ouonex.com', role: 'admin', avatar_color: '#22c55e', last_active: isoDaysAgo(0) },
  { id: 'tm_3', name: 'Khaled Sami', email: 'khaled@ouonex.com', role: 'admin', avatar_color: '#f59e0b', last_active: isoDaysAgo(1) },
  { id: 'tm_4', name: 'Nour Hassan', email: 'nour@ouonex.com', role: 'finance', avatar_color: '#3b82f6', last_active: isoDaysAgo(0) },
  { id: 'tm_5', name: 'Omar Fouad', email: 'omar@ouonex.com', role: 'support', avatar_color: '#ef4444', last_active: isoDaysAgo(2) },
  { id: 'tm_6', name: 'Salma Ibrahim', email: 'salma@ouonex.com', role: 'viewer', avatar_color: '#8b5cf6', last_active: isoDaysAgo(5) },
];

// ── Health ───────────────────────────────────────────────
export const healthIndicators: HealthIndicator[] = [
  { product: 'dawaty', name: 'Dawaty Backend', reachable: true, last_sync: isoDaysAgo(0), latency_ms: 142 },
  { product: 'digital_menu', name: 'Digital Menu Backend', reachable: true, last_sync: isoDaysAgo(0), latency_ms: 189 },
];

// ── Users ────────────────────────────────────────────────
export function searchUsers(query: string, page = 1, per_page = 10): Paginated<UserSearchResult> {
  const all: UserSearchResult[] = [];
  for (let i = 0; i < 60; i++) {
    const n = name(i + 1);
    const prods: Product[] = i % 3 === 0 ? ['dawaty', 'digital_menu'] : i % 2 === 0 ? ['dawaty'] : ['digital_menu'];
    all.push({
      id: `usr_${(i + 1).toString().padStart(4, '0')}`,
      name: n,
      email: `${n.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      products: prods,
      payment_count: (i * 3) % 12,
      pending_count: i % 5 === 0 ? 1 : 0,
      joined_at: isoDaysAgo(i * 4 + 2),
      activity: [
        { type: 'login', message: 'Logged in', at: isoDaysAgo(i % 7) },
        { type: 'payment', message: `Submitted payment ${rid('pay', i + 1)}`, at: isoDaysAgo(i % 4 + 1) },
      ],
      payments: payments_seed.filter(p => p.user_id === `usr_${(i + 1).toString().padStart(4, '0')}`),
    });
  }
  let rows = all;
  if (query) {
    const q = query.toLowerCase();
    rows = all.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const total = rows.length;
  const start = (page - 1) * per_page;
  return { data: rows.slice(start, start + per_page), meta: { page, per_page, total } };
}

export function userDetail(id: string): UserSearchResult | undefined {
  return searchUsers('', 1, 200).data.find(u => u.id === id);
}

// ── Website Content ──────────────────────────────────────
export const websiteContent: WebsiteContent = {
  contact: {
    email: 'support@ouonex.com',
    whatsapp: '+20 100 123 4567',
    phone: '+20 2 1234 5678',
  },
  hero: {
    titleEn: 'Digital Products That Empower Your Business',
    titleAr: 'منتجات رقمية تمكّن عملك',
    bodyEn: 'Ouonex builds elegant digital tools for Egyptian businesses — from wedding invitations to restaurant menus and beyond.',
    bodyAr: 'أوونكس يبني أدوات رقمية أنيقة للشركات المصرية — من دعوات الزفاف إلى قوائم المطاعم وأكثر.',
  },
  about: {
    titleEn: 'About Ouonex',
    titleAr: 'عن أوونكس',
    bodyEn: 'We are a Cairo-based technology company creating simple, beautiful, and powerful digital products that help businesses grow and connect with their customers.',
    bodyAr: 'نحن شركة تقنية مقرها القاهرة نصنع منتجات رقمية بسيطة وجميلة وقوية تساعد الشركات على النمو والتواصل مع عملائها.',
  },
  products: [
    { id: 'dawaty', name: 'Dawaty', arName: 'دعوتي', description: 'Digital wedding invitations with RSVP, QR codes, and live guest tracking.', arDescription: 'دعوات زفاف رقمية مع تأكيد الحضور ورمز QR وتتبع الضيوف المباشر.', visible: true, link: 'https://ouonex.com/dawaty' },
    { id: 'digital_menu', name: 'Digital Menu', arName: 'المنيو الرقمي', description: 'QR-based digital restaurant menus with AI-powered menu scanning.', arDescription: 'قوائم مطاعم رقمية عبر رمز QR مع مسح ذكي للقوائم.', visible: true, link: 'https://ouonex.com/digital-menu' },
    { id: 'gym_management', name: 'Gym Management', arName: 'إدارة الجيم', description: 'All-in-one gym management system for memberships, scheduling, and payments.', arDescription: 'نظام متكامل لإدارة الجيم يشمل العضويات والجدولة والمدفوعات.', visible: true, link: 'https://ouonex.com/gym' },
    { id: 'tools_app', name: 'Tools App', arName: 'تطبيق الأدوات', description: 'A collection of handy daily utility tools in one lightweight app.', arDescription: 'مجموعة من الأدوات اليومية المفيدة في تطبيق واحد خفيف.', visible: false, link: 'https://ouonex.com/tools' },
    { id: 'data_usage', name: 'Data Usage', arName: 'استهلاك البيانات', description: 'Track and visualize your mobile data consumption with smart alerts.', arDescription: 'تتبع وعرض استهلاك بيانات الهاتف مع تنبيهات ذكية.', visible: false, link: 'https://ouonex.com/data-usage' },
    { id: 'ecommerce', name: 'E-commerce', arName: 'متجر إلكتروني', description: 'Ready-to-launch e-commerce platform tailored for Egyptian merchants.', arDescription: 'منصة تجارة إلكترونية جاهزة للإطلاق مخصصة للتجار المصريين.', visible: true, link: 'https://ouonex.com/ecommerce' },
  ],
};
