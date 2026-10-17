import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { ToastProvider } from '@/context/ToastContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { canAccess, type PageKey } from '@/lib/rbac';
import { api } from '@/lib/api';
import { Login } from '@/pages/Login';
import { ShieldAlert, Loader2 } from 'lucide-react';
import type { Role } from '@/lib/types';
import { PendingPaymentAlertModal } from '@/components/PendingPaymentAlertModal';
import { playPendingAlertSound } from '@/lib/audio';

// Ultra-fast Code-Splitting: Lazy load each page chunk on demand or on hover
const Overview = lazy(() => import('@/pages/Overview').then(m => ({ default: m.Overview })));
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })));
const Finance = lazy(() => import('@/pages/Finance').then(m => ({ default: m.Finance })));
const Dawaty = lazy(() => import('@/pages/Dawaty').then(m => ({ default: m.Dawaty })));
const DigitalMenu = lazy(() => import('@/pages/DigitalMenu').then(m => ({ default: m.DigitalMenu })));
const CvMaker = lazy(() => import('@/pages/CvMaker').then(m => ({ default: m.CvMaker })));
const QrMe = lazy(() => import('@/pages/QrMe').then(m => ({ default: m.QrMe })));
const AIUsage = lazy(() => import('@/pages/AIUsage').then(m => ({ default: m.AIUsage })));
const UsersPage = lazy(() => import('@/pages/Users').then(m => ({ default: m.UsersPage })));
const SupportPage = lazy(() => import('@/pages/Support').then(m => ({ default: m.SupportPage })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const WebsiteCMS = lazy(() => import('@/pages/WebsiteCMS').then(m => ({ default: m.WebsiteCMS })));
const ServerHealth = lazy(() => import('@/pages/ServerHealth').then(m => ({ default: m.ServerHealth })));
const CrashlyticsErrors = lazy(() => import('@/pages/CrashlyticsErrors').then(m => ({ default: m.CrashlyticsErrors })));

function PageLoadingFallback() {
  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center py-20 space-y-3 animate-fade-in">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <Loader2 className="w-5 h-5 text-brand-400 absolute inset-0 m-auto animate-pulse" />
      </div>
      <span className="text-xs text-ink-400 font-medium tracking-wide">جاري التحميل اللحظي...</span>
    </div>
  );
}

function renderPageComponent(p: PageKey, onNavigate: (p: PageKey) => void) {
  switch (p) {
    case 'overview': return <Overview onNavigate={onNavigate} />;
    case 'analytics': return <Analytics />;
    case 'server_health': return <ServerHealth />;
    case 'crashlytics': return <CrashlyticsErrors />;
    case 'finance': return <Finance />;
    case 'dawaty': return <Dawaty />;
    case 'digital_menu': return <DigitalMenu />;
    case 'cv_maker': return <CvMaker />;
    case 'qr_me': return <QrMe />;
    case 'ai_usage': return <AIUsage />;
    case 'users': return <UsersPage />;
    case 'support': return <SupportPage />;
    case 'settings': return <Settings onNavigate={onNavigate} />;
    case 'website': return <WebsiteCMS />;
    default: return <Overview onNavigate={onNavigate} />;
  }
}

function Dashboard() {
  const { role, can } = useRole();
  const [page, setPage] = useState<PageKey>('overview');
  const [visitedPages, setVisitedPages] = useState<Set<PageKey>>(() => new Set(['overview']));
  const [pendingCount, setPendingCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const hasAlertedPendingRef = useRef(false);

  const refreshCounters = useCallback(async () => {
    try {
      const [pending, ov] = await Promise.allSettled([
        api.payments.pending(),
        api.support.overview(),
      ]);
      if (pending.status === 'fulfilled') {
        const count = pending.value.length;
        setPendingCount(count);
        if (count > 0 && !hasAlertedPendingRef.current) {
          hasAlertedPendingRef.current = true;
          setShowPendingModal(true);
          playPendingAlertSound();
        }
      }
      if (ov.status === 'fulfilled') setSupportCount(ov.value.data.unread_badge || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { refreshCounters(); }, [refreshCounters]);

  const handleNavigate = useCallback((p: PageKey) => {
    if (canAccess(role, p)) {
      setVisitedPages(prev => {
        if (prev.has(p)) return prev;
        const next = new Set(prev);
        next.add(p);
        return next;
      });
      setPage(p);
    }
  }, [role]);

  // Keep visitedPages in sync with current role permissions
  useEffect(() => {
    setVisitedPages(prev => {
      const next = new Set<PageKey>();
      for (const p of prev) {
        if (canAccess(role, p)) next.add(p);
      }
      if (!next.has(page) && canAccess(role, page)) {
        next.add(page);
      }
      return next;
    });
  }, [role, page]);

  return (
    <Layout current={page} onNavigate={handleNavigate} pendingCount={pendingCount} supportCount={supportCount}>
      {!can(page) ? (
        <EmptyState
          icon={<ShieldAlert className="w-5 h-5" />}
          title="Access restricted"
          message={`Your role (${role}) does not have permission to view this page. Switch roles from the top-right menu to explore.`}
        />
      ) : (
        Array.from(visitedPages).map(p => {
          const isCurrent = p === page;
          return (
            <div
              key={p}
              style={{ display: isCurrent ? 'block' : 'none' }}
              className={isCurrent ? 'animate-fade-in' : undefined}
            >
              <ErrorBoundary key={`${p}-${retryKey}`} onRetry={() => setRetryKey(k => k + 1)}>
                <Suspense fallback={<PageLoadingFallback />}>
                  {renderPageComponent(p, handleNavigate)}
                </Suspense>
              </ErrorBoundary>
            </div>
          );
        })
      )}

      {/* Central modal for manual payment approval alert */}
      <PendingPaymentAlertModal
        open={showPendingModal}
        pendingCount={pendingCount}
        onReview={() => {
          setShowPendingModal(false);
          handleNavigate('finance');
        }}
        onClose={() => setShowPendingModal(false)}
      />
    </Layout>
  );
}

function AppInner() {
  const { isAuthenticated, role, logout } = useAuth();
  const [authRole, setAuthRole] = useState<Role | null>(null);

  useEffect(() => {
    if (isAuthenticated && role) setAuthRole(role);
  }, [isAuthenticated, role]);

  if (!isAuthenticated) return <Login />;

  return (
    <RoleProvider initialRole={authRole ?? 'owner'}>
      <Dashboard />
    </RoleProvider>
  );
}

function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}

export default App;
