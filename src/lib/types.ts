export type Product = 'dawaty' | 'digital_menu';

export type PaymentStatus = 'pending_review' | 'paid' | 'rejected';
export type InvitationStatus = 'draft' | 'published' | 'expired';
export type RestaurantStatus = 'active' | 'suspended' | 'trial';
export type Plan = 'free' | 'pro' | 'enterprise';

export type Role = 'owner' | 'admin' | 'finance' | 'support' | 'viewer';

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
  created_at: string;
  categories_count: number;
  products_count: number;
  orders_count: number;
  ai_scans_count: number;
  ai_cost: number;
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

export interface AIScan {
  id: string;
  product: Product;
  restaurant_name?: string;
  status: 'success' | 'failed';
  cost: number;
  duration_ms: number;
  error?: string;
  created_at: string;
}

export interface AIUsageSummary {
  totalScans: number;
  successRate: number;
  failedCount: number;
  totalCost: number;
  costOverTime: { date: string; cost: number }[];
  topErrors: { error: string; count: number }[];
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
  avatar_color: string;
  last_active: string;
}

export interface HealthIndicator {
  product: Product;
  name: string;
  reachable: boolean;
  last_sync: string;
  latency_ms: number;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  products: Product[];
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
