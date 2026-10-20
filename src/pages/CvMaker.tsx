import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Download, Zap,
  RefreshCw, BarChart2, Layers,
  Briefcase, Palette, Users, ShoppingCart, TrendingUp,
  Search, Flame, Award, Filter, ArrowUpRight, Settings, Inbox
} from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';
import { api } from '@/lib/api';
import { timeAgo, num, egp } from '@/lib/format';
import { AppUsersManager } from '@/components/AppUsersManager';
import { AppSettingsManager } from '@/components/AppSettingsManager';

interface TemplateSalesItem {
  name: string;
  purchases_count: number;
  creations_count: number;
  downloads_count: number;
  purchase_share: number;
  creation_share: number;
}

interface CvStats {
  total_resumes: number;
  total_exports: number;
  paid_unlocks: number;
  active_users: number;
  templates: Array<{ name: string; count: number; percentage: number }>;
  template_sales: TemplateSalesItem[];
  categories: Array<{ name: string; count: number; percentage: number }>;
}

export function CvMaker() {
  const toast = useToast();
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  
  // Real data state
  const [stats, setStats] = useState<CvStats>({
    total_resumes: 0,
    total_exports: 0,
    paid_unlocks: 0,
    active_users: 0,
    templates: [],
    template_sales: [],
    categories: [],
  });
  const [resumes, setResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  const [activeTab, setActiveTab] = useState<'analytics' | 'template_sales' | 'users' | 'gallery' | 'settings' | 'recent'>('template_sales');

  // Search and sort in template sales
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateSort, setTemplateSort] = useState<'purchases' | 'creations' | 'downloads' | 'name'>('purchases');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');

  // Search and filter in Recent CVs
  const [resumeSearch, setResumeSearch] = useState('');
  const [resumeTierFilter, setResumeTierFilter] = useState<'all' | 'paid' | 'free'>('all');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.cvMaker.stats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load CV Maker stats:', err);
    }
  }, []);

  const fetchResumes = useCallback(async (tpl?: string) => {
    setLoadingResumes(true);
    try {
      const res = await api.cvMaker.list({ template: tpl && tpl !== 'all' ? tpl : undefined });
      if (res?.data) {
        setResumes(res.data);
      }
    } catch (err) {
      console.error('Failed to load CV Maker list:', err);
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchResumes(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchStats, fetchResumes]);

  // Filter and sort template sales
  const filteredTemplates = useMemo(() => {
    let list = [...(stats.template_sales || [])];

    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase().trim();
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (templateSort === 'purchases') {
        if (b.purchases_count !== a.purchases_count) return b.purchases_count - a.purchases_count;
        return b.creations_count - a.creations_count;
      }
      if (templateSort === 'creations') {
        return b.creations_count - a.creations_count;
      }
      if (templateSort === 'downloads') {
        return b.downloads_count - a.downloads_count;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [stats.template_sales, templateSearch, templateSort]);

  // Filtered resumes for Recent CVs tab
  const filteredResumes = useMemo(() => {
    return resumes.filter(c => {
      const q = resumeSearch.toLowerCase().trim();
      const matchSearch = !q ||
        (c.candidate_name && c.candidate_name.toLowerCase().includes(q)) ||
        (c.job_title && c.job_title.toLowerCase().includes(q)) ||
        (c.template_name && c.template_name.toLowerCase().includes(q));

      const matchTier = resumeTierFilter === 'all' ||
        (resumeTierFilter === 'paid' && (c.is_paid || c.is_vip)) ||
        (resumeTierFilter === 'free' && (!c.is_paid && !c.is_vip));

      return matchSearch && matchTier;
    });
  }, [resumes, resumeSearch, resumeTierFilter]);

  // Top best seller template
  const topSeller = useMemo(() => {
    const sorted = [...(stats.template_sales || [])].sort((a, b) => b.purchases_count - a.purchases_count);
    return sorted[0]?.purchases_count > 0 ? sorted[0] : null;
  }, [stats.template_sales]);

  // Most created template
  const mostCreated = useMemo(() => {
    const sorted = [...(stats.template_sales || [])].sort((a, b) => b.creations_count - a.creations_count);
    return sorted[0]?.creations_count > 0 ? sorted[0] : null;
  }, [stats.template_sales]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('cv.title')}
        description={t('cv.description')}
        icon={<FileText className="w-5 h-5" />}
      />


      {/* ── KPI Grid (100% Real Database Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t('cv.kpi_total_resumes')}
          value={stats.total_resumes}
          format="num"
          icon={<FileText className="w-4 h-4" />}
        />
        <KPICard
          label={t('cv.kpi_pdf_exports')}
          value={stats.total_exports}
          format="num"
          icon={<Download className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label={t('cv.kpi_paid_unlocks')}
          value={stats.paid_unlocks}
          format="num"
          icon={<Zap className="w-4 h-4" />}
          accent="warning"
        />
        <KPICard
          label={t('cv.kpi_active_seekers')}
          value={stats.active_users}
          format="num"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* ── Navigation SubTabs ── */}
      <div className="flex items-center gap-2 border-b border-ink-800 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'template_sales', label: t('cv.tab_template_sales'), icon: <ShoppingCart className="w-4 h-4" /> },
          { key: 'recent', label: t('cv.tab_recent'), icon: <Layers className="w-4 h-4" /> },
          { key: 'analytics', label: t('cv.tab_analytics'), icon: <BarChart2 className="w-4 h-4" /> },
          { key: 'gallery', label: t('cv.tab_gallery'), icon: <Palette className="w-4 h-4" /> },
          { key: 'users', label: locale === 'ar' ? 'إدارة المستخدمين' : 'Users Management', icon: <Users className="w-4 h-4" /> },
          { key: 'settings', label: locale === 'ar' ? 'إعدادات التطبيق' : 'App Settings', icon: <Settings className="w-4 h-4" /> },
        ].map(tTab => (
          <button
            key={tTab.key}
            onClick={() => setActiveTab(tTab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0 ${
              activeTab === tTab.key
                ? 'border-brand-500 text-brand-300 font-bold'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {tTab.icon}
            <span>{tTab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <AppUsersManager product="cv_maker" productNameAr="صانع السيرة الذاتية" productNameEn="CV Maker" icon={<FileText className="w-4 h-4 text-blue-400" />} />
      )}

      {/* ── Tab 1: Template Sales & Purchase Demand (Requested Feature) ── */}
      {activeTab === 'template_sales' && (
        <div className="space-y-6">
          {/* Quick Insights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border border-ink-800 bg-ink-950/40">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">{t('cv.total_templates_card')}</span>
                <Palette className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-ink-50 mt-2">{stats.template_sales.length || 23}</p>
              <p className="text-2xs text-ink-400 mt-1">{t('cv.total_templates_sub')}</p>
            </div>

            <div className="card p-4 border border-amber-500/20 bg-amber-950/10">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-amber-300 uppercase tracking-wider">{t('cv.total_purchases_card')}</span>
                <ShoppingCart className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-300 mt-2">{stats.paid_unlocks}</p>
              <p className="text-2xs text-ink-400 mt-1">{t('cv.total_purchases_sub')}</p>
            </div>

            <div className="card p-4 border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-emerald-300 uppercase tracking-wider">{t('cv.top_seller_card')}</span>
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-300 mt-2 truncate">
                {topSeller ? topSeller.name : t('cv.status_no_purchases')}
              </p>
              <p className="text-2xs text-ink-400 mt-1">
                {topSeller ? `${topSeller.purchases_count} (${topSeller.purchase_share}%)` : '—'}
              </p>
            </div>

            <div className="card p-4 border border-ink-800 bg-ink-950/40">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">{t('cv.most_created_card')}</span>
                <Award className="w-4 h-4 text-accent-400" />
              </div>
              <p className="text-sm font-bold text-ink-100 mt-2 truncate">
                {mostCreated ? mostCreated.name : t('common.no_data')}
              </p>
              <p className="text-2xs text-ink-400 mt-1">
                {mostCreated ? `${mostCreated.creations_count}` : '—'}
              </p>
            </div>
          </div>

          {/* Search, Filter & Leaderboard Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-ink-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-brand-400" />
                  <span>{t('cv.sales_title')}</span>
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  {t('cv.sales_desc')}
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder={t('cv.search_placeholder')}
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    className="input w-full pl-8 py-1.5 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 bg-ink-900 border border-ink-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setTemplateSort('purchases')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      templateSort === 'purchases' ? 'bg-ink-700 text-ink-100 font-semibold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {t('cv.sort_purchases')}
                  </button>
                  <button
                    onClick={() => setTemplateSort('creations')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      templateSort === 'creations' ? 'bg-ink-700 text-ink-100 font-semibold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {t('cv.sort_creations')}
                  </button>
                  <button
                    onClick={() => setTemplateSort('downloads')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      templateSort === 'downloads' ? 'bg-ink-700 text-ink-100 font-semibold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {t('cv.sort_exports')}
                  </button>
                </div>
              </div>
            </div>

            {/* Template Sales Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>{t('cv.th_rank_template')}</th>
                    <th>{t('cv.th_buyers_purchases')}</th>
                    <th>{t('cv.th_demand_share')}</th>
                    <th>{t('cv.th_creations')}</th>
                    <th>{t('cv.th_downloads')}</th>
                    <th>{t('cv.th_demand_status')}</th>
                    <th className="text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-ink-500">
                        {t('common.no_data')}
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((item, idx) => {
                      const isTop = item.purchases_count > 0 && idx === 0;
                      return (
                        <tr key={item.name} className="hover:bg-ink-900/40 transition-colors">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isTop
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-ink-800 text-ink-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-ink-100 text-xs flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  {isTop && (
                                    <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                      <Flame className="w-2.5 h-2.5 text-amber-400" /> {t('cv.best_seller_badge')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Purchases count */}
                          <td>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`text-xs font-bold ${item.purchases_count > 0 ? 'text-amber-300' : 'text-ink-400'}`}>
                                {item.purchases_count}
                              </span>
                            </div>
                          </td>

                          {/* Purchase share progress bar */}
                          <td className="w-44">
                            <div className="space-y-1">
                              <div className="flex justify-between text-2xs text-ink-400 font-mono">
                                <span>{item.purchase_share}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-ink-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.purchases_count > 0 ? 'bg-amber-500' : 'bg-ink-700'
                                  }`}
                                  style={{ width: `${Math.max(item.purchase_share, item.purchases_count > 0 ? 5 : 0)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Creations */}
                          <td>
                            <span className="text-xs font-mono text-ink-200">{item.creations_count}</span>
                          </td>

                          {/* Downloads */}
                          <td>
                            <span className="text-xs font-mono text-ink-200">{item.downloads_count}</span>
                          </td>

                          {/* Demand Status */}
                          <td>
                            {item.purchases_count > 5 ? (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {t('cv.status_high_demand')}
                              </span>
                            ) : item.purchases_count > 0 ? (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {t('cv.status_active_demand')}
                              </span>
                            ) : item.creations_count > 0 ? (
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-ink-800 text-ink-300 border border-ink-700/50">
                                {t('cv.status_free_tier')}
                              </span>
                            ) : (
                              <span className="text-2xs text-ink-500">
                                {t('cv.status_no_purchases')}
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setSelectedTemplateFilter(item.name);
                                fetchResumes(item.name);
                                setActiveTab('recent');
                              }}
                              className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{t('cv.btn_view_resumes')}</span>
                              <ArrowUpRight className="w-3 h-3" />
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
        </div>
      )}

      {/* ── Tab 2: Stats & Categories Overview ── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-400" />
              <span>{locale === 'ar' ? 'أعلى قوالب السير الذاتية استخداماً' : 'Top Created Resume Templates'}</span>
            </h3>
            {stats.templates.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                {locale === 'ar' ? 'لا توجد بيانات قوالب مسجلة حتى الآن' : 'No template creations recorded yet in database.'}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.templates.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.name}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({Number(item.percentage).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, Number(item.percentage))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>{locale === 'ar' ? 'أعلى المجالات والتخصصات المهنية' : 'Top Career Categories'}</span>
            </h3>
            {stats.categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                {locale === 'ar' ? 'لا توجد بيانات تخصصات مسجلة حتى الآن' : 'No career category data recorded yet in database.'}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.categories.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.name}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({Number(item.percentage).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full" style={{ width: `${Math.min(100, Number(item.percentage))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Template Gallery ── */}
      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Modern Tech Executive', tag: 'VIP Premium', desc: 'Dual-column with skill proficiency bars, timeline bullets, and dark sidebar.' },
            { name: 'Clean Minimalist ATS', tag: 'Free Tier', desc: 'Single-column text optimized for automated Applicant Tracking Systems.' },
            { name: 'Creative Portfolio', tag: 'VIP Premium', desc: 'Vibrant color accents, QR contact code embed, and portfolio link pills.' },
            { name: 'Corporate Banking', tag: 'VIP Premium', desc: 'Formal serif typography, structured credentials grid, and executive summary.' },
            { name: 'Fresh Graduate Simple', tag: 'Free Tier', desc: 'Highlights coursework, graduation projects, internships, and languages.' },
            { name: 'Medical & Healthcare', tag: 'VIP Premium', desc: 'Dedicated certifications section, license badges, and clinical rotations.' },
            { name: 'Classic ATS', tag: 'Free Tier', desc: 'High-compatibility monochrome layout designed for Fortune 500 ATS filters.' },
            { name: 'Tech Indigo', tag: 'VIP Premium', desc: 'Indigo accent badges, GitHub & portfolio buttons, full-stack layout.' },
            { name: 'Digital Marketing Modern', tag: 'VIP Premium', desc: 'Metrics & KPI callout blocks, campaign results highlight.' },
          ].map(tpl => {
            const stat = stats.template_sales.find(s => s.name.toLowerCase().includes(tpl.name.toLowerCase()));
            return (
              <div key={tpl.name} className="card p-4 space-y-3 border border-ink-800 hover:border-brand-500/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                    tpl.tag.includes('VIP') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>{tpl.tag}</span>
                  <span className="text-2xs text-ink-400 flex items-center gap-1 font-mono">
                    <ShoppingCart className="w-3 h-3 text-amber-400" />
                    <span>{stat ? stat.purchases_count : 0} buyers</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-ink-100">{tpl.name}</h4>
                <p className="text-xs text-ink-400 leading-relaxed">{tpl.desc}</p>
              </div>
            );
          })}
        </div>
      )}


      {/* ── Tab: App Settings ── */}
      {activeTab === 'settings' && (
        <AppSettingsManager
          appId="cv_maker"
          appNameAr="صانع السيرة الذاتية Studio"
          appNameEn="CV Maker Studio"
          icon={<FileText className="w-5 h-5 text-blue-400" />}
          descriptionAr="إعدادات التسعير، التحديث الإجباري، إيقاف التحديث، وروابط المتاجر الخاصة بتطبيق صانع السيرة الذاتية."
        />
      )}

      {/* ── Tab: Recent CVs (Real database stream) ── */}
      {activeTab === 'recent' && (
        <div className="card overflow-hidden">
          {/* Card Header & Controls Toolbar */}
          <div className="p-4 sm:p-5 border-b border-ink-800/80 bg-ink-950/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/25 flex items-center justify-center shrink-0 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-ink-50">
                    {t('cv.recent_title')}
                  </h3>
                  <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/25 tabular-nums">
                    {locale === 'ar' ? `${filteredResumes.length} سيرة ذاتية` : `${filteredResumes.length} Resumes`}
                  </span>
                </div>
                <p className="text-2xs text-ink-400 mt-0.5">
                  {locale === 'ar' 
                    ? 'متابعة حية ومباشرة لجميع السير الذاتية التي أنشأها المستخدمون مع تفاصيل القوالب والتنزيلات.'
                    : 'Real-time database stream of resumes generated by users with template selection and downloads.'}
                </p>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1 bg-ink-900 border border-ink-800 rounded-lg p-0.5 text-2xs">
                <button
                  type="button"
                  onClick={() => setResumeTierFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    resumeTierFilter === 'all'
                      ? 'bg-ink-700 text-ink-100 font-bold shadow-sm'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {t('common.all')} ({resumes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setResumeTierFilter('paid')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                    resumeTierFilter === 'paid'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{t('cv.vip_paid')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResumeTierFilter('free')}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                    resumeTierFilter === 'free'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{t('cv.free_tier')}</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'بحث بالاسم، المسمى، أو القالب...' : 'Search candidate, job, template...'}
                  value={resumeSearch}
                  onChange={e => setResumeSearch(e.target.value)}
                  className="input w-full pl-8 py-1.5 text-xs font-medium"
                />
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchResumes()}
                disabled={loadingResumes}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
                title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingResumes ? 'animate-spin text-brand-400' : ''}`} />
                <span className="hidden sm:inline">{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Active Template Filter Notice */}
          {selectedTemplateFilter !== 'all' && (
            <div className="px-4 py-2 bg-brand-500/10 border-b border-brand-500/20 flex items-center justify-between text-xs">
              <span className="text-ink-300">
                {locale === 'ar' ? 'تصفية حسب القالب:' : 'Filtered by template:'}{' '}
                <strong className="text-brand-300 font-semibold">{selectedTemplateFilter}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateFilter('all');
                  fetchResumes();
                }}
                className="text-xs text-rose-400 hover:underline font-medium"
              >
                {t('common.clear_filter')}
              </button>
            </div>
          )}

          {/* Table Content */}
          {loadingResumes ? (
            <div className="p-12 text-center text-xs text-ink-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
              <span className="font-medium">{t('common.loading')}</span>
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-ink-800/80 flex items-center justify-center text-ink-400 mb-3 border border-ink-700/60">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-ink-100 mb-1">
                {resumeSearch.trim() || resumeTierFilter !== 'all' 
                  ? (locale === 'ar' ? 'لا توجد سير ذاتية مطابقة للتصفية' : 'No matching resumes found')
                  : t('cv.no_resumes_yet')}
              </p>
              <p className="text-xs text-ink-400 max-w-sm mb-3">
                {resumeSearch.trim() || resumeTierFilter !== 'all'
                  ? (locale === 'ar' ? 'جرّب تعديل كلمات البحث أو اختيار باقة أخرى.' : 'Try adjusting your search terms or filters.')
                  : t('cv.no_resumes_desc')}
              </p>
              {(resumeSearch.trim() || resumeTierFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setResumeSearch('');
                    setResumeTierFilter('all');
                  }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  {t('common.clear_filter')}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-4 py-3.5">{t('cv.candidate')}</th>
                    <th className="px-4 py-3.5">{t('cv.target_job')}</th>
                    <th className="px-4 py-3.5">{t('cv.chosen_template')}</th>
                    <th className="px-4 py-3.5 text-center">{t('cv.downloads')}</th>
                    <th className="px-4 py-3.5 text-center">{t('cv.tier')}</th>
                    <th className="px-4 py-3.5">{t('cv.generated')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/50">
                  {filteredResumes.map(c => {
                    const initials = (c.candidate_name || 'C')
                      .trim()
                      .split(' ')
                      .filter(Boolean)
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const isPaid = !!c.is_paid || !!c.is_vip;

                    return (
                      <tr key={c.id} className="hover:bg-ink-800/35 transition-colors">
                        {/* Candidate Name & Avatar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600/30 to-brand-500/10 text-brand-300 border border-brand-500/30 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-ink-100 block text-xs">
                                {c.candidate_name || 'Candidate'}
                              </span>
                              {c.user_email ? (
                                <span className="text-3xs text-ink-400 block font-mono mt-0.5">{c.user_email}</span>
                              ) : c.phone ? (
                                <span className="text-3xs text-ink-400 block font-mono mt-0.5">{c.phone}</span>
                              ) : (
                                <span className="text-3xs text-ink-500 block">ID: {c.id != null ? String(c.id).slice(0, 8) : '—'}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Target Job Title */}
                        <td className="px-4 py-3.5">
                          {c.job_title ? (
                            <div className="flex items-center gap-1.5 text-ink-200">
                              <Briefcase className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                              <span className="font-medium">{c.job_title}</span>
                            </div>
                          ) : (
                            <span className="text-ink-500 font-mono">—</span>
                          )}
                        </td>

                        {/* Chosen Template */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1 rounded-lg bg-ink-800/80 text-brand-300 border border-brand-500/20 shadow-sm">
                            <Palette className="w-3 h-3 text-brand-400 shrink-0" />
                            <span>{c.template_name || 'Standard'}</span>
                          </span>
                        </td>

                        {/* Downloads Counter */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-ink-200 bg-ink-950/70 px-2.5 py-1 rounded-md border border-ink-800 shadow-inner">
                            <Download className="w-3 h-3 text-ink-400" />
                            <span className="tabular-nums">{c.downloads_count || 0}</span>
                          </span>
                        </td>

                        {/* Tier Badge */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                            isPaid
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          }`}>
                            {isPaid ? (
                              <>
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                <span>{t('cv.vip_paid')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>{t('cv.free_tier')}</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Created At Relative Time */}
                        <td className="px-4 py-3.5">
                          <span className="text-2xs text-ink-400 font-medium whitespace-nowrap">
                            {c.created_at ? timeAgo(c.created_at, locale) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
