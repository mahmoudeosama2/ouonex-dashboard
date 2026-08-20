import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Heart, UtensilsCrossed, Wallet, Sparkles, Users, Settings,
  Menu, X, Bell, Search, ChevronDown, ShieldCheck, Activity, LogOut, Globe2,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { canAccess, type PageKey } from '@/lib/rbac';
import { ROLES } from '@/lib/rbac';
import { timeAgo } from '@/lib/format';
import { teamMembers } from '@/lib/mock-data';

const NAV: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { key: 'dawaty', label: 'Dawaty', icon: <Heart className="w-[18px] h-[18px]" /> },
  { key: 'digital_menu', label: 'Digital Menu', icon: <UtensilsCrossed className="w-[18px] h-[18px]" /> },
  { key: 'finance', label: 'Finance', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { key: 'ai_usage', label: 'AI Usage', icon: <Sparkles className="w-[18px] h-[18px]" /> },
  { key: 'users', label: 'Users', icon: <Users className="w-[18px] h-[18px]" /> },
  { key: 'website', label: 'Website CMS', icon: <Globe2 className="w-[18px] h-[18px]" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

const PRODUCT_ICONS: Record<string, ReactNode> = {
  dawaty: <Heart className="w-3.5 h-3.5" />,
  digital_menu: <UtensilsCrossed className="w-3.5 h-3.5" />,
};

interface Props {
  current: PageKey;
  onNavigate: (p: PageKey) => void;
  children: ReactNode;
  pendingCount?: number;
}

export function Layout({ current, onNavigate, children, pendingCount = 0 }: Props) {
  const { role, setRole, actorName } = useRole();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);

  const visible = NAV.filter(n => canAccess(role, n.key));
  const me = teamMembers[0];

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-ink-800 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink-50 leading-tight">Ouonex</p>
          <p className="text-2xs text-ink-400 leading-tight">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const active = current === item.key;
          const isFinance = item.key === 'finance';
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-brand-600/10 text-brand-300 border border-brand-600/20'
                  : 'text-ink-300 hover:bg-ink-800/60 hover:text-ink-100 border border-transparent'
              }`}
            >
              <span className={active ? 'text-brand-400' : 'text-ink-400 group-hover:text-ink-200'}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {isFinance && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning-500 text-ink-970 text-2xs font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Health footer */}
      <div className="px-3 py-3 border-t border-ink-800 space-y-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
          <span className="text-2xs text-ink-400">All systems operational</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 text-2xs text-ink-500">
          <ShieldCheck className="w-3 h-3" />
          <span>v1.0 · Mock data mode</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-970 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-ink-900 border-r border-ink-800 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-ink-970/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-ink-900 border-r border-ink-800 animate-slide-in-right">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-ink-800 bg-ink-900/60 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost p-1.5">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="text"
                placeholder="Search users, payments, restaurants..."
                onFocus={() => onNavigate('users')}
                className="input pl-9 w-72 lg:w-80 cursor-pointer"
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2 relative">
              <Bell className="w-[18px] h-[18px]" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warning-400" />
              )}
            </button>

            {/* Role switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenu(v => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-ink-800/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: me.avatar_color }}>
                  {actorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-ink-100 leading-tight">{actorName}</p>
                  <p className="text-2xs text-ink-400 leading-tight capitalize">{role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
              </button>
              {roleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-72 card shadow-pop z-50 p-2 animate-scale-in">
                    <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wide px-3 py-2">Switch role (demo)</p>
                    {ROLES.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setRole(r.id); setRoleMenu(false); }}
                        className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${role === r.id ? 'bg-brand-600/10' : 'hover:bg-ink-800/60'}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-100">{r.label}</p>
                          <p className="text-2xs text-ink-400">{r.description}</p>
                        </div>
                        {role === r.id && <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5" />}
                      </button>
                    ))}
                    <div className="border-t border-ink-800 mt-1 pt-1">
                      <button onClick={() => { logout(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-300 hover:bg-ink-800/60 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
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
      <div className="flex items-start gap-3">
        {icon && <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center text-ink-300">{icon}</div>}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-ink-50 tracking-tight">{title}</h1>
          {description && <p className="text-sm text-ink-400 mt-0.5">{description}</p>}
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
