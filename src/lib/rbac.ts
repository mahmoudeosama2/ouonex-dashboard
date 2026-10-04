import type { Role } from './types';

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: 'owner', label: 'Owner (المالك)', description: 'Full access including team and permission management' },
  { id: 'admin', label: 'Admin (مدير عام)', description: 'Full access except team management' },
  { id: 'employee', label: 'Employee (موظف تشغيل)', description: 'Custom permissions for assigned apps and clients' },
  { id: 'sales', label: 'Sales (مبيعات وتسويق)', description: 'Manage assigned clients and restaurants' },
  { id: 'support', label: 'Support (دعم فني)', description: 'Support tickets, user requests & assigned clients' },
  { id: 'finance', label: 'Finance (مالية)', description: 'Payments, subscriptions and revenue overview' },
  { id: 'viewer', label: 'Viewer (مشاهد)', description: 'Read-only access to products and overview' },
];

export type PageKey =
  | 'overview'
  | 'analytics'
  | 'server_health'
  | 'crashlytics'
  | 'dawaty'
  | 'digital_menu'
  | 'cv_maker'
  | 'qr_me'
  | 'finance'
  | 'ai_usage'
  | 'users'
  | 'support'
  | 'settings'
  | 'website';

export const ALL_PAGES: { key: PageKey; labelEn: string; labelAr: string; app?: string }[] = [
  { key: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة' },
  { key: 'analytics', labelEn: 'Analytics', labelAr: 'التحليلات والإحصائيات' },
  { key: 'server_health', labelEn: 'Server Health', labelAr: 'حالة الخادم والموارد' },
  { key: 'crashlytics', labelEn: 'Crashlytics & Errors', labelAr: 'مراقبة أخطاء التطبيقات' },
  { key: 'digital_menu', labelEn: 'Digital Menu', labelAr: 'المنيو الرقمي والمطاعم', app: 'digital_menu' },
  { key: 'dawaty', labelEn: 'Dawaty', labelAr: 'دعواتي الإلكترونية', app: 'dawaty' },
  { key: 'cv_maker', labelEn: 'CV Maker Studio', labelAr: 'صانع السيرة الذاتية', app: 'cv_maker' },
  { key: 'qr_me', labelEn: 'QR Me Barcode', labelAr: 'كيو آر مي', app: 'qr_me' },
  { key: 'users', labelEn: 'Users & Clients', labelAr: 'إدارة العملاء والمستخدمين' },
  { key: 'support', labelEn: 'Support Tickets', labelAr: 'الدعم الفني والطلبات' },
  { key: 'finance', labelEn: 'Finance & Payments', labelAr: 'المالية والمدفوعات' },
  { key: 'ai_usage', labelEn: 'AI Scans Usage', labelAr: 'استهلاك الذكاء الاصطناعي' },
  { key: 'website', labelEn: 'Website CMS', labelAr: 'محتوى الموقع التعريفي' },
  { key: 'settings', labelEn: 'Settings & Team', labelAr: 'الإعدادات وفريق العمل' },
];

export const ALL_APPS = [
  { id: 'digital_menu', name: 'Digital Menu (منيو المطاعم)' },
  { id: 'dawaty', name: 'Dawaty (منصة دعوتي)' },
  { id: 'cv_maker', name: 'CV Maker (صانع السيرة الذاتية)' },
  { id: 'qr_me', name: 'QR Me (باركود كيو ار مي)' },
];

export const PAGE_ACCESS: Record<Role, PageKey[]> = {
  owner: ['overview', 'analytics', 'server_health', 'crashlytics', 'dawaty', 'digital_menu', 'cv_maker', 'qr_me', 'finance', 'ai_usage', 'users', 'support', 'settings', 'website'],
  admin: ['overview', 'analytics', 'server_health', 'crashlytics', 'dawaty', 'digital_menu', 'cv_maker', 'qr_me', 'finance', 'ai_usage', 'users', 'support', 'settings', 'website'],
  employee: ['overview', 'digital_menu', 'users', 'support', 'server_health'],
  sales: ['overview', 'digital_menu', 'users', 'support'],
  finance: ['overview', 'analytics', 'finance'],
  support: ['overview', 'dawaty', 'digital_menu', 'cv_maker', 'qr_me', 'users', 'support', 'crashlytics'],
  viewer: ['overview', 'analytics', 'dawaty', 'digital_menu', 'cv_maker', 'qr_me'],
};


export function canAccess(
  role: Role,
  page: PageKey,
  customPermissions?: PageKey[] | null,
  assignedApps?: string[] | null
): boolean {
  if (role === 'owner') return true;

  // 1. If explicit custom permissions are provided for this employee, evaluate them
  if (customPermissions && Array.isArray(customPermissions) && customPermissions.length > 0) {
    if (customPermissions.includes(page)) return true;
  }

  // 2. If employee has access to this app, grant page access to the app
  if (assignedApps && Array.isArray(assignedApps) && assignedApps.length > 0) {
    if (page === 'digital_menu' && assignedApps.includes('digital_menu')) return true;
    if (page === 'dawaty' && assignedApps.includes('dawaty')) return true;
    if (page === 'cv_maker' && assignedApps.includes('cv_maker')) return true;
    if (page === 'qr_me' && assignedApps.includes('qr_me')) return true;
  }

  // 3. Overview is accessible if user has at least one permission
  if (page === 'overview') return true;

  // 4. Default role fallback
  return PAGE_ACCESS[role]?.includes(page) ?? false;
}

export function canApprovePayments(role: Role, customPermissions?: PageKey[] | null): boolean {
  if (role === 'owner') return true;
  if (customPermissions?.includes('finance')) return true;
  return role === 'admin' || role === 'finance';
}

export function canManageTeam(role: Role): boolean {
  return role === 'owner';
}

export function canViewSettings(role: Role, customPermissions?: PageKey[] | null): boolean {
  if (role === 'owner') return true;
  if (customPermissions?.includes('settings')) return true;
  return role === 'admin';
}
