import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { ToastProvider } from '@/context/ToastContext';
import { Layout } from '@/components/Layout';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { canAccess, type PageKey } from '@/lib/rbac';
import { api } from '@/lib/api';
import { Login } from '@/pages/Login';
import { Overview } from '@/pages/Overview';
import { Finance } from '@/pages/Finance';
import { Dawaty } from '@/pages/Dawaty';
import { DigitalMenu } from '@/pages/DigitalMenu';
import { AIUsage } from '@/pages/AIUsage';
import { UsersPage } from '@/pages/Users';
import { Settings } from '@/pages/Settings';
import { WebsiteCMS } from '@/pages/WebsiteCMS';
import { ShieldAlert } from 'lucide-react';
import type { Role } from '@/lib/types';

function Dashboard() {
  const { role, can } = useRole();
  const [page, setPage] = useState<PageKey>('overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      const pending = await api.payments.pending();
      setPendingCount(pending.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => { refreshPending(); }, [refreshPending]);

  const handleNavigate = (p: PageKey) => {
    if (canAccess(role, p)) setPage(p);
  };

  let content: React.ReactNode;
  if (!can(page)) {
    content = (
      <EmptyState
        icon={<ShieldAlert className="w-5 h-5" />}
        title="Access restricted"
        message={`Your role (${role}) does not have permission to view this page. Switch roles from the top-right menu to explore.`}
      />
    );
  } else {
    switch (page) {
      case 'overview': content = <Overview onNavigate={handleNavigate} />; break;
      case 'finance': content = <Finance />; break;
      case 'dawaty': content = <Dawaty />; break;
      case 'digital_menu': content = <DigitalMenu />; break;
      case 'ai_usage': content = <AIUsage />; break;
      case 'users': content = <UsersPage />; break;
      case 'settings': content = <Settings />; break;
      case 'website': content = <WebsiteCMS />; break;
      default: content = <Overview onNavigate={handleNavigate} />;
    }
  }

  return (
    <Layout current={page} onNavigate={handleNavigate} pendingCount={pendingCount}>
      <ErrorBoundary key={`${page}-${retryKey}`} onRetry={() => setRetryKey(k => k + 1)}>
        <div key={page} className="animate-fade-in">
          {content}
        </div>
      </ErrorBoundary>
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
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
