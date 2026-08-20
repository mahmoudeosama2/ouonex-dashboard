import { useEffect, useState } from 'react';
import {
  Users, UserCheck, Wallet, Clock, Heart, UtensilsCrossed, TrendingUp,
  ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2, XCircle, UserPlus, FileText,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { OverviewKPIs, RevenuePoint, UserGrowthPoint, ProductComparison, ActivityItem, HealthIndicator } from '@/lib/types';
import { KPICard } from '@/components/KPICard';
import { LineChart, BarChart, CHART_COLORS } from '@/components/Charts';
import { CardSkeleton, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { ProductBadge } from '@/components/Badge';
import { egp, num, compactNum, timeAgo } from '@/lib/format';
import type { PageKey } from '@/lib/rbac';

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  payment_approved: <CheckCircle2 className="w-4 h-4 text-success-400" />,
  payment_rejected: <XCircle className="w-4 h-4 text-danger-400" />,
  payment_submitted: <Clock className="w-4 h-4 text-warning-400" />,
  signup: <UserPlus className="w-4 h-4 text-accent-400" />,
  ai_scan: <Sparkles className="w-4 h-4 text-brand-400" />,
  invitation_published: <FileText className="w-4 h-4 text-ink-300" />,
};

export function Overview({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [comparison, setComparison] = useState<ProductComparison[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<30 | 90>(30);
  const [health, setHealth] = useState<HealthIndicator[]>([]);
  const [healthUpdated, setHealthUpdated] = useState<Date | null>(null);
  const [healthAgo, setHealthAgo] = useState(0);

  // Health auto-refresh every 30 seconds
  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const h = await api.team.health();
        if (!cancelled) {
          setHealth(h);
          setHealthUpdated(new Date());
          setHealthAgo(0);
        }
      } catch {
        if (!cancelled) setHealthUpdated(new Date());
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Tick "X seconds ago" label every second
  useEffect(() => {
    if (!healthUpdated) return;
    const tick = setInterval(() => {
      setHealthAgo(Math.floor((Date.now() - healthUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [healthUpdated]);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    setError(false);
    Promise.all([
      api.overview.kpis(),
      api.overview.revenueTrend(period),
      api.overview.userGrowth(period),
      api.overview.comparison(),
      api.overview.activity(),
    ]).then(([k, r, u, c, a]) => {
      if (!ok) return;
      setKpis(k); setRevenue(r); setUserGrowth(u); setComparison(c); setActivity(a);
    }).catch(() => setError(true)).finally(() => setLoading(false));
    return () => { ok = false; };
  }, [period]);

  if (error) return <ErrorState message="Failed to load dashboard overview." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Cross-product analytics for Dawaty and Digital Menu"
        actions={
          <div className="flex items-center gap-1 bg-ink-900 border border-ink-800 rounded-lg p-1">
            <button
              onClick={() => setPeriod(30)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === 30 ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
            >30 days</button>
            <button
              onClick={() => setPeriod(90)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === 90 ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
            >90 days</button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading || !kpis ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KPICard label="Total Users" value={kpis.totalUsers} format="num" delta={kpis.deltas.totalUsers} icon={<Users className="w-4 h-4" />} />
            <KPICard label="Active Users" value={kpis.activeUsers} format="num" delta={kpis.deltas.activeUsers} icon={<UserCheck className="w-4 h-4" />} accent="success" />
            <KPICard label="Total Revenue" value={kpis.totalRevenue} format="compactEGP" delta={kpis.deltas.totalRevenue} icon={<Wallet className="w-4 h-4" />} />
            <KPICard
              label="Pending Payments"
              value={kpis.pendingPaymentsCount}
              format="num"
              delta={kpis.deltas.pendingPaymentsCount}
              icon={<Clock className="w-4 h-4" />}
              highlight
            />
            <KPICard label="Pending Amount" value={kpis.pendingPaymentsAmount} format="egp" icon={<Wallet className="w-4 h-4" />} accent="warning" />
            <KPICard label="Active Invitations" value={kpis.activeInvitations} format="num" delta={kpis.deltas.activeInvitations} icon={<Heart className="w-4 h-4" />} />
            <KPICard label="Active Restaurants" value={kpis.activeRestaurants} format="num" delta={kpis.deltas.activeRestaurants} icon={<UtensilsCrossed className="w-4 h-4" />} />
            <KPICard label="Revenue / Active" value={Math.round(kpis.totalRevenue / kpis.activeUsers)} format="egp" icon={<TrendingUp className="w-4 h-4" />} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">Revenue Trend</h3>
              <p className="text-xs text-ink-400">Approved payments only · last {period} days</p>
            </div>
            <span className="text-xs text-ink-400">EGP</span>
          </div>
          {loading ? <div className="h-[200px] skeleton rounded-lg" /> : (
            <LineChart data={revenue} height={200} color={CHART_COLORS.brand} format={(n) => egp(n)} />
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-1">User Growth</h3>
          <p className="text-xs text-ink-400 mb-4">Total users over time</p>
          {loading ? <div className="h-[200px] skeleton rounded-lg" /> : (
            <LineChart data={userGrowth.map(u => ({ date: u.date, value: u.total }))} height={200} color={CHART_COLORS.accent} format={(n) => compactNum(n)} />
          )}
        </div>
      </div>

      {/* Comparison + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">Product Comparison</h3>
          {loading ? <div className="h-[200px] skeleton rounded-lg" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {comparison.map(p => (
                <div key={p.product} className="rounded-xl2 border border-ink-800 p-4 bg-ink-950/50">
                  <div className="flex items-center justify-between mb-3">
                    <ProductBadge product={p.product} />
                    <span className="text-xs text-success-400 font-medium flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {p.growth}%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xs text-ink-400 uppercase tracking-wide">Users</p>
                      <p className="text-xl font-bold text-ink-50 tabular-nums">{num(p.users)}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-ink-400 uppercase tracking-wide">Revenue</p>
                      <p className="text-xl font-bold text-ink-50 tabular-nums">{egp(p.revenue)}</p>
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-2xs text-ink-400 mb-1">
                        <span>Revenue share</span>
                        <span>{Math.round((p.revenue / comparison.reduce((s, x) => s + x.revenue, 0)) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(p.revenue / comparison.reduce((s, x) => s + x.revenue, 0)) * 100}%`,
                            backgroundColor: p.product === 'dawaty' ? CHART_COLORS.pink : CHART_COLORS.brand,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-100">Recent Activity</h3>
            <button onClick={() => onNavigate('finance')} className="text-2xs text-brand-400 hover:text-brand-300 font-medium">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-1 -mx-2">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-ink-800/40 transition-colors">
                  <div className="mt-0.5 shrink-0">{ACTIVITY_ICON[a.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-200 leading-snug">{a.message}</p>
                    <p className="text-2xs text-ink-500 mt-0.5">{a.actor} · {timeAgo(a.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-ink-400" />
              <h3 className="text-sm font-semibold text-ink-100">Backend Health</h3>
            </div>
            {healthUpdated && (
              <span className="text-2xs text-ink-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
                Last updated {healthAgo}s ago · auto-refreshes every 30s
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.map(h => (
              <div key={h.product} className="rounded-xl2 border border-ink-800 p-4 bg-ink-950/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${h.reachable ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-100">{h.name}</p>
                    <p className="text-2xs text-ink-400">{timeAgo(h.last_sync)} · {h.latency_ms}ms</p>
                  </div>
                </div>
                <span className={`badge ${h.reachable ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${h.reachable ? 'bg-success-400 animate-pulse' : 'bg-danger-400'}`} />
                  {h.reachable ? 'Reachable' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
