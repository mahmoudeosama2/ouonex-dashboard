import type { PageKey } from './rbac';
export type { PageKey } from './rbac';

export type Product = 'dawaty' | 'digital_menu' | 'cv_maker' | 'qr_me';

export type PaymentStatus = 'pending_review' | 'paid' | 'rejected';
export type InvitationStatus = 'draft' | 'published' | 'expired';
export type RestaurantStatus = 'active' | 'suspended' | 'trial' | 'inactive' | 'pending_payment' | 'pending_approval' | 'draft';
export type Plan = 'free' | 'pro' | 'enterprise' | 'monthly' | 'yearly';

export type Role = 'owner' | 'admin' | 'employee' | 'finance' | 'support' | 'sales' | 'viewer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: PageKey[];
  assigned_apps: Product[];
  status: 'active' | 'inactive';
  phone?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number };
}

export interface KPIDelta {
  value: number;
  label: string;
  direction: 'up' | 'down' | 'flat';
}

export interface OverviewKPIs {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  activeInvitations: number;
  activeRestaurants: number;
  deltas: Record<string, KPIDelta>;
}

export interface RevenuePoint { date: string; value: number; product?: Product; }
export interface UserGrowthPoint { date: string; total: number; new: number; }
export interface ProductComparison {
  product: Product;
  users: number;
  revenue: number;
  growth: number;
}

export interface ActivityItem {
  id: string;
  type: 'payment_approved' | 'payment_rejected' | 'payment_submitted' | 'signup' | 'ai_scan' | 'invitation_published';
  product: Product;
  message: string;
  actor: string;
  at: string;
}

export interface Payment {
  id: string;
  product: Product;
  reference_id: string;
  user_name: string;
  user_id: string;
  expected_amount: number;
  submitted_amount: number;
  status: PaymentStatus;
  method: string;
  receipt_url?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reject_reason?: string;
}

export interface Invitation {
  id: string;
  couple_names: string;
  slug: string;
  status: InvitationStatus;
  template: string;
  owner: string;
  owner_id: string;
  created_at: string;
  event_date: string;
  date?: string;
  visit_count: number;
  rsvp_attending: number;
  rsvp_declined: number;
  rsvp_pending: number;
  qr_scan_count: number;
  guest_count: number;
  visits_over_time: { date: string; count: number }[];
}

export interface Restaurant {
  id: string;
  store_name: string;
  slug: string;
  status: RestaurantStatus;
  plan: Plan;
  menu_published: boolean;
  owner: string;
  owner_id: string;
  owner_email?: string;
  owner_phone?: string;
  created_at: string;
  categories_count: number;
  products_count: number;
  orders_count: number;
  ai_scans_count: number;
  ai_cost: number;
  assigned_admin_id?: string | number | null;
  assigned_admin?: { id: string | number; name: string; email: string; role?: any } | null;
}

export interface Order {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  customer: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  items: number;
}

export interface AiApiKey {
  id: string;
  provider: string;
  account_label: string;
  masked_key: string;
  priority: number;
  is_active: boolean;
  status: 'active' | 'rate_limited' | 'quota_exceeded' | 'error';
  cooldown_until?: string | null;
  total_requests: number;
  total_tokens: number;
  failed_requests: number;
  last_used_at?: string | null;
  last_error?: string | null;
  created_at?: string | null;
}

export interface AIScan {
  id: string;
  product: Product;
  restaurant_name?: string;
  status: 'success' | 'failed';
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  total_tokens?: number;
  account_label?: string;
  cost: number;
  duration_ms: number;
  error?: string;
  created_at: string;
}

export interface AIErrorDetail {
  error: string;
  raw_error?: string;
  category?: string;
  count: number;
  last_seen_at?: string | null;
  first_seen_at?: string | null;
  model?: string;
  recent_occurrences?: {
    scan_id: string;
    restaurant_name: string;
    created_at: string;
    duration_ms: number;
  }[];
}

