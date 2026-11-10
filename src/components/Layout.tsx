import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Heart, UtensilsCrossed, Wallet, Sparkles, Users, Settings,
  Menu, X, Bell, Search, ChevronDown, ShieldCheck, Activity, LogOut, Globe2, BarChart3,
  LifeBuoy, QrCode, FileText, Server, Bug,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { canAccess, type PageKey } from '@/lib/rbac';
import { ROLES } from '@/lib/rbac';
import { timeAgo } from '@/lib/format';
import { handlePageHover } from '@/lib/pagePrefetch';

const NAV: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { key: 'analytics', label: 'Live Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { key: 'dawaty', label: 'Dawaty', icon: <Heart className="w-[18px] h-[18px]" /> },
  { key: 'digital_menu', label: 'Digital Menu', icon: <UtensilsCrossed className="w-[18px] h-[18px]" /> },
  { key: 'cv_maker', label: 'CV Maker Studio', icon: <FileText className="w-[18px] h-[18px]" /> },
  { key: 'qr_me', label: 'QR Me Barcode', icon: <QrCode className="w-[18px] h-[18px]" /> },
  { key: 'finance', label: 'Finance', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { key: 'users', label: 'Users', icon: <Users className="w-[18px] h-[18px]" /> },
  { key: 'ai_usage', label: 'AI Usage', icon: <Sparkles className="w-[18px] h-[18px]" /> },
  { key: 'crashlytics', label: 'Crashlytics', icon: <Bug className="w-[18px] h-[18px]" /> },
  { key: 'server_health', label: 'Server Health', icon: <Server className="w-[18px] h-[18px]" /> },
  { key: 'support', label: 'Support & Requests', icon: <LifeBuoy className="w-[18px] h-[18px]" /> },
  { key: 'website', label: 'Website CMS', icon: <Globe2 className="w-[18px] h-[18px]" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

const PRODUCT_ICONS: Record<string, ReactNode> = {
  dawaty: <Heart className="w-3.5 h-3.5" />,
  digital_menu: <UtensilsCrossed className="w-3.5 h-3.5" />,
  cv_maker: <FileText className="w-3.5 h-3.5" />,
  qr_me: <QrCode className="w-3.5 h-3.5" />,
};

interface Props {
  current: PageKey;
  onNavigate: (p: PageKey) => void;
  children: ReactNode;
  pendingCount?: number;
  supportCount?: number;
}

export function Layout({ current, onNavigate, children, pendingCount = 0, supportCount = 0 }: Props) {
  const { role, setRole, actorName, can, isOwner } = useRole();
  const { logout } = useAuth();
  const { t, locale, toggle, isRTL } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);

  const visible = NAV.filter(n => can(n.key));

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-800 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink-50 leading-tight">Ouonex</p>
          <p className="text-2xs text-ink-400 leading-tight mt-0.5">{t('topbar.connected')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
        {visible.map(item => {
          const active = current === item.key;
          const isFinance = item.key === 'finance';
          const isSupport = item.key === 'support';
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
              onMouseEnter={() => handlePageHover(item.key)}
              onFocus={() => handlePageHover(item.key)}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group active:scale-[0.98] cursor-pointer ${
                active
                  ? 'bg-ink-800 text-brand-300 border border-brand-500/30 shadow-sm scale-[1.01] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                  : 'text-ink-300 hover:bg-ink-800/60 hover:text-ink-100 border border-transparent'
              }`}
            >
              <span className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-brand-400' : 'text-ink-400 group-hover:text-ink-200'}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-start">{t('nav.' + item.key, { en: item.label, ar: item.label } as any)}</span>
              {isFinance && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning-500 text-ink-970 text-2xs font-black animate-pulse shadow-sm">
                  {pendingCount}
                </span>
              )}
              {isSupport && supportCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-2xs font-black animate-pulse shadow-sm">
                  {supportCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Health footer */}
      <div className="px-3 py-3 border-t border-ink-800 space-y-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
          <span className="text-2xs font-medium text-ink-400">{t('topbar.all_operational')}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 text-2xs text-ink-500">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('topbar.connected')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-970 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-ink-900 border-r border-ink-800 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-ink-970/80 backdrop-blur-md animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-ink-900 border-r border-ink-800 shadow-2xl animate-slide-in-right h-full">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-ink-800 bg-ink-900/60 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl hover:bg-ink-800/80 text-ink-300 transition-all active:scale-95 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users, payments, restaurants..."
                onFocus={() => onNavigate('users')}
                className="input pl-9 min-h-[42px] rounded-xl w-72 lg:w-80 cursor-pointer bg-ink-950/60 border border-ink-800 focus:border-brand-500/50 text-xs text-ink-200 hover:bg-ink-950/90 transition-all"
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={toggle}
              className="flex items-center gap-2 min-h-[42px] px-3.5 py-1.5 rounded-xl border border-ink-800 hover:border-brand-500/40 bg-ink-950/70 hover:bg-ink-800/70 text-xs font-bold text-ink-200 hover:text-ink-50 transition-all duration-200 active:scale-95 shadow-soft cursor-pointer"
              title={locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe2 className="w-4 h-4 text-brand-400" />
              <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Notification Bell with physics micro-interaction */}
            <button className="min-w-[42px] min-h-[42px] rounded-xl flex items-center justify-center hover:bg-ink-800/80 text-ink-300 hover:text-ink-100 active:scale-90 transition-all duration-200 relative group cursor-pointer">
              <Bell className="w-[18px] h-[18px] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              {pendingCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-warning-400 ring-2 ring-ink-900 animate-pulse" />
              )}
            </button>

            {/* Role switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenu(v => !v)}
                className="flex items-center gap-2.5 pl-2.5 pr-3.5 min-h-[42px] rounded-xl hover:bg-ink-800/80 transition-all active:scale-95 border border-transparent hover:border-ink-800/80 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-brand-600 shadow-sm border border-white/10">
                  {actorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="text-start hidden sm:block">
                  <p className="text-xs font-semibold text-ink-100 leading-tight">{actorName}</p>
                  <p className="text-2xs text-ink-400 leading-tight capitalize">{role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
              </button>
              {roleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleMenu(false)} />
                  <div className={`absolute top-full mt-2 w-72 max-w-[calc(100vw-2rem)] card rounded-2xl border border-ink-700/80 shadow-2xl z-50 p-2.5 bg-ink-900/95 backdrop-blur-xl animate-scale-in shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'}`}>
                    {isOwner ? (
                      <>
                        <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">{t('topbar.switch_role')}</p>
                        {ROLES.map(r => (
                          <button
                            key={r.id}
                            onClick={() => { setRole(r.id); setRoleMenu(false); }}
                            className={`w-full min-h-[44px] flex items-start gap-3 px-3 py-2.5 rounded-xl text-start transition-all active:scale-[0.98] cursor-pointer ${role === r.id ? 'bg-brand-600/15 border border-brand-500/30' : 'hover:bg-ink-800/60'}`}
                          >
                            <div className="flex-1">
                              <p className="text-xs font-bold text-ink-100">{r.label}</p>
                              <p className="text-2xs text-ink-400 mt-0.5">{r.description}</p>
                            </div>
                            {role === r.id && <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs font-bold text-ink-100">{actorName}</p>
                        <p className="text-2xs text-ink-400 capitalize">{role}</p>
                      </div>
                    )}
                    <div className="border-t border-ink-800/80 mt-1.5 pt-1.5">
                      <button onClick={() => { logout(); }} className="w-full min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-ink-300 hover:text-danger-400 hover:bg-danger-500/10 transition-colors active:scale-95 cursor-pointer">
                        <LogOut className="w-4 h-4" /> {t('topbar.sign_out')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions, icon }: { title: string; description?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-ink-800/90 border border-ink-700/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] flex items-center justify-center text-brand-400 shrink-0">
            {icon}
          </div>
        )}
        <div className="text-start">
          <h1 className="text-xl lg:text-2xl font-black text-ink-50 tracking-tight">{title}</h1>
          {description && <p className="text-xs lg:text-sm text-ink-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ProductIcon({ product }: { product: string }) {
  return <>{PRODUCT_ICONS[product] ?? null}</>;
}

export { timeAgo };

