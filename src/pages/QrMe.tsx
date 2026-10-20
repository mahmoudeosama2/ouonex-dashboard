import { useState, useEffect, useCallback } from 'react';
import {
  QrCode, Sparkles, Download, Eye, Zap, ShieldCheck,
  RefreshCw, BarChart2, Layers, AlertCircle, Palette, UserCheck, Users, Settings, Search, X
} from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { AppUsersManager } from '@/components/AppUsersManager';
import { AppSettingsManager } from '@/components/AppSettingsManager';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

interface QrStats {
  total_qrs: number;
  total_scans: number;
  scans_today: number;
  scans_last_7_days: number;
  active_users: number;
  paid_unlocks: number;
  custom_colors_count: number;
  custom_profiles_count: number;
  by_type: Array<{ label: string; count: number; pct: number }>;
}

export function QrMe() {
  const toast = useToast();
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Real data state
  const [stats, setStats] = useState<QrStats>({
    total_qrs: 0,
    total_scans: 0,
    scans_today: 0,
    scans_last_7_days: 0,
    active_users: 0,
    paid_unlocks: 0,
    custom_colors_count: 0,
    custom_profiles_count: 0,
    by_type: [],
  });
  const [qrs, setQrs] = useState<any[]>([]);
  const [loadingQrs, setLoadingQrs] = useState(false);
  const [qrSearch, setQrSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings' | 'recent'>('stats');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.qrMe.stats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load QR Me stats:', err);
    }
  }, []);

  const fetchQrs = useCallback(async () => {
    setLoadingQrs(true);
    try {
      const res = await api.qrMe.list();
      if (res?.data) {
        setQrs(res.data);
      }
    } catch (err) {
      console.error('Failed to load QR Me list:', err);
    } finally {
      setLoadingQrs(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchQrs(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchStats, fetchQrs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('qr.title')}
        description={t('qr.description')}
        icon={<QrCode className="w-5 h-5" />}
      />

      {/* ── KPI Grid (100% Real Database Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t('qr.kpi_total_qrs')}
          value={stats.total_qrs}
          format="num"
          icon={<QrCode className="w-4 h-4" />}
        />
        <KPICard
          label={t('qr.kpi_total_scans')}
          value={stats.total_scans}
          format="num"
          icon={<Eye className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label={t('qr.kpi_scans_today')}
          value={stats.scans_today}
          format="num"
          icon={<Zap className="w-4 h-4" />}
          accent="warning"
        />
        <KPICard
          label={t('qr.kpi_active_users')}
          value={stats.active_users}
          format="num"
          icon={<Layers className="w-4 h-4" />}
        />
      </div>

      {/* ── Navigation SubTabs ── */}
      <div className="flex items-center gap-2 border-b border-ink-800">
        {[
          { key: 'stats', label: t('qr.tab_stats'), icon: <BarChart2 className="w-4 h-4" /> },
          { key: 'users', label: t('qr.tab_users'), icon: <Users className="w-4 h-4" /> },
          { key: 'settings', label: locale === 'ar' ? 'إعدادات التطبيق' : 'App Settings', icon: <Settings className="w-4 h-4" /> },
          { key: 'recent', label: t('qr.tab_recent'), icon: <Layers className="w-4 h-4" /> },
        ].map(tTab => (
          <button
            key={tTab.key}
            onClick={() => setActiveTab(tTab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tTab.key
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {tTab.icon}
            <span>{tTab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Stats & Overview ── */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>{t('qr.popular_formats')}</span>
            </h3>
            {stats.by_type.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                {t('qr.no_qrs_yet')}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.by_type.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.label}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('qr.customization_usage')}</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">{t('qr.custom_colors')}</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.custom_colors_count}</p>
                <p className="text-2xs text-brand-400 mt-0.5">
                  {stats.total_qrs > 0 ? `${Math.round((stats.custom_colors_count / stats.total_qrs) * 100)}%` : '—'}
                </p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">{t('qr.business_cards')}</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.custom_profiles_count}</p>
                <p className="text-2xs text-brand-400 mt-0.5">
                  {stats.total_qrs > 0 ? `${Math.round((stats.custom_profiles_count / stats.total_qrs) * 100)}%` : '—'}
                </p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">{t('qr.paid_unlocks')}</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.paid_unlocks}</p>
                <p className="text-2xs text-amber-400 mt-0.5">{stats.paid_unlocks} VIP</p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">{t('qr.kpi_total_scans')}</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.total_scans}</p>
                <p className="text-2xs text-success-400 mt-0.5">{stats.scans_today} {t('overview.revenue_sub') ? '' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Tab: App Settings ── */}
      {activeTab === 'settings' && (
        <AppSettingsManager
          appId="qr_me"
          appNameAr="تطبيق كيو آر مي QR Me"
          appNameEn="QR Me Barcode"
          icon={<QrCode className="w-5 h-5 text-accent-400" />}
          descriptionAr="إعدادات التسعير، التحديث الإجباري، إيقاف التحديث، وروابط المتاجر الخاصة بتطبيق كيو آر مي."
        />
      )}

      {/* ── Tab 3: Recent Generations (Real database list) ── */}
      {activeTab === 'recent' && (() => {
        const query = qrSearch.trim().toLowerCase();
        const filteredQrs = qrs.filter(q => {
          if (!query) return true;
          return (
            (q.title || '').toLowerCase().includes(query) ||
            (q.profile_name || '').toLowerCase().includes(query) ||
            (q.type || '').toLowerCase().includes(query) ||
            (q.slug || '').toLowerCase().includes(query) ||
            String(q.id || '').toLowerCase().includes(query)
          );
        });

        return (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-ink-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink-100">{t('qr.tab_recent')}</h3>
                <span className="text-2xs font-mono bg-ink-800 text-ink-300 px-2 py-0.5 rounded-full">
                  {filteredQrs.length} / {qrs.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder={locale === 'ar' ? 'بحث في الباركود والروابط...' : 'Search QRs & slugs...'}
                    value={qrSearch}
                    onChange={(e) => setQrSearch(e.target.value)}
                    className="w-full bg-ink-950/60 border border-ink-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-ink-100 placeholder-ink-500 focus:outline-none focus:border-brand-500"
                  />
                  {qrSearch && (
                    <button
                      onClick={() => setQrSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {loadingQrs ? (
              <div className="p-8 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                <span>{t('common.loading')}</span>
              </div>
            ) : filteredQrs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-ink-200 mb-1">
                  {qrSearch ? (locale === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching QR codes') : t('qr.no_qrs_yet')}
                </p>
                <p className="text-xs text-ink-500 mb-2">
                  {qrSearch ? (locale === 'ar' ? 'جرّب تعديل كلمات البحث' : 'Try adjusting search terms') : t('qr.no_qrs_desc')}
                </p>
                {qrSearch && (
                  <button onClick={() => setQrSearch('')} className="btn-secondary text-xs px-3 py-1">
                    {locale === 'ar' ? 'إلغاء البحث' : 'Clear search'}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-ink-900/60 text-2xs uppercase tracking-wider text-ink-400 border-b border-ink-800">
                    <tr>
                      <th className="py-3 px-4">{t('qr.th_type')}</th>
                      <th className="py-3 px-4">{t('qr.th_title')}</th>
                      <th className="py-3 px-4">{t('qr.th_slug')}</th>
                      <th className="py-3 px-4">{t('qr.th_scans')}</th>
                      <th className="py-3 px-4">{t('qr.th_created')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60 text-xs">
                    {filteredQrs.map(q => (
                      <tr key={q.id} className="hover:bg-ink-900/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-brand-300 flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-ink-400" />
                          <span>{q.type || 'Text'}</span>
                        </td>
                        <td className="py-3 px-4 text-ink-200">{q.title || q.profile_name || 'QR Code'}</td>
                        <td className="py-3 px-4 text-ink-400 font-mono text-2xs">{q.slug || q.id}</td>
                        <td className="py-3 px-4 text-ink-300 font-mono">{q.scans_count || q.view_count || 0}</td>
                        <td className="py-3 px-4 text-ink-500">{q.created_at ? timeAgo(q.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab 4: App Users ── */}
      {activeTab === 'users' && (
        <AppUsersManager product="qr_me" productNameAr="كيو آر مي" productNameEn="QR Me" />
      )}
    </div>
  );
}