export interface AIUsageSummary {
  totalScans: number;
  successRate: number;
  failedCount: number;
  totalCost: number;
  totalTokensIn?: number;
  totalTokensOut?: number;
  totalTokens?: number;
  todayScans?: number;
  todayTokens?: number;
  activeKeysCount?: number;
  totalKeysCount?: number;
  costOverTime: { date: string; cost: number }[];
  topErrors: AIErrorDetail[];
  byRestaurant: { name: string; scans: number; cost: number }[];
}

export interface AuditLogEntry {
  id: string;
  action: 'approve' | 'reject';
  entity: string;
  entity_id: string;
  actor: string;
  actor_role: Role;
  before: string;
  after: string;
  reason?: string;
  at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions?: PageKey[];
  assigned_apps?: Product[];
  status?: 'active' | 'inactive';
  phone?: string;
  assigned_restaurants_count?: number;
  assigned_users_count?: number;
  avatar_color: string;
  last_active: string;
  created_at?: string;
}

export interface HealthIndicator {
  product: Product | 'sms_gateway' | string;
  name: string;
  name_ar?: string;
  product_ar?: string;
  reachable: boolean;
  last_sync: string;
  latency_ms: number;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'suspended' | 'banned';
  products: Product[];
  assigned_admin_id?: string | null;
  assigned_admin?: { id: string; name: string; email: string; role?: string } | null;
  payment_count: number;
  pending_count: number;
  joined_at: string;
  activity: { type: string; message: string; at: string }[];
  payments: Payment[];
}

export interface ProductInfo {
  id: string;
  name: string;
  arName: string;
  description: string;
  arDescription: string;
  visible: boolean;
  link?: string;
}

export interface WebsiteContent {
  contact: {
    email: string;
    whatsapp: string;
    phone: string;
  };
  hero: {
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
  };
  about: {
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
  };
  products: ProductInfo[];
}

export interface ServerAlert {
  type: 'cpu' | 'memory' | 'storage' | string;
  level: 'warning' | 'critical' | string;
  message_en: string;
  message_ar: string;
}

export interface ServerMetrics {
  timestamp: string;
  stress_level: 'optimal' | 'moderate' | 'critical';
  stress_score: number;
  stress_status_ar: string;
  stress_status_en: string;
  alerts: ServerAlert[];
  system: {
    os_family: string;
    os_name: string;
    php_version: string;
    laravel_version: string;
    server_ip: string;
    uptime_seconds: number;
    uptime_human: string;
    opcache_enabled: boolean;
  };
  cpu: {
    cores: number;
    usage_percent: number;
    load_1m: number;
    load_5m: number;
    load_15m: number;
  };
  memory: {
    total_bytes: number;
    total_formatted: string;
    used_bytes: number;
    used_formatted: string;
    free_bytes: number;
    free_formatted: string;
    usage_percent: number;
    php_used_bytes: number;
    php_used_formatted: string;
    php_peak_bytes: number;
    php_peak_formatted: string;
    php_memory_limit: string;
  };
  storage: {
    total_bytes: number;
    total_formatted: string;
    used_bytes: number;
    used_formatted: string;
    free_bytes: number;
    free_formatted: string;
    usage_percent: number;
    uploads_bytes: number;
    uploads_formatted: string;
  };
  database: {
    connected: boolean;
    driver: string;
    ping_ms: number;
    size_bytes: number;
    size_formatted: string;
  };
  services: {
    id: string;
    name: string;
    name_ar?: string;
    reachable: boolean;
    latency_ms: number;
    last_sync: string;
  }[];
}

export interface CrashlyticsError {
  id: string;
  app: 'digital_menu' | 'dawaty' | 'cv_maker' | 'qr_me';
  title: string;
  exception_type: string;
  message: string;
  file?: string;
  line?: number;
  occurrences: number;
  affected_users: number;
  platform: 'android' | 'ios' | 'web';
  os_version: string;
  app_version: string;
  severity: 'fatal' | 'high' | 'warning' | 'info';
  status: 'open' | 'investigating' | 'resolved';
  first_seen: string;
  last_seen: string;
  stack_trace?: string;
  device_model?: string;
  breadcrumbs?: { time: string; action: string; category?: string }[];
}

