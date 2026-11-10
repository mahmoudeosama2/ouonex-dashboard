import { useEffect, useState, useTransition } from 'react';
import {
  Users, UserCheck, Wallet, Clock, Heart, UtensilsCrossed, TrendingUp,
  ArrowUpRight, Sparkles, CheckCircle2, XCircle, UserPlus, FileText,
  Activity, Smartphone, RefreshCw, ChevronRight, Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import type { OverviewKPIs, RevenuePoint, UserGrowthPoint, ProductComparison, ActivityItem, HealthIndicator } from '@/lib/types';
import { KPICard } from '@/components/KPICard';
import { LineChart, CHART_COLORS } from '@/components/Charts';
import { CardSkeleton, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { ProductBadge } from '@/components/Badge';
import { egp, num, compactNum, timeAgo, formatHealthName } from '@/lib/format';
import type { PageKey } from '@/lib/rbac';
import { useLocale } from '@/context/LocaleContext';
import { RecentActivityModal } from '@/components/RecentActivityModal';

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  payment_approved: <CheckCircle2 className="w-4 h-4 text-success-400" />,
  payment_rejected: <XCircle className="w-4 h-4 text-danger-400" />,
  payment_submitted: <Clock className="w-4 h-4 text-warning-400" />,
  signup: <UserPlus className="w-4 h-4 text-accent-400" />,
  ai_scan: <Sparkles className="w-4 h-4 text-brand-400" />,
  invitation_published: <FileText className="w-4 h-4 text-ink-300" />,
};

export function Overview({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const { t, locale, isRTL } = useLocale();
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [comparison, setComparison] = useState<ProductComparison[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  
  // Loading states: Initial vs Period Transition (Optimistic Zero-Latency UX)
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPeriodChanging, setIsPeriodChanging] = useState(false);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<30 | 90>(30);
  
  const [health, setHealth] = useState<HealthIndicator[]>([]);
  const [healthUpdated, setHealthUpdated] = useState<Date | null>(null);
  const [healthAgo, setHealthAgo] = useState(0);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // Live Health auto-refresh every 30 seconds
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

  // Zero-Latency Data Fetching with Optimistic Stale-While-Revalidate
  useEffect(() => {
    let ok = true;
    if (!kpis) {
      setInitialLoading(true);
    } else {
      setIsPeriodChanging(true);
    }
    setError(false);

    Promise.all([
      api.overview.kpis(),
      api.overview.revenueTrend(period),
      api.overview.userGrowth(period),
      api.overview.comparison(),
      api.overview.activity(),
    ])
      .then(([k, r, u, c, a]) => {
        if (!ok) return;
        setKpis(k);
        setRevenue(r);
        setUserGrowth(u);
        setComparison(c);
        setActivity(a);
      })
      .catch(() => {
        if (!kpis) setError(true);
      })
      .finally(() => {
        if (ok) {
          setInitialLoading(false);
          setIsPeriodChanging(false);
        }
      });

    return () => {
      ok = false;
    };
  }, [period]);

  if (error && !kpis) {
    return (
      <ErrorState
        message={locale === 'ar' ? 'فشل تحميل بيانات النظرة العامة للوحة التحكم.' : 'Failed to load dashboard overview.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const totalComparisonRevenue = comparison.reduce((s, x) => s + x.revenue, 0) || 1;

  return (
    <div className="relative pb-12 animate-fade-in">
      {/* Micro-Progress Accelerator (Top accent bar during optimistic refetches) */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-400 z-50 transition-opacity duration-300 pointer-events-none ${
          isPeriodChanging ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header with Sliding Spring Segmented Control */}
      <PageHeader
        title={t('overview.title')}
        description={t('overview.description')}
        actions={
          <div className="flex items-center gap-2">
            {/* Sliding Spring Period Control (Pillar 1 & 2: Instant feedback, 0ms hard cuts) */}
            <div className="relative inline-flex items-center p-1 rounded-xl bg-ink-950/90 border border-ink-800 shadow-inner backdrop-blur-sm">
              <div
                className={`absolute inset-y-1 rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 border-t border-white/20 shadow-soft transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  period === 30
                    ? isRTL ? 'right-1 w-[calc(50%-4px)]' : 'left-1 w-[calc(50%-4px)]'
                    : isRTL ? 'right-[50%] w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'
                }`}
              />
              <button
                onClick={() => setPeriod(30)}
                className={`relative z-10 min-h-[36px] px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 select-none ${
                  period === 30 ? 'text-white' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {t('overview.period_30')}
              </button>
              <button
                onClick={() => setPeriod(90)}
                className={`relative z-10 min-h-[36px] px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 select-none ${
                  period === 90 ? 'text-white' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {t('overview.period_90')}
              </button>
            </div>
          </div>
        }
      />

      {/* ── CHUNK 1: Core Financial Traction & User Health (Pillar 4: Chunking ≤ 4 chunks) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-400" />
            <h4 className="text-xs font-bold text-ink-300 uppercase tracking-wider">
              {locale === 'ar' ? 'المؤشرات المالية ونمو المستخدمين' : 'Financial Traction & Growth'}
            </h4>
          </div>
          {isPeriodChanging && (
            <span className="text-2xs text-brand-400 flex items-center gap-1.5 animate-pulse font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {locale === 'ar' ? 'تحديث البيانات...' : 'Syncing metrics...'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {initialLoading || !kpis ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <KPICard
                label={t('overview.total_revenue')}
                value={kpis.totalRevenue}
                format="compactEGP"
                delta={kpis.deltas.totalRevenue}
                icon={<Wallet className="w-4 h-4" />}
                onClick={() => onNavigate('finance')}
                actionHint={locale === 'ar' ? 'السجل المالي ↗' : 'Finance Studio ↗'}
              />
              <KPICard
                label={t('overview.total_users')}
                value={kpis.totalUsers}
                format="num"
                delta={kpis.deltas.totalUsers}
                icon={<Users className="w-4 h-4" />}
                onClick={() => onNavigate('users')}
                actionHint={locale === 'ar' ? 'دليل المستخدمين ↗' : 'Users Directory ↗'}
              />
              <KPICard
                label={t('overview.active_users')}
                value={kpis.activeUsers}
                format="num"
                delta={kpis.deltas.activeUsers}
                icon={<UserCheck className="w-4 h-4" />}
                accent="success"
              />
              <KPICard
                label={t('overview.revenue_per_active')}
                value={kpis.activeUsers > 0 ? Math.round(kpis.totalRevenue / kpis.activeUsers) : 0}
                format="egp"
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </>
          )}
        </div>
      </div>

      {/* ── CHUNK 2: Operational Triage & Ecosystem Metrics (Pillar 4: Von Restorff & Fitts's Law) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning-500" />
            </span>
            <h4 className="text-xs font-bold text-ink-300 uppercase tracking-wider">
              {locale === 'ar' ? 'العمليات العاجلة ونشاط المنتجات' : 'Priority Action & Ecosystem Triage'}
            </h4>
          </div>
          <span className="text-2xs text-warning-400 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {locale === 'ar' ? 'معاملات بانتظار التحقق' : 'Action items require triage'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {initialLoading || !kpis ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={`s2-${i}`} />)
          ) : (
            <>
              {/* Highlighted Urgent Action Card with Ambient Glow */}
              <KPICard
                label={t('overview.pending_payments')}
                value={kpis.pendingPaymentsCount}
                format="num"
                delta={kpis.deltas.pendingPaymentsCount}
                icon={<Clock className="w-4 h-4" />}
                highlight
                onClick={() => onNavigate('finance')}
                actionHint={locale === 'ar' ? 'مراجعة وقبول ↗' : 'Review in Finance ↗'}
              />
              <KPICard
                label={t('overview.pending_amount')}
                value={kpis.pendingPaymentsAmount}
                format="egp"
                icon={<Wallet className="w-4 h-4" />}
                accent="warning"
                onClick={() => onNavigate('finance')}
                actionHint={locale === 'ar' ? 'المعلق ↗' : 'Pending Sum ↗'}
              />
              <KPICard
                label={t('overview.active_invitations')}
                value={kpis.activeInvitations}
                format="num"
                delta={kpis.deltas.activeInvitations}
                icon={<Heart className="w-4 h-4" />}
                onClick={() => onNavigate('dawaty')}
                actionHint={locale === 'ar' ? 'دعوتي ↗' : 'Dawaty ↗'}
              />
              <KPICard
                label={t('overview.active_restaurants')}
                value={kpis.activeRestaurants}
                format="num"
                delta={kpis.deltas.activeRestaurants}
                icon={<UtensilsCrossed className="w-4 h-4" />}
                onClick={() => onNavigate('digital_menu')}
                actionHint={locale === 'ar' ? 'المنيو الرقمي ↗' : 'Menu Studio ↗'}
              />
            </>
          )}
        </div>
      </div>

      {/* ── CHARTS ROW: Physics Easing, Non-Linear Tooltips & Concentric Geometry ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 rounded-2xl lg:col-span-2 relative group">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-400" />
                {t('overview.revenue_trend')}
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">{t('overview.revenue_sub', { period })}</p>
            </div>
            <span className="text-2xs font-bold text-ink-300 bg-ink-850 px-2.5 py-1 rounded-lg border border-ink-800">
              EGP
            </span>
          </div>

          {initialLoading ? (
            <div className="h-[220px] skeleton rounded-xl" />
          ) : (
            <div className={`transition-opacity duration-300 ${isPeriodChanging ? 'opacity-60' : 'opacity-100'}`}>
              <LineChart
                data={revenue}
                height={220}
                color={CHART_COLORS.brand}
                format={(n) => egp(n)}
              />
            </div>
          )}
        </div>

        <div className="card p-6 rounded-2xl relative group">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-400" />
              {t('overview.user_growth')}
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">{t('overview.user_growth_sub')}</p>
          </div>

          {initialLoading ? (
            <div className="h-[220px] skeleton rounded-xl" />
          ) : (
            <div className={`transition-opacity duration-300 ${isPeriodChanging ? 'opacity-60' : 'opacity-100'}`}>
              <LineChart
                data={userGrowth.map((u) => ({ date: u.date, value: u.total }))}
                height={220}
                color={CHART_COLORS.accent}
                format={(n) => compactNum(n)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── COMPARISON & ACTIVITY ROW (Concentric Radius Law: Outer 16px - Padding 16px = Inner 12px) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Product Comparison Breakdown */}
        <div className="card p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              {t('overview.product_comparison')}
            </h3>
            <span className="text-2xs text-ink-400">
              {locale === 'ar' ? 'مقارنة الحصة السوقية والإيرادات' : 'Market Share & Revenue'}
            </span>
          </div>

          {initialLoading ? (
            <div className="h-[200px] skeleton rounded-xl" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {comparison.map((p) => {
                const sharePercent = Math.round((p.revenue / totalComparisonRevenue) * 100);
                const isDawaty = p.product === 'dawaty';

                return (
                  <div
                    key={p.product}
                    onClick={() => onNavigate(isDawaty ? 'dawaty' : 'digital_menu')}
                    className="group rounded-xl border border-ink-800/80 p-4 bg-ink-950/60 hover:bg-ink-900/80 hover:border-ink-700 hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shadow-soft"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <ProductBadge product={p.product} />
                      <span className="text-xs text-success-400 font-semibold flex items-center gap-0.5 bg-success-500/10 px-2 py-0.5 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {p.growth}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xs text-ink-400 uppercase tracking-wide">{t('overview.users')}</p>
                          <p className="text-xl font-extrabold text-ink-50 tabular-nums">{num(p.users)}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-2xs text-ink-400 uppercase tracking-wide">{t('overview.revenue')}</p>
                          <p className="text-xl font-extrabold text-ink-50 tabular-nums">{egp(p.revenue)}</p>
                        </div>
                      </div>

                      {/* Smooth Progress Meter (Pillar 1 & 2: Non-linear smooth easing) */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-2xs font-semibold text-ink-300 mb-1.5">
                          <span>{t('overview.revenue_share')}</span>
                          <span className="tabular-nums text-ink-100">{sharePercent}%</span>
                        </div>
                        <div className="h-2 bg-ink-850 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isDawaty
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                                : 'bg-gradient-to-r from-brand-500 to-cyan-400'
                            }`}
                            style={{ width: `${sharePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Recent Activity Feed */}
        <div className="card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t('overview.recent_activity')}
              </h3>
              <button
                onClick={() => setActivityModalOpen(true)}
                className="btn-ghost text-xs text-brand-400 hover:text-brand-300 font-bold min-h-[36px] px-2.5 active:scale-95 transition-all"
              >
                {t('overview.view_all')}
              </button>
            </div>

            {initialLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 -mx-2">
                {activity.slice(0, 5).map((a, idx) => (
                  <div
                    key={a.id}
                    onClick={() => setActivityModalOpen(true)}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-ink-850/60 hover:translate-x-1 rtl:hover:-translate-x-1 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer group"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-ink-900 border border-ink-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      {ACTIVITY_ICON[a.type] ?? <Activity className="w-4 h-4 text-brand-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-200 leading-snug line-clamp-1 group-hover:text-ink-50 transition-colors">
                        {a.message}
                      </p>
                      <p className="text-2xs text-ink-400 mt-0.5">
                        <span className="text-ink-300 font-semibold">{a.actor}</span> · {timeAgo(a.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-ink-800/60">
            <button
              onClick={() => setActivityModalOpen(true)}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl hover:border-brand-500/40"
            >
              <span>{locale === 'ar' ? 'عرض السجل الكامل للأحداث' : 'Open Full Activity Log'}</span>
              <ChevronRight className={`w-3.5 h-3.5 text-ink-400 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CHUNK 3: Real-Time Infrastructure Health & Server Pulse ── */}
      <div className="card p-6 rounded-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ink-850 border border-ink-800 flex items-center justify-center">
              <Activity className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-100">{t('overview.backend_health')}</h3>
              <p className="text-2xs text-ink-400">{locale === 'ar' ? 'فحص دوري لحالة خوادم OUONEX' : 'Continuous health telemetry'}</p>
            </div>
          </div>

          {healthUpdated && (
            <span className="text-2xs text-ink-400 flex items-center gap-2 bg-ink-950/80 px-3 py-1.5 rounded-lg border border-ink-800 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
              {t('overview.health_updated', { sec: healthAgo })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {health.map((h) => {
            const isFast = h.latency_ms < 150;
            const isMedium = h.latency_ms >= 150 && h.latency_ms < 400;

            return (
              <div
                key={h.product}
                className="rounded-xl border border-ink-800/80 p-4 bg-ink-950/60 flex items-center justify-between hover:border-ink-700 hover:bg-ink-900/60 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      h.reachable
                        ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                        : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
                    }`}
                  >
                    {h.product === 'sms_gateway' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-100 leading-snug">{formatHealthName(h, locale)}</p>
                    <p className="text-2xs text-ink-400 mt-0.5">
                      {h.product === 'sms_gateway'
                        ? `${timeAgo(h.last_sync, locale)} · ${t('health.battery')} ${h.latency_ms}%`
                        : `${timeAgo(h.last_sync, locale)} · `}
                      {h.product !== 'sms_gateway' && (
                        <span
                          className={`font-semibold ${
                            isFast ? 'text-success-400' : isMedium ? 'text-brand-400' : 'text-warning-400'
                          }`}
                        >
                          {h.latency_ms} {t('health.ms')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`badge ${
                    h.reachable
                      ? 'bg-success-500/15 text-success-300 border border-success-500/30'
                      : 'bg-danger-500/15 text-danger-300 border border-danger-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      h.reachable ? 'bg-success-400 animate-pulse' : 'bg-danger-400'
                    }`}
                  />
                  {h.reachable ? t('overview.online') : t('overview.offline')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Full Modal with Spring Transition */}
      <RecentActivityModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        activities={activity}
        onNavigate={onNavigate}
      />
    </div>
  );
}
