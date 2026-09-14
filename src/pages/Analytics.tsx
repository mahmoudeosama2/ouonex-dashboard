import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Activity, Users, Flame, Eye, CheckCircle2, ShoppingBag,
  Smartphone, Monitor, RefreshCw, Heart, UtensilsCrossed, Calendar,
  TrendingUp, Clock, Award, Filter, FileText, QrCode
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/Layout';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { useLocale } from '@/context/LocaleContext';

export function Analytics() {
  const { t, locale } = useLocale();
  const [product, setProduct] = useState<'all' | 'dawaty' | 'digital_menu' | 'cv_maker' | 'qr_me'>('all');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [overview, setOverview] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [product, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh real-time counter every 20 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      api.analytics.overview(product, period).then((ov) => {
        setOverview((prev: any) => ({ ...prev, realtime_active: ov.realtime_active }));
      }).catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [product, period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('analytics.title')} subtitle={locale === 'ar' ? 'جاري التحميل...' : 'Loading metrics...'} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('analytics.title')} subtitle={locale === 'ar' ? 'تحليلات النظام' : 'System insights'} />
        <ErrorState onRetry={() => loadData()} />
      </div>
    );
  }

  const metrics = overview.metrics || {};
  const maxTraffic = Math.max(...traffic.map(t => t.total_views || 1), 10);
  const maxPeak = Math.max(...(peakHours?.hours || []).map((h: any) => h.intensity || 1), 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.description')}
        badge={
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('analytics.live_sync')}
          </span>
        }
      />

      {/* Control Bar: Filters & Real-time banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm">
        {/* Product Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-ink-950 border border-ink-800">
          <button
            onClick={() => setProduct('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              product === 'all'
                ? 'bg-brand-600 text-white shadow-soft'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {t('analytics.all_platforms')}
          </button>
          <button
            onClick={() => setProduct('dawaty')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              product === 'dawaty'
                ? 'bg-rose-500 text-white shadow-soft'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Dawaty
          </button>
          <button
            onClick={() => setProduct('digital_menu')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              product === 'digital_menu'
                ? 'bg-amber-500 text-ink-950 shadow-soft'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Digital Menu
          </button>
          <button
            onClick={() => setProduct('cv_maker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              product === 'cv_maker'
                ? 'bg-violet-600 text-white shadow-soft'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            CV Maker
          </button>
          <button
            onClick={() => setProduct('qr_me')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              product === 'qr_me'
                ? 'bg-sky-500 text-ink-950 shadow-soft'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Me
          </button>
        </div>

        {/* Period & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-950 border border-ink-800">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  period === p ? 'bg-ink-800 text-ink-50' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {p === '24h' ? t('analytics.hours_24') : p === '7d' ? t('analytics.days_7') : t('analytics.days_30')}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-ink-950 border border-ink-800 text-ink-300 hover:text-white transition disabled:opacity-50"
            title={t('analytics.refresh_tooltip')}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Status Card Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Real-time Pulse Card */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-ink-900 to-ink-950 border border-emerald-500/30 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold tracking-wider text-emerald-400 uppercase">{t('analytics.live_pulse')}</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{overview.realtime_active}</span>
            <span className="text-xs text-emerald-300/80">{t('analytics.users_active_now')}</span>
          </div>
          <p className="mt-1 text-2xs text-ink-400">{t('analytics.browsing_realtime')}</p>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-2xs font-semibold uppercase tracking-wider">{t('analytics.total_traffic')}</span>
            <Eye className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {metrics.total_views?.toLocaleString() || 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-2xs text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{t('analytics.traffic_growth')}</span>
          </div>
        </div>

        {/* Total Interactions / RSVPs & Orders */}
        <div className="p-5 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-2xs font-semibold uppercase tracking-wider">{t('analytics.confirmed_actions')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {metrics.total_interactions || 0}
          </div>
          <div className="mt-1 text-2xs text-ink-400">
            {t('analytics.confirmed_actions_sub')}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-2xs font-semibold uppercase tracking-wider">{t('analytics.conversion_rate')}</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white font-mono">
            {metrics.conversion_rate}%
          </div>
          <div className="mt-1 text-2xs text-ink-400">
            {t('analytics.avg_duration')}: <strong className="text-ink-200">{metrics.avg_session_duration}</strong>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Traffic Trends & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Trends Chart */}
        <div className="lg:col-span-2 min-w-0 overflow-hidden p-6 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-50">{t('analytics.daily_trend')}</h3>
                <p className="text-xs text-ink-400">{t('analytics.daily_trend_sub')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-2xs font-medium">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Dawaty
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Digital Menu
                </span>
                <span className="flex items-center gap-1 text-violet-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> CV Maker
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> QR Me
                </span>
              </div>
            </div>

            {/* Custom Interactive SVG Bar/Area Chart */}
            <div className="h-48 mt-6 flex items-end gap-1 sm:gap-1.5 px-1 overflow-x-auto no-scrollbar w-full">
              {traffic.map((item, idx) => {
                const dawatyHeight = maxTraffic > 0 ? (item.dawaty_views / maxTraffic) * 100 : 0;
                const menuHeight = maxTraffic > 0 ? (item.menu_views / maxTraffic) * 100 : 0;
                const showLabel = period === '30d'
                  ? (idx % 5 === 0 || idx === traffic.length - 1)
                  : (period === '24h' ? idx % 3 === 0 : true);

                return (
                  <div key={idx} className="flex-1 min-w-[10px] sm:min-w-[14px] flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-ink-950 border border-ink-700 text-white text-2xs rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap z-30">
                      <div className="font-semibold text-ink-200">{item.date}</div>
                      <div>Total: <span className="font-bold text-white">{item.total_views}</span></div>
                      <div className="text-rose-400">Dawaty: {item.dawaty_views}</div>
                      <div className="text-amber-400">Menu: {item.menu_views}</div>
                    </div>

                    <div className="w-full h-36 flex flex-col justify-end rounded-lg overflow-hidden bg-ink-950/60 border border-ink-800/40">
                      <div
                        style={{ height: `${menuHeight}%` }}
                        className="w-full bg-amber-500/80 hover:bg-amber-400 transition-all rounded-t-sm"
                      />
                      <div
                        style={{ height: `${dawatyHeight}%` }}
                        className="w-full bg-rose-500/80 hover:bg-rose-400 transition-all"
                      />
                    </div>
                    <span className="text-3xs text-ink-400 group-hover:text-white transition whitespace-nowrap h-4 text-center">
                      {showLabel ? item.date : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-ink-800/80 flex items-center justify-between text-2xs text-ink-400">
            <span>{t('analytics.db_source_note')}</span>
            <span className="text-ink-300">{t('analytics.bounce_rate')}: {metrics.bounce_rate}</span>
          </div>
        </div>

        {/* Peak Hours Heatmap */}
        <div className="p-6 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-50">{t('analytics.peak_hours')}</h3>
                <p className="text-xs text-ink-400">{t('analytics.peak_hours_sub')}</p>
              </div>
              <Clock className="w-4 h-4 text-brand-400" />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
              {peakHours?.peak_period_summary || t('analytics.peak_period')}
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
              {(peakHours?.hours || []).filter((_: any, i: number) => i % 2 === 0).map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-2xs">
                  <span className="w-10 text-ink-400 font-mono">{h.hour}</span>
                  <div className="flex-1 h-3 rounded-full bg-ink-950 overflow-hidden border border-ink-800/60">
                    <div
                      style={{ width: `${(h.intensity / maxPeak) * 100}%` }}
                      className={`h-full rounded-full transition-all ${
                        h.is_peak ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-brand-500/70'
                      }`}
                    />
                  </div>
                  <span className={`w-8 text-right font-mono ${h.is_peak ? 'text-amber-400 font-bold' : 'text-ink-400'}`}>
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

      {/* Conversion Funnel & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="p-6 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-ink-50">{t('analytics.funnel_title')}</h3>
              <p className="text-xs text-ink-400">{t('analytics.funnel_sub')}</p>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3 mt-5">
            {funnel.map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-ink-950/80 border border-ink-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-ink-200">
                    {idx + 1}. {step.stage}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {step.count} ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-ink-900 overflow-hidden">
                  <div
                    style={{ width: `${step.percentage}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 via-rose-500 to-emerald-400 rounded-full"
                  />
                </div>
                {idx > 0 && (
                  <div className="mt-1 text-right text-3xs text-rose-400 font-mono">
                    {t('analytics.dropoff')}: {step.dropoff}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Templates & Dishes Leaderboard */}
        <div className="p-6 rounded-2xl bg-ink-900/60 border border-ink-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-50">{t('analytics.leaderboard_title')}</h3>
                <p className="text-xs text-ink-400">{t('analytics.leaderboard_sub')}</p>
              </div>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>

            <div className="space-y-4">
              {/* Templates */}
              <div>
                <h4 className="text-2xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {t('analytics.popular_templates')}
                </h4>
                <div className="space-y-2">
                  {(topPerformers?.top_templates || []).slice(0, 3).map((tpl: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-ink-950/60 border border-ink-800/60 text-xs">
                      <span className="font-medium text-ink-200">{tpl.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xs text-ink-400 font-mono">{tpl.views} {t('analytics.views')}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-2xs font-semibold">
                          {tpl.conversion} {t('analytics.rsvp')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dishes */}
              <div>
                <h4 className="text-2xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> {t('analytics.popular_dishes')}
                </h4>
                <div className="space-y-2">
                  {(topPerformers?.top_dishes || []).slice(0, 3).map((dish: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-ink-950/60 border border-ink-800/60 text-xs">
                      <div>
                        <span className="font-medium text-ink-200">{dish.name}</span>
                        <span className="ml-2 text-3xs text-ink-400">({dish.category})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xs text-ink-400 font-mono">{dish.views} {t('analytics.views')}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-2xs font-semibold">
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
            <span className="text-emerald-400 font-medium">{t('analytics.auto_synced')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
