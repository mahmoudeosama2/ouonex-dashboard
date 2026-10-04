import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, Bug, Smartphone, Globe, AlertTriangle, CheckCircle2,
  Clock, Search, Filter, Copy, Check, ChevronRight, X, ArrowUpRight,
  TrendingDown, RefreshCw, Layers, Terminal
} from 'lucide-react';
import type { CrashlyticsError } from '@/lib/types';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';

// Production simulated seed telemetry for all 4 ecosystem apps
const SEED_ERRORS: CrashlyticsError[] = [
  {
    id: 'err-dm-01',
    app: 'digital_menu',
    title: 'DioException [bad response]: 404 Not Found on public menu route',
    exception_type: 'DioException',
    message: 'Http status error [404] when fetching /api/v1/public/menu/invalid-slug',
    file: 'lib/core/network/dio_client.dart',
    line: 48,
    occurrences: 14,
    affected_users: 6,
    platform: 'android',
    os_version: 'Android 14 (API 34)',
    app_version: '1.2.0 (14)',
    device_model: 'Samsung Galaxy S23 Ultra',
    severity: 'high',
    status: 'open',
    first_seen: '2026-10-02T14:32:00Z',
    last_seen: '2026-10-04T02:15:00Z',
    stack_trace: `DioException [bad response]: This exception was thrown because the response has a status code of 404.
#0      DioMixin.fetch (package:dio/src/dio_mixin.dart:584)
#1      DioClient.get (package:digital_menu/core/network/dio_client.dart:48)
#2      PublicMenuRemoteDataSource.getMenu (package:digital_menu/features/menu/data/datasources/public_menu_datasource.dart:32)
#3      _AIMenuReviewScreenState.initState (package:digital_menu/features/menu_management/presentation/pages/ai_menu_review_screen.dart:45)`,
    breadcrumbs: [
      { time: '02:14:55', action: 'User clicked scan menu QR code', category: 'navigation' },
      { time: '02:14:58', action: 'Camera opened and frame detected', category: 'hardware' },
      { time: '02:15:00', action: 'HTTP GET /api/v1/public/menu/unknown -> 404', category: 'network' },
    ]
  },
  {
    id: 'err-dw-02',
    app: 'dawaty',
    title: 'RenderFlex overflowed by 14.5 pixels on the bottom in EventDetailsCard',
    exception_type: 'FlutterError',
    message: 'A RenderFlex overflowed by 14.5 pixels on the bottom due to expanded Arabic guest list.',
    file: 'lib/features/invitations/presentation/widgets/event_card.dart',
    line: 122,
    occurrences: 43,
    affected_users: 21,
    platform: 'ios',
    os_version: 'iOS 17.5',
    app_version: '2.1.4 (28)',
    device_model: 'iPhone 15 Pro Max',
    severity: 'warning',
    status: 'investigating',
    first_seen: '2026-09-29T10:11:00Z',
    last_seen: '2026-10-03T21:40:00Z',
    stack_trace: `══╡ EXCEPTION CAUGHT BY RENDERING LIBRARY ╞═════════════════════════════════════════════════════════
The following assertion was thrown during layout:
A RenderFlex overflowed by 14.5 pixels on the bottom.
The relevant error-causing widget was:
  Column lib/features/invitations/presentation/widgets/event_card.dart:122
The overflowing RenderFlex has an orientation of Axis.vertical.`,
    breadcrumbs: [
      { time: '21:39:40', action: 'App launched from background', category: 'lifecycle' },
      { time: '21:39:45', action: 'Navigated to Event Details Page', category: 'navigation' },
      { time: '21:39:50', action: 'Keyboard popped up for RSVP entry', category: 'ui' },
    ]
  },
  {
    id: 'err-cv-03',
    app: 'cv_maker',
    title: 'PdfRasterException: Unsupported custom TTF font glyph during export',
    exception_type: 'PdfRasterException',
    message: 'Cairo-Bold glyph subset embedding failed for specialized diacritic Arabic mark.',
    file: 'lib/core/services/pdf_builder.dart',
    line: 89,
    occurrences: 5,
    affected_users: 3,
    platform: 'android',
    os_version: 'Android 13',
    app_version: '1.0.8 (12)',
    device_model: 'Xiaomi Redmi Note 12',
    severity: 'high',
    status: 'open',
    first_seen: '2026-10-01T18:22:00Z',
    last_seen: '2026-10-03T16:10:00Z',
    stack_trace: `PdfRasterException: Unable to rasterize Cairo glyph index 0x0651
#0      PdfFont.embed (package:pdf/src/pdf/font.dart:140)
#1      PdfDocument.save (package:pdf/src/pdf/document.dart:210)
#2      PdfBuilder.exportAsBytes (package:cvmaker/core/services/pdf_builder.dart:89)`,
    breadcrumbs: [
      { time: '16:09:30', action: 'Selected Modern Executive Template', category: 'ui' },
      { time: '16:09:50', action: 'User typed Arabic name with tashkeel', category: 'input' },
      { time: '16:10:00', action: 'Clicked Export PDF button', category: 'action' },
    ]
  },
  {
    id: 'err-qr-04',
    app: 'qr_me',
    title: 'FormatException: Unexpected character (at character 1) <!DOCTYPE html>',
    exception_type: 'FormatException',
    message: 'Expected JSON payload from server but received HTML Cloudflare challenge page.',
    file: 'lib/core/api/qr_client.dart',
    line: 65,
    occurrences: 8,
    affected_users: 4,
    platform: 'web',
    os_version: 'Chrome 128.0 / Windows',
    app_version: '1.0.2',
    device_model: 'Desktop Chrome Browser',
    severity: 'fatal',
    status: 'resolved',
    first_seen: '2026-09-28T08:00:00Z',
    last_seen: '2026-09-30T11:20:00Z',
    stack_trace: `FormatException: Unexpected character (at character 1)
<!DOCTYPE html>
#0      _ChunkedJsonParser.fail (dart:convert-patch/convert_patch.dart:1405)
#1      _ChunkedJsonParser.execute (dart:convert-patch/convert_patch.dart:1230)
#2      JsonDecoder.convert (dart:convert/json.dart:612)
#3      QrClient.fetchQrDetails (package:qrme/core/api/qr_client.dart:65)`,
    breadcrumbs: [
      { time: '11:19:50', action: 'User scanned dynamic barcode', category: 'scan' },
      { time: '11:20:00', action: 'Redirected to custom domain', category: 'network' },
    ]
  },
  {
    id: 'err-dm-05',
    app: 'digital_menu',
    title: 'SocketException: OS Error: Connection timed out, errno = 110',
    exception_type: 'SocketException',
    message: 'Failed host lookup or connection dropped on high latency cellular network.',
    file: 'lib/core/network/dio_client.dart',
    line: 35,
    occurrences: 19,
    affected_users: 11,
    platform: 'android',
    os_version: 'Android 12',
    app_version: '1.2.0 (14)',
    device_model: 'Oppo Reno 6',
    severity: 'warning',
    status: 'resolved',
    first_seen: '2026-10-02T12:00:00Z',
    last_seen: '2026-10-03T19:30:00Z',
    stack_trace: `SocketException: OS Error: Connection timed out, errno = 110, address = api.ouonex.com, port = 443
#0      _NativeSocket.startConnect (dart:io-patch/socket_patch.dart:738)
#1      _RawSocket.startConnect (dart:io-patch/socket_patch.dart:1024)
#2      DioClient._init (package:digital_menu/core/network/dio_client.dart:35)`,
    breadcrumbs: [
      { time: '19:29:40', action: 'User switched from WiFi to weak 3G', category: 'system' },
      { time: '19:30:00', action: 'Auth session refresh timed out', category: 'network' },
    ]
  }
];

