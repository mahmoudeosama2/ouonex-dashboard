import type { PageKey } from './rbac';
import { api } from './api';

// Map each page to its dynamic chunk loader
export const pageComponentLoaders: Record<PageKey, () => Promise<unknown>> = {
  overview: () => import('@/pages/Overview'),
  analytics: () => import('@/pages/Analytics'),
  server_health: () => import('@/pages/ServerHealth'),
  crashlytics: () => import('@/pages/CrashlyticsErrors'),
  finance: () => import('@/pages/Finance'),
  dawaty: () => import('@/pages/Dawaty'),
  digital_menu: () => import('@/pages/DigitalMenu'),
  cv_maker: () => import('@/pages/CvMaker'),
  qr_me: () => import('@/pages/QrMe'),
  ai_usage: () => import('@/pages/AIUsage'),
  users: () => import('@/pages/Users'),
  support: () => import('@/pages/Support'),
  settings: () => import('@/pages/Settings'),
  website: () => import('@/pages/WebsiteCMS'),
};

const preloadedPages = new Set<PageKey>();

export function preloadPageChunk(key: PageKey): void {
  if (preloadedPages.has(key)) return;
  preloadedPages.add(key);
  const loader = pageComponentLoaders[key];
  if (loader) {
    loader().catch(() => {
      preloadedPages.delete(key);
    });
  }
}

// Prefetch initial API data on hover for 0ms instantaneous load
export function prefetchPageData(key: PageKey): void {
  try {
    switch (key) {
      case 'overview':
        api.overview.kpis();
        api.overview.revenueTrend(30);
        break;
      case 'server_health':
        api.system.serverMetrics();
        break;
      case 'finance':
        api.payments.pending();
        api.payments.list({ status: 'all', page: 1, per_page: 20 });
        break;
      case 'dawaty':
        api.dawaty.invitations({ page: 1, per_page: 15 });
        break;
      case 'digital_menu':
        api.digitalMenu.restaurants();
        break;
      case 'cv_maker':
        api.cvMaker.stats();
        break;
      case 'qr_me':
        api.qrMe.stats();
        break;
      case 'users':
        api.users.search('', 1);
        break;
      case 'support':
        api.support.overview();
        api.support.tickets({ page: 1, per_page: 15 });
        break;
      case 'ai_usage':
        api.ai.scans();
        api.ai.keys.list();
        break;
      case 'settings':
        api.settings.get();
        break;
      default:
        break;
    }
  } catch {
    // Ignore prefetch errors
  }
}

export function handlePageHover(key: PageKey): void {
  preloadPageChunk(key);
  prefetchPageData(key);
}
