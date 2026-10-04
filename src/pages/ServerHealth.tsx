import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Cpu, HardDrive, Database, RefreshCw, Zap,
  CheckCircle2, AlertTriangle, ShieldAlert, Clock, ArrowUpRight,
  Trash2, Globe, Activity
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ServerMetrics } from '@/lib/types';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';

export function ServerHealth() {
  const { addToast } = useToast();
  const { isRTL } = useLocale();
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.system.serverMetrics();
      setMetrics(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (isManual) {
        addToast({ type: 'error', message: 'Failed to fetch server metrics: ' + (err.message || 'Network error') });
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMetrics(false);
  }, [fetchMetrics]);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchMetrics(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchMetrics]);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await api.system.clearCache();
      addToast({ type: 'success', message: res.message || 'Server caches cleared successfully!' });
      await fetchMetrics(false);
    } catch (err: any) {
      addToast({ type: 'error', message: 'Failed to clear cache: ' + (err.message || 'Error') });
    } finally {
      setClearingCache(false);
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 85) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (percent >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 85) return 'bg-rose-500';
    if (percent >= 65) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading && !metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-ink-800 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-ink-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-ink-900 border border-ink-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-ink-900 border border-ink-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const stressScore = metrics?.stress_score ?? 15;
  const stressLevel = metrics?.stress_level ?? 'optimal';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-50">
                {isRTL ? 'حالة الخادم والموارد الحية' : 'Server Health & Live Telemetry'}
              </h1>
              <p className="text-xs text-ink-400">
                {isRTL ? 'مراقبة فورية لأداء المعالج، الذاكرة، وقواعد البيانات لشبكة أوونكس' : 'Real-time CPU, RAM, Disk, and Database telemetry across Ouonex host'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 border border-ink-800 text-xs text-ink-300">
            <Clock className="w-3.5 h-3.5 text-ink-400" />
            <span>{isRTL ? 'تحديث تلقائي:' : 'Auto:'}</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label={isRTL ? 'معدل التحديث التلقائي' : 'Auto refresh interval'}
              className="bg-transparent border-0 text-ink-100 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={0}>{isRTL ? 'إيقاف' : 'Off'}</option>
            </select>
          </div>

          {/* Clear Cache Button */}
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800/80 hover:bg-ink-700/80 text-ink-200 border border-ink-700 text-xs font-medium transition disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 ${clearingCache ? 'animate-spin' : ''}`} />
            <span>{clearingCache ? (isRTL ? 'جارٍ المسح...' : 'Clearing...') : (isRTL ? 'تفريغ الكاش' : 'Clear Cache')}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? (isRTL ? 'تحديث...' : 'Refreshing...') : (isRTL ? 'تحديث الآن' : 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Alerts Bar if any */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                alert.level === 'critical'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">{isRTL ? alert.message_ar : alert.message_en}</span>
              </div>
              <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink-950/40">
                {alert.level}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hero Stress Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-ink-950 border border-ink-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                stressLevel === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : stressLevel === 'moderate'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${stressLevel === 'critical' ? 'bg-rose-400' : stressLevel === 'moderate' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isRTL ? metrics?.stress_status_ar : metrics?.stress_status_en}
              </span>
              <span className="text-2xs text-ink-400">
                {isRTL ? 'آخر فحص:' : 'Last sync:'} {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-2xl font-black text-ink-50">
              {isRTL ? 'مؤشر استقرار الخادم الإجمالي' : 'Overall Host Stress Index'}
            </h2>
            <p className="text-xs text-ink-400 max-w-xl">
              {isRTL
                ? 'خوارزمية قياس الضغط التراكمي تجمع بين استهلاك الذاكرة العشوائية RAM ومعدل معالجة الأنوية ومساحة القرص لضمان استقرار كامل تطبيقات OUONEX.'
                : 'Weighted health algorithm monitoring CPU, RAM, and Disk to guarantee optimal uptime across all customer apps.'}
            </p>

            {/* Quick Specs Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-ink-800/60 border border-ink-700/60 text-2xs text-ink-300">
                OS: <span className="font-semibold text-ink-100">{metrics?.system.os_name || 'Linux'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-ink-800/60 border border-ink-700/60 text-2xs text-ink-300">
                PHP: <span className="font-semibold text-ink-100">{metrics?.system.php_version || '8.2'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-ink-800/60 border border-ink-700/60 text-2xs text-ink-300">
                Laravel: <span className="font-semibold text-ink-100">v{metrics?.system.laravel_version}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-ink-800/60 border border-ink-700/60 text-2xs text-ink-300">
                Uptime: <span className="font-semibold text-emerald-400">{metrics?.system.uptime_human}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-ink-800/60 border border-ink-700/60 text-2xs text-ink-300">
                IP: <span className="font-semibold text-ink-100">{metrics?.system.server_ip}</span>
              </span>
            </div>
          </div>

          {/* Stress Score Gauge Display */}
          <div className="flex items-center gap-4 bg-ink-950/60 border border-ink-800/80 p-5 rounded-2xl shrink-0">
            <div className="text-center">
              <div className="text-3xl font-black text-ink-50 flex items-center justify-center gap-1">
                {stressScore}
                <span className="text-sm font-normal text-ink-400">/ 100</span>
              </div>
              <p className="text-2xs text-ink-400 mt-0.5">{isRTL ? 'درجة الضغط الحالية' : 'Stress Score'}</p>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-ink-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={stressLevel === 'critical' ? 'text-rose-500' : stressLevel === 'moderate' ? 'text-amber-500' : 'text-emerald-500'}
                  strokeDasharray={`${Math.min(100, Math.max(5, stressScore))}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Zap className={`w-5 h-5 absolute ${stressLevel === 'critical' ? 'text-rose-400' : stressLevel === 'moderate' ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-ink-700 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-200">CPU Usage</p>
                <p className="text-2xs text-ink-400">{metrics?.cpu.cores} Cores</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusColor(metrics?.cpu.usage_percent ?? 0)}`}>
              {metrics?.cpu.usage_percent}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-ink-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.cpu.usage_percent ?? 0)}`}
                style={{ width: `${Math.min(100, metrics?.cpu.usage_percent ?? 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-2xs text-ink-400 pt-1">
              <span>Load 1m: <b className="text-ink-200">{metrics?.cpu.load_1m}</b></span>
              <span>5m: <b className="text-ink-200">{metrics?.cpu.load_5m}</b></span>
              <span>15m: <b className="text-ink-200">{metrics?.cpu.load_15m}</b></span>
            </div>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-ink-700 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-200">RAM Memory</p>
                <p className="text-2xs text-ink-400">{metrics?.memory.used_formatted} / {metrics?.memory.total_formatted}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusColor(metrics?.memory.usage_percent ?? 0)}`}>
              {metrics?.memory.usage_percent}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-ink-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.memory.usage_percent ?? 0)}`}
                style={{ width: `${Math.min(100, metrics?.memory.usage_percent ?? 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-2xs text-ink-400 pt-1">
              <span>Free: <b className="text-ink-200">{metrics?.memory.free_formatted}</b></span>
              <span>PHP Peak: <b className="text-ink-200">{metrics?.memory.php_peak_formatted}</b></span>
            </div>
          </div>
        </div>

        {/* Disk Storage */}
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-ink-700 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-200">Disk Storage</p>
                <p className="text-2xs text-ink-400">{metrics?.storage.used_formatted} / {metrics?.storage.total_formatted}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusColor(metrics?.storage.usage_percent ?? 0)}`}>
              {metrics?.storage.usage_percent}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-ink-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.storage.usage_percent ?? 0)}`}
                style={{ width: `${Math.min(100, metrics?.storage.usage_percent ?? 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-2xs text-ink-400 pt-1">
              <span>Free: <b className="text-ink-200">{metrics?.storage.free_formatted}</b></span>
              <span>Uploads: <b className="text-ink-200">{metrics?.storage.uploads_formatted}</b></span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-ink-700 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-200">Database Engine</p>
                <p className="text-2xs text-ink-400">{metrics?.database.driver.toUpperCase()}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {metrics?.database.ping_ms} ms
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-2xs text-ink-400">
              <span>DB Size:</span>
              <span className="font-semibold text-ink-100">{metrics?.database.size_formatted}</span>
            </div>
            <div className="flex items-center justify-between text-2xs text-ink-400">
              <span>Connection Status:</span>
              <span className="font-semibold text-emerald-400">{metrics?.database.connected ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Connectivity Table */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-ink-100">
              {isRTL ? 'حالة اتصال واجهات التطبيقات والخدمات' : 'Ecosystem Services & Nodes'}
            </h3>
          </div>
          <span className="text-2xs text-ink-400">
            {metrics?.services.length || 0} {isRTL ? 'خدمات نشطة' : 'services monitored'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-800/80 bg-ink-950/40 text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                <th className="px-5 py-3">{isRTL ? 'الخدمة' : 'Service Name'}</th>
                <th className="px-5 py-3">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3">{isRTL ? 'زمن الاستجابة' : 'Latency'}</th>
                <th className="px-5 py-3">{isRTL ? 'آخر فحص' : 'Last Checked'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/60 text-xs">
              {metrics?.services.map((svc) => (
                <tr key={svc.id} className="hover:bg-ink-850/40 transition">
                  <td className="px-5 py-3.5 font-medium text-ink-100">
                    <div>
                      <p>{isRTL && svc.name_ar ? svc.name_ar : svc.name}</p>
                      <p className="text-2xs text-ink-500 font-mono">{svc.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {svc.reachable ? (isRTL ? 'متصل وجاهز' : 'Operational') : (isRTL ? 'غير متاح' : 'Down')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-ink-300">
                    <span className="font-semibold text-ink-100">{svc.latency_ms}</span> ms
                  </td>
                  <td className="px-5 py-3.5 text-ink-400">
                    {new Date(svc.last_sync).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