export function CrashlyticsErrors() {
  const { addToast } = useToast();
  const { isRTL } = useLocale();

  const [errorsList, setErrorsList] = useState<CrashlyticsError[]>(SEED_ERRORS);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalError, setActiveModalError] = useState<CrashlyticsError | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredErrors = useMemo(() => {
    return errorsList.filter((item) => {
      if (selectedApp !== 'all' && item.app !== selectedApp) return false;
      if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMsg = item.message.toLowerCase().includes(q);
        const matchesFile = (item.file || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesFile) return false;
      }
      return true;
    });
  }, [errorsList, selectedApp, selectedSeverity, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = errorsList.length;
    const fatalCount = errorsList.filter(e => e.severity === 'fatal' || e.severity === 'high').length;
    const openCount = errorsList.filter(e => e.status === 'open').length;
    const totalOccurrences = errorsList.reduce((acc, curr) => acc + curr.occurrences, 0);
    const totalUsers = errorsList.reduce((acc, curr) => acc + curr.affected_users, 0);
    return { total, fatalCount, openCount, totalOccurrences, totalUsers };
  }, [errorsList]);

  const handleResolve = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorsList(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'resolved' ? 'open' : 'resolved';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
    if (activeModalError && activeModalError.id === id) {
      setActiveModalError(prev => prev ? { ...prev, status: prev.status === 'resolved' ? 'open' : 'resolved' } : null);
    }
    addToast({ type: 'success', message: 'Error status updated successfully!' });
  };

  const copyStackTrace = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({ type: 'info', message: 'Stack trace copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev: CrashlyticsError['severity']) => {
    switch (sev) {
      case 'fatal':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">FATAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">INFO</span>;
    }
  };

  const getStatusBadge = (st: CrashlyticsError['status']) => {
    switch (st) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            {isRTL ? 'محلول' : 'Resolved'}
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3" />
            {isRTL ? 'قيد الفحص' : 'Investigating'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {isRTL ? 'مفتوح' : 'Open'}
          </span>
        );
    }
  };

  const getAppLabel = (app: string) => {
    switch (app) {
      case 'digital_menu': return { name: 'Digital Menu', ar: 'المنيو الرقمي', color: 'from-orange-500 to-amber-600' };
      case 'dawaty': return { name: 'Dawaty', ar: 'دعواتي', color: 'from-pink-500 to-rose-600' };
      case 'cv_maker': return { name: 'CV Maker', ar: 'صانع السيرة', color: 'from-blue-500 to-indigo-600' };
      case 'qr_me': return { name: 'QR Me', ar: 'كيو آر مي', color: 'from-emerald-500 to-teal-600' };
      default: return { name: app, ar: app, color: 'from-brand-500 to-brand-700' };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-50">
              {isRTL ? 'مركز مراقبة الأخطاء و Crashlytics' : 'Crashlytics & Error Tracking Hub'}
            </h1>
            <p className="text-xs text-ink-400">
              {isRTL
                ? 'تتبع فوري لانهيارات التطبيقات واستثناءات الشبكة قبل إطلاق الحملات الإعلانية'
                : 'Monitor exceptions, stack traces, and crash-free user sessions across all 4 production apps'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            99.8% {isRTL ? 'جلسات خالية من الأعطال' : 'Crash-free rate'}
          </span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 shadow-sm">
          <p className="text-2xs text-ink-400">{isRTL ? 'إجمالي الاستثناءات' : 'Total Issues'}</p>
          <p className="text-2xl font-black text-ink-50 mt-1">{stats.total}</p>
          <p className="text-2xs text-ink-500 mt-1">{stats.openCount} {isRTL ? 'مشكلة مفتوحة' : 'unresolved'}</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 shadow-sm">
          <p className="text-2xs text-ink-400">{isRTL ? 'حالات حرجة / حوادث' : 'Fatal / High'}</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{stats.fatalCount}</p>
          <p className="text-2xs text-rose-400/80 mt-1">{isRTL ? 'تتطلب انتباه فوري' : 'Requires immediate fix'}</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 shadow-sm">
          <p className="text-2xs text-ink-400">{isRTL ? 'مرات التكرار الكلية' : 'Total Occurrences'}</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.totalOccurrences}</p>
          <p className="text-2xs text-ink-500 mt-1">{isRTL ? 'خلال الـ 7 أيام الأخيرة' : 'Last 7 days'}</p>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-4 shadow-sm">
          <p className="text-2xs text-ink-400">{isRTL ? 'المستخدمين المتأثرين' : 'Impacted Users'}</p>
          <p className="text-2xl font-black text-brand-400 mt-1">{stats.totalUsers}</p>
          <p className="text-2xs text-ink-500 mt-1">{isRTL ? 'عبر جميع المنصات' : 'Across all platforms'}</p>
        </div>
      </div>

      {/* Filter and App Selector Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-ink-900 border border-ink-800 rounded-2xl p-3">
        {/* App Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'all', label: isRTL ? 'الكل' : 'All Apps' },
            { id: 'digital_menu', label: isRTL ? 'المنيو' : 'Digital Menu' },
            { id: 'dawaty', label: isRTL ? 'دعواتي' : 'Dawaty' },
            { id: 'cv_maker', label: isRTL ? 'السيرة' : 'CV Maker' },
            { id: 'qr_me', label: isRTL ? 'كيو آر' : 'QR Me' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedApp(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                selectedApp === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder={isRTL ? 'بحث في الأخطاء...' : 'Search errors...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink-950/60 border border-ink-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink-100 placeholder-ink-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            aria-label={isRTL ? 'تصفية حسب الخطورة' : 'Filter by severity'}
            className="bg-ink-950/60 border border-ink-800 rounded-xl px-2.5 py-1.5 text-xs text-ink-300 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="all">{isRTL ? 'كل الدرجات' : 'All Severities'}</option>
            <option value="fatal">Fatal</option>
            <option value="high">High</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label={isRTL ? 'تصفية حسب الحالة' : 'Filter by status'}
            className="bg-ink-950/60 border border-ink-800 rounded-xl px-2.5 py-1.5 text-xs text-ink-300 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="all">{isRTL ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="open">{isRTL ? 'مفتوح' : 'Open'}</option>
            <option value="investigating">{isRTL ? 'قيد الفحص' : 'Investigating'}</option>
            <option value="resolved">{isRTL ? 'محلول' : 'Resolved'}</option>
          </select>
        </div>
      </div>

      {/* Errors Table */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-800/80 bg-ink-950/40 text-2xs font-semibold text-ink-400 uppercase tracking-wider">
                <th className="px-5 py-3">{isRTL ? 'التطبيق والخطأ' : 'App & Error Issue'}</th>
                <th className="px-5 py-3">{isRTL ? 'الخطورة' : 'Severity'}</th>
                <th className="px-5 py-3">{isRTL ? 'المنصة' : 'Platform & OS'}</th>
                <th className="px-5 py-3">{isRTL ? 'التكرار / المستخدمين' : 'Events / Users'}</th>
                <th className="px-5 py-3">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3 text-right">{isRTL ? 'الإجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/60 text-xs">
              {filteredErrors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
                    <p className="font-semibold text-ink-200">{isRTL ? 'لا توجد أخطاء مطابقة' : 'No errors found'}</p>
                    <p className="text-2xs text-ink-500 mt-1">{isRTL ? 'كل الأنظمة تعمل بكفاءة تامة' : 'Everything is healthy or filters excluded all issues.'}</p>
                  </td>
                </tr>
              ) : (
                filteredErrors.map((err) => {
                  const appMeta = getAppLabel(err.app);
                  return (
                    <tr
                      key={err.id}
                      onClick={() => setActiveModalError(err)}
                      className="hover:bg-ink-850/50 transition cursor-pointer group"
                    >
                      {/* App & Issue Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${appMeta.color} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                            <Bug className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 max-w-md">
                            <div className="flex items-center gap-2">
                              <span className="text-2xs font-bold text-ink-400">{isRTL ? appMeta.ar : appMeta.name}</span>
                              <span className="text-2xs text-ink-500 font-mono">v{err.app_version}</span>
                            </div>
                            <p className="text-xs font-bold text-ink-100 truncate group-hover:text-brand-300 transition">
                              {err.title}
                            </p>
                            <p className="text-2xs text-ink-400 font-mono truncate mt-0.5">
                              {err.file}:{err.line}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-5 py-4">
                        {getSeverityBadge(err.severity)}
                      </td>

                      {/* Platform */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {err.platform === 'ios' ? <Smartphone className="w-3.5 h-3.5 text-ink-300" /> : err.platform === 'android' ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                          <span className="text-xs text-ink-200">{err.os_version}</span>
                        </div>
                      </td>

                      {/* Events / Users */}
                      <td className="px-5 py-4 font-mono">
                        <span className="font-bold text-ink-100">{err.occurrences}</span>
                        <span className="text-2xs text-ink-500"> / {err.affected_users} users</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(err.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleResolve(err.id)}
                          className={`px-3 py-1 rounded-lg text-2xs font-bold transition ${
                            err.status === 'resolved'
                              ? 'bg-ink-800 text-ink-400 hover:bg-ink-700'
                              : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                          }`}
                        >
                          {err.status === 'resolved' ? (isRTL ? 'إعادة فتح' : 'Reopen') : (isRTL ? 'تعيين كمحلول' : 'Resolve')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Inspector Drawer for Error Details */}
      {activeModalError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-970/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-ink-900 border border-ink-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-ink-800 flex items-center justify-between bg-ink-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-100">{activeModalError.exception_type}</h3>
                  <p className="text-2xs text-ink-400 font-mono">{activeModalError.file}:{activeModalError.line}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolve(activeModalError.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeModalError.status === 'resolved'
                      ? 'bg-ink-800 text-ink-400 hover:bg-ink-700'
                      : 'bg-emerald-500 text-white hover:bg-emerald-400'
                  }`}
                >
                  {activeModalError.status === 'resolved' ? (isRTL ? 'إعادة فتح' : 'Reopen') : (isRTL ? 'تم الحل ✓' : 'Mark as Resolved')}
                </button>
                <button
                  onClick={() => setActiveModalError(null)}
                  className="w-8 h-8 rounded-xl bg-ink-800 hover:bg-ink-700 flex items-center justify-center text-ink-400 hover:text-ink-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Meta Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-ink-950/60 border border-ink-800/80 p-3.5 rounded-2xl text-xs">
                <div>
                  <p className="text-2xs text-ink-500">{isRTL ? 'التطبيق:' : 'App:'}</p>
                  <p className="font-semibold text-ink-200 mt-0.5">{getAppLabel(activeModalError.app).name}</p>
                </div>
                <div>
                  <p className="text-2xs text-ink-500">{isRTL ? 'الجهاز / النظام:' : 'Device / OS:'}</p>
                  <p className="font-semibold text-ink-200 mt-0.5">{activeModalError.device_model || activeModalError.os_version}</p>
                </div>
                <div>
                  <p className="text-2xs text-ink-500">{isRTL ? 'تكرر:' : 'Occurrences:'}</p>
                  <p className="font-semibold text-ink-200 mt-0.5">{activeModalError.occurrences} events</p>
                </div>
                <div>
                  <p className="text-2xs text-ink-500">{isRTL ? 'آخر ظهور:' : 'Last Seen:'}</p>
                  <p className="font-semibold text-ink-200 mt-0.5">{new Date(activeModalError.last_seen).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Error Message Box */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-ink-200">{isRTL ? 'رسالة الخطأ:' : 'Error Message:'}</p>
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs font-mono">
                  {activeModalError.message}
                </div>
              </div>

              {/* Breadcrumbs Trail */}
              {activeModalError.breadcrumbs && activeModalError.breadcrumbs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink-200">{isRTL ? 'مسار خطوات المستخدم السابقة للانهيار (Breadcrumbs):' : 'Pre-crash User Steps (Breadcrumbs):'}</p>
                  <div className="space-y-1.5 bg-ink-950/40 border border-ink-800 p-3 rounded-2xl">
                    {activeModalError.breadcrumbs.map((bc, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-2xs text-ink-500">{bc.time}</span>
                        <span className="text-2xs px-2 py-0.5 rounded bg-ink-800 text-ink-300 font-mono">{bc.category}</span>
                        <span className="text-ink-200">{bc.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Stack Trace */}
              {activeModalError.stack_trace && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-ink-200">{isRTL ? 'تتبع المكدس البرمجي (Stack Trace):' : 'Full Stack Trace:'}</p>
                    <button
                      onClick={() => copyStackTrace(activeModalError.stack_trace!)}
                      className="flex items-center gap-1.5 text-2xs font-semibold text-brand-400 hover:text-brand-300 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (isRTL ? 'تم النسخ' : 'Copied') : (isRTL ? 'نسخ المكدس' : 'Copy Trace')}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-ink-950 border border-ink-800 text-2xs font-mono text-ink-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
                    {activeModalError.stack_trace}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
