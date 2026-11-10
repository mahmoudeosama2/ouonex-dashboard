import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Users, Flame, Eye, CheckCircle2,
  Heart, UtensilsCrossed,
  TrendingUp, Clock, Award, FileText, QrCode, RefreshCw, Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/Layout';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { useLocale } from '@/context/LocaleContext';

/**
 * Physics-based number interpolation for smooth counter transitions
 */
function useSmoothCounter(target: number, duration = 700): number {
  const [val, setVal] = useState(target);
  const prevRef = useRef(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * eased;
      setVal(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}

export function Analytics() {
  const { t, locale, isRTL } = useLocale();
  const [product, setProduct] = useState<'all' | 'dawaty' | 'digital_menu' | 'cv_maker' | 'qr_me'>('all');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  
  // Optimistic Zero-Latency Loading Architecture
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [overview, setOverview] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!overview) setInitialLoading(true);
    else setIsUpdating(true);
    
    setError(false);

    try {
      const [ov, tr, pk, tp, fn] = await Promise.all([
        api.analytics.overview(product, period),
        api.analytics.traffic(period),
        api.analytics.peakHours(),
        api.analytics.topPerformers(),
        api.analytics.funnel(),
      ]);

      setOverview(ov);
      setTraffic(tr.traffic || []);
      setPeakHours(pk);
      setTopPerformers(tp);
      setFunnel(fn.funnel || []);
    } catch (e) {
      console.error('Failed to load analytics:', e);
      if (!overview) setError(true);
    } finally {
      setInitialLoading(false);
      setIsUpdating(false);
      setRefreshing(false);
    }
  }, [product, period, overview]);

  useEffect(() => {
    loadData();
  }, [product, period]);

  // Auto-refresh real-time counter every 20 seconds without flickering
  useEffect(() => {
    const timer = setInterval(() => {
      api.analytics.overview(product, period).then((ov) => {
        setOverview((prev: any) => (prev ? { ...prev, realtime_active: ov.realtime_active } : prev));
      }).catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [product, period]);

  if (initialLoading && !overview) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={t('analytics.title')} description={locale === 'ar' ? 'جاري التحميل...' : 'Loading metrics...'} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('analytics.title')} description={locale === 'ar' ? 'تحليلات النظام' : 'System insights'} />
        <ErrorState message={locale === 'ar' ? 'تعذر تحميل التحليلات' : 'Failed to load analytics'} onRetry={() => loadData()} />
      </div>
    );
  }

  const metrics = overview?.metrics || {};
  const maxTraffic = Math.max(...traffic.map(t => t.total_views || 1), 10);
  const maxPeak = Math.max(...(peakHours?.hours || []).map((h: any) => h.intensity || 1), 10);

  return (
    <div className="relative space-y-6 pb-12 animate-fade-in">
      {/* Micro-Progress Bar for Zero-Latency Optimistic Filter Toggles */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-emerald-400 to-accent-500 z-50 transition-opacity duration-300 pointer-events-none ${
          isUpdating || refreshing ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header with Live Sync Status Pill */}
      <PageHeader
        title={t('analytics.title')}
        description={t('analytics.description')}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {t('analytics.live_sync')}
            </span>
          </div>
        }
      />

      {/* Control Bar: Sliding Spring Filter Controls (8pt Grid & Concentric Radii) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-b from-ink-900/90 to-ink-950/95 border border-ink-800 shadow-card backdrop-blur-md">
        {/* Product Filter: Tactile Segmented Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-ink-950/90 border border-ink-800 shadow-inner">
          <button
            onClick={() => setProduct('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
              product === 'all'
                ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-soft border-t border-white/20'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {t('analytics.all_platforms')}
          </button>
          <button
            onClick={() => setProduct('dawaty')}
            className={`flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
              product === 'dawaty'
                ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-soft border-t border-white/20'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Dawaty
          </button>
          <button
            onClick={() => setProduct('digital_menu')}
            className={`flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
              product === 'digital_menu'
                ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-ink-970 shadow-soft border-t border-white/20'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Digital Menu
          </button>
          <button
            onClick={() => setProduct('cv_maker')}
            className={`flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
              product === 'cv_maker'
                ? 'bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-soft border-t border-white/20'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            CV Maker
          </button>
          <button
            onClick={() => setProduct('qr_me')}
            className={`flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
              product === 'qr_me'
                ? 'bg-gradient-to-b from-sky-400 to-sky-500 text-ink-970 shadow-soft border-t border-white/20'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Me
          </button>
        </div>

        {/* Period & Refresh Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-950/90 border border-ink-800 shadow-inner">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  period === p
                    ? 'bg-ink-800 text-white shadow-sm border border-ink-700/80'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {p === '24h' ? t('analytics.hours_24') : p === '7d' ? t('analytics.days_7') : t('analytics.days_30')}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing || isUpdating}
            className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-800 text-ink-300 hover:text-white hover:border-ink-700 active:scale-90 flex items-center justify-center transition-all duration-150 disabled:opacity-50"
            title={t('analytics.refresh_tooltip')}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── CHUNK 1: Real-time Status & Live Pulse Metrics (4 Cards) ── */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 transition-opacity duration-300 ${isUpdating ? 'opacity-70' : 'opacity-100'}`}>
        {/* Real-time Pulse Card (Glowing Emerald Elevation - Reel 8 & 9) */}
        <div className="card p-6 rounded-2xl relative overflow-hidden group ring-1 ring-emerald-500/40 shadow-[0_0_28px_-4px_rgba(16,185,129,0.22),inset_0_1px_0_0_rgba(52,211,153,0.30)] bg-gradient-to-b from-emerald-950/40 via-ink-900 to-ink-950/95">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold tracking-wider text-emerald-400 uppercase">{t('analytics.live_pulse')}</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              {overview?.realtime_active || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-300/90">{t('analytics.users_active_now')}</span>
          </div>
          <p className="mt-2 text-2xs text-ink-400">{t('analytics.browsing_realtime')}</p>
        </div>

        {/* Total Views */}
        <div className="card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between text-ink-400 mb-3">
            <span className="text-2xs font-semibold text-ink-300 uppercase tracking-wider">{t('analytics.total_traffic')}</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {metrics.total_views?.toLocaleString() || 0}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-2xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('analytics.traffic_growth')}</span>
          </div>
        </div>

        {/* Total Confirmed Actions */}
        <div className="card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between text-ink-400 mb-3">
            <span className="text-2xs font-semibold text-ink-300 uppercase tracking-wider">{t('analytics.confirmed_actions')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {metrics.total_interactions?.toLocaleString() || 0}
          </div>
          <div className="mt-2 text-2xs text-ink-400">
            {t('analytics.confirmed_actions_sub')}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="card card-hover p-6 rounded-2xl">
          <div className="flex items-center justify-between text-ink-400 mb-3">
            <span className="text-2xs font-semibold text-ink-300 uppercase tracking-wider">{t('analytics.conversion_rate')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {metrics.conversion_rate || 0}%
          </div>
          <div className="mt-2 text-2xs text-ink-400">
            {t('analytics.avg_duration')}: <strong className="text-ink-200 font-semibold">{metrics.avg_session_duration || '0m'}</strong>
          </div>
        </div>
      </div>

      {/* ── CHUNK 2: Traffic Trends & Peak Hours Heatmap (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Trends Interactive Bar Stack */}
        <div className="card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-bold text-ink-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400" />
                  {t('analytics.daily_trend')}
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">{t('analytics.daily_trend_sub')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-2xs font-medium">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Dawaty
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Menu
                </span>
                <span className="flex items-center gap-1.5 text-violet-300">
                  <span className="w-2 h-2 rounded-full bg-violet-400" /> CV Maker
                </span>
                <span className="flex items-center gap-1.5 text-sky-300">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> QR Me
                </span>
              </div>
            </div>

            {/* Custom Interactive Bars with Smooth Height Spring Easing */}
            <div className="h-56 mt-2 pt-12 flex items-end gap-1.5 sm:gap-2 px-1 overflow-x-auto no-scrollbar w-full">
              {traffic.map((item, idx) => {
                const dawatyHeight = maxTraffic > 0 ? (item.dawaty_views / maxTraffic) * 100 : 0;
                const menuHeight = maxTraffic > 0 ? (item.menu_views / maxTraffic) * 100 : 0;
                const showLabel = period === '30d'
                  ? (idx % 5 === 0 || idx === traffic.length - 1)
                  : (period === '24h' ? idx % 3 === 0 : true);

                return (
                  <div key={idx} className="flex-1 min-w-[12px] sm:min-w-[16px] flex flex-col items-center gap-2 group relative">
                    {/* Tooltip with Spring Entrance (Reel 2: Tooltip never pops, springs) */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-ink-950/95 border border-ink-700/80 backdrop-blur-md text-white text-2xs rounded-xl p-2.5 shadow-2xl whitespace-nowrap z-30 scale-95 group-hover:scale-100 origin-bottom">
                      <div className="font-bold text-ink-100 mb-0.5">{item.date}</div>
                      <div>Total: <span className="font-bold text-white font-mono">{item.total_views}</span></div>
                      <div className="text-rose-400 font-medium">Dawaty: {item.dawaty_views}</div>
                      <div className="text-amber-400 font-medium">Menu: {item.menu_views}</div>
                      {item.cv_views > 0 && <div className="text-violet-400 font-medium">CV: {item.cv_views}</div>}
                      {item.qr_views > 0 && <div className="text-sky-400 font-medium">QR: {item.qr_views}</div>}
                    </div>

                    <div className="w-full h-36 flex flex-col justify-end rounded-lg overflow-hidden bg-ink-950/70 border border-ink-800/60 p-0.5">
                      <div
                        style={{ height: `${menuHeight}%` }}
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 hover:brightness-110 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-t-sm"
                      />
                      <div
                        style={{ height: `${dawatyHeight}%` }}
                        className="w-full bg-gradient-to-t from-rose-600 to-rose-500 hover:brightness-110 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    </div>
                    <span className="text-3xs font-mono font-medium text-ink-400 group-hover:text-white transition-colors whitespace-nowrap h-4 text-center">
                      {showLabel ? item.date : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-ink-800/80 flex items-center justify-between text-2xs text-ink-400">
            <span>{t('analytics.db_source_note')}</span>
            <span className="text-ink-200 font-semibold">{t('analytics.bounce_rate')}: {metrics.bounce_rate}</span>
          </div>
        </div>

        {/* Peak Hours Heatmap */}
        <div className="card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {t('analytics.peak_hours')}
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">{t('analytics.peak_hours_sub')}</p>
              </div>
              <Clock className="w-4 h-4 text-brand-400" />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{peakHours?.peak_period_summary || t('analytics.peak_period')}</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {(peakHours?.hours || []).filter((_: any, i: number) => i % 2 === 0).map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 text-2xs group">
                  <span className="w-10 text-ink-400 font-mono text-end">{h.hour}</span>
                  <div className="flex-1 h-3 rounded-full bg-ink-950 overflow-hidden border border-ink-800/80">
                    <div
                      style={{ width: `${(h.intensity / maxPeak) * 100}%` }}
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        h.is_peak ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-soft' : 'bg-brand-500/70'
                      }`}
                    />
                  </div>
                  <span className={`w-9 text-right font-mono tabular-nums ${h.is_peak ? 'text-amber-400 font-bold' : 'text-ink-400'}`}>
                    {h.intensity}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 pt-4 border-t border-ink-800/80 text-2xs text-ink-400">
            {t('analytics.peak_forecast_note')}
          </p>
        </div>
      </div>

      {/* ── CHUNK 3: Conversion Funnel & Leaderboards (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t('analytics.funnel_title')}
              </h3>
              <p className="text-xs text-ink-400 mt-0.5">{t('analytics.funnel_sub')}</p>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3 mt-4">
            {funnel.map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-ink-950/80 border border-ink-800/80 hover:border-ink-700/80 transition-colors">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-ink-100">
                    {idx + 1}. {step.stage}
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {step.count} ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-ink-900 overflow-hidden relative">
                  <div
                    style={{ width: `${step.percentage}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 via-rose-500 to-emerald-400 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                </div>
                {idx > 0 && (
                  <div className="mt-1.5 text-right text-3xs text-rose-400 font-mono font-semibold">
                    {t('analytics.dropoff')}: {step.dropoff}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Templates & Dishes Leaderboard */}
        <div className="card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  {t('analytics.leaderboard_title')}
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">{t('analytics.leaderboard_sub')}</p>
              </div>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>

            <div className="space-y-4">
              {/* Templates */}
              <div>
                <h4 className="text-2xs font-bold text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {t('analytics.popular_templates')}
                </h4>
                <div className="space-y-2">
                  {(topPerformers?.top_templates || []).slice(0, 3).map((tpl: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-ink-800/60 hover:bg-ink-850/60 transition-colors text-xs"
                    >
                      <span className="font-semibold text-ink-100">{tpl.name}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xs text-ink-400 font-mono">{tpl.views} {t('analytics.views')}</span>
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 text-2xs font-bold border border-rose-500/20">
                          {tpl.conversion} {t('analytics.rsvp')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dishes */}
              <div>
                <h4 className="text-2xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> {t('analytics.popular_dishes')}
                </h4>
                <div className="space-y-2">
                  {(topPerformers?.top_dishes || []).slice(0, 3).map((dish: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-ink-950/60 border border-ink-800/60 hover:bg-ink-850/60 transition-colors text-xs"
                    >
                      <div>
                        <span className="font-semibold text-ink-100">{dish.name}</span>
                        <span className="ml-2 rtl:mr-2 text-3xs text-ink-400">({dish.category})</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xs text-ink-400 font-mono">{dish.views} {t('analytics.views')}</span>
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 text-2xs font-bold border border-amber-500/20">
                          ⭐ {dish.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-ink-800/80 flex items-center justify-between text-2xs text-ink-400">
            <span>{t('analytics.devices_stat')}</span>
            <span className="text-emerald-400 font-semibold">{t('analytics.auto_synced')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
