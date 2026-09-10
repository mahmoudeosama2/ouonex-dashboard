import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Download, Zap, ToggleLeft, ToggleRight,
  Save, RefreshCw, BarChart2, Layers, CheckCircle2,
  Briefcase, Palette, Users, ShoppingCart, TrendingUp,
  Search, Flame, Award, Filter, ArrowUpRight
} from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { timeAgo, num, egp } from '@/lib/format';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  // Paywall states
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [pdfPrice, setPdfPrice] = useState(25);
  const [activeTab, setActiveTab] = useState<'analytics' | 'template_sales' | 'gallery' | 'paywall' | 'recent'>('template_sales');

  // Search and sort in template sales
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateSort, setTemplateSort] = useState<'purchases' | 'creations' | 'downloads' | 'name'>('purchases');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');

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
      api.settings.get().then(s => {
        if (s) {
          setIsPaymentEnabled(s.cv_maker_payment_enabled ?? !(s.cv_maker_free_mode ?? true));
          if (s.cv_maker_pdf_price) setPdfPrice(s.cv_maker_pdf_price);
        }
      }).catch(() => {}),
      fetchStats(),
      fetchResumes(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchStats, fetchResumes]);

  const handleTogglePaywall = async (newVal: boolean) => {
    setIsPaymentEnabled(newVal);
    try {
      await api.settings.save({
        cv_maker_payment_enabled: newVal,
        cv_maker_free_mode: !newVal,
        cv_maker_pdf_price: pdfPrice,
      });
      toast.success(
        newVal ? 'CV Paywall Activated' : 'Free Mode Enabled',
        newVal 
          ? 'Users will now be asked to pay before downloading premium PDF resumes.'
          : 'All CV templates and PDF exports are now 100% FREE for all users (Store Review Safe).'
      );
    } catch {
      toast.error('Failed to update', 'Could not sync paywall status with server.');
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await api.settings.save({
        cv_maker_payment_enabled: isPaymentEnabled,
        cv_maker_free_mode: !isPaymentEnabled,
        cv_maker_pdf_price: pdfPrice,
      });
      toast.success('Settings Saved', 'CV Maker pricing and paywall flags updated successfully.');
    } catch {
      toast.error('Error', 'Failed to save CV Maker settings.');
    } finally {
      setSaving(false);
    }
  };

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
        title="CV Maker — Professional Resume Studio"
        description="Monitor resume downloads, template sales demand, and manage the dynamic PDF paywall."
        icon={<FileText className="w-5 h-5" />}
      />

      {/* ── Dynamic Paywall Alert Banner ── */}
      <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        !isPaymentEnabled 
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            !isPaymentEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {!isPaymentEnabled ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">
                {!isPaymentEnabled ? 'Free Mode Active (Google/Apple Review Safe)' : 'VIP PDF Paywall Active'}
              </h3>
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                !isPaymentEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {!isPaymentEnabled ? '100% FREE' : `${pdfPrice} EGP / PDF`}
              </span>
            </div>
            <p className="text-xs text-ink-300 mt-0.5">
              {!isPaymentEnabled 
                ? 'Payment dialog is hidden in the app. Users can download water-mark free PDFs immediately.'
                : 'Users must confirm payment via InstaPay / Vodafone Cash to unlock vector PDF downloads.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => handleTogglePaywall(!isPaymentEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !isPaymentEnabled 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
            }`}
          >
            {!isPaymentEnabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
            <span>{!isPaymentEnabled ? 'Switch to Paid Mode' : 'Switch to Free Mode'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Grid (100% Real Database Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Resumes Created"
          value={stats.total_resumes}
          format="num"
          icon={<FileText className="w-4 h-4" />}
        />
        <KPICard
          label="PDF Resumes Exported"
          value={stats.total_exports}
          format="num"
          icon={<Download className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label="VIP Paid Unlocks"
          value={stats.paid_unlocks}
          format="num"
          icon={<Zap className="w-4 h-4" />}
          accent="warning"
        />
        <KPICard
          label="Active Job Seekers"
          value={stats.active_users}
          format="num"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* ── Navigation SubTabs ── */}
      <div className="flex items-center gap-2 border-b border-ink-800 overflow-x-auto">
        {[
          { key: 'template_sales', label: 'Template Sales & Demand', icon: <ShoppingCart className="w-4 h-4" /> },
          { key: 'analytics', label: 'Overview & Categories', icon: <BarChart2 className="w-4 h-4" /> },
          { key: 'gallery', label: 'Template Gallery', icon: <Palette className="w-4 h-4" /> },
          { key: 'paywall', label: 'Paywall Controls', icon: <Zap className="w-4 h-4" /> },
          { key: 'recent', label: 'Recent Resumes', icon: <Layers className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              activeTab === t.key
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Template Sales & Purchase Demand (Requested Feature) ── */}
      {activeTab === 'template_sales' && (
        <div className="space-y-6">
          {/* Quick Insights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border border-ink-800 bg-ink-950/40">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">Total Templates</span>
                <Palette className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-ink-50 mt-2">{stats.template_sales.length || 23}</p>
              <p className="text-2xs text-ink-400 mt-1">Ready for users in mobile app</p>
            </div>

            <div className="card p-4 border border-amber-500/20 bg-amber-950/10">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-amber-300 uppercase tracking-wider">Total Purchases</span>
                <ShoppingCart className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-300 mt-2">{stats.paid_unlocks}</p>
              <p className="text-2xs text-ink-400 mt-1">VIP & paid template unlocks</p>
            </div>

            <div className="card p-4 border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-emerald-300 uppercase tracking-wider">Top Best Seller</span>
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-emerald-300 mt-2 truncate">
                {topSeller ? topSeller.name : 'No purchases yet'}
              </p>
              <p className="text-2xs text-ink-400 mt-1">
                {topSeller ? `${topSeller.purchases_count} buyers (${topSeller.purchase_share}% of sales)` : 'Waiting for first sale'}
              </p>
            </div>

            <div className="card p-4 border border-ink-800 bg-ink-950/40">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">Most Created</span>
                <Award className="w-4 h-4 text-accent-400" />
              </div>
              <p className="text-sm font-bold text-ink-100 mt-2 truncate">
                {mostCreated ? mostCreated.name : 'No resumes yet'}
              </p>
              <p className="text-2xs text-ink-400 mt-1">
                {mostCreated ? `${mostCreated.creations_count} resumes created` : 'Waiting for creation'}
              </p>
            </div>
          </div>

          {/* Search, Filter & Leaderboard Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-ink-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-brand-400" />
                  <span>Template Purchase & Demand Analysis (إقبال ومبيعات كل قالب)</span>
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Real-time breakdown of which templates are most bought and most demanded by users.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="Search template name..."
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
                    Purchases
                  </button>
                  <button
                    onClick={() => setTemplateSort('creations')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      templateSort === 'creations' ? 'bg-ink-700 text-ink-100 font-semibold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    Creations
                  </button>
                  <button
                    onClick={() => setTemplateSort('downloads')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      templateSort === 'downloads' ? 'bg-ink-700 text-ink-100 font-semibold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    Exports
                  </button>
                </div>
              </div>
            </div>

            {/* Template Sales Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Rank & Template</th>
                    <th>Buyers / Purchases (كم اشترى)</th>
                    <th>Demand Share (% من المبيعات)</th>
                    <th>Resumes Created</th>
                    <th>PDF Exports</th>
                    <th>Demand Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-ink-500">
                        No templates matching your search query.
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
                                      <Flame className="w-2.5 h-2.5 text-amber-400" /> #1 Best Seller
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
                              <span className="text-2xs text-ink-500">purchases</span>
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
                                🔥 High Demand
                              </span>
                            ) : item.purchases_count > 0 ? (
                              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                ⚡ Active Demand
                              </span>
                            ) : item.creations_count > 0 ? (
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-ink-800 text-ink-300 border border-ink-700/50">
                                Free Tier Usage
                              </span>
                            ) : (
                              <span className="text-2xs text-ink-500">
                                No purchases yet
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
                              <span>View Resumes</span>
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
              <span>Top Created Resume Templates</span>
            </h3>
            {stats.templates.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                No template creations recorded yet in database.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.templates.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.name}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Top Career Categories</span>
            </h3>
            {stats.categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                No career category data recorded yet in database.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.categories.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.name}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-500 rounded-full" style={{ width: `${item.percentage}%` }} />
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

      {/* ── Tab 4: Paywall Controls ── */}
      {activeTab === 'paywall' && (
        <div className="card p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-ink-100 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span>CV Maker Dynamic Paywall Configuration</span>
            </h3>
            <p className="text-xs text-ink-400">
              Settings synchronized in real-time with backend and user mobile apps without requiring app store updates.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-ink-800/60">
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-ink-100">Global In-App Paywall</p>
                <p className="text-xs text-ink-400">When enabled, users must pay via InstaPay / Vodafone Cash to download PDFs.</p>
              </div>
              <button
                onClick={() => handleTogglePaywall(!isPaymentEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isPaymentEnabled ? 'bg-brand-500' : 'bg-ink-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPaymentEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-ink-100">Store Review Bypass (Free Mode)</p>
                <p className="text-xs text-ink-400">When reviewing with Apple / Google, toggle this to hide all payment prompts.</p>
              </div>
              <button
                onClick={() => setIsPaymentEnabled(!isPaymentEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${!isPaymentEnabled ? 'bg-emerald-500' : 'bg-ink-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${!isPaymentEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="pt-4 space-y-2">
              <label className="block text-xs font-semibold text-ink-200">
                PDF Export Unlock Price (EGP)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={pdfPrice}
                  onChange={e => setPdfPrice(Number(e.target.value))}
                  className="input max-w-[160px]"
                />
                <span className="text-xs text-ink-400 font-medium">EGP per resume export</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ink-800 flex justify-end">
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2 px-5 py-2 text-xs font-bold"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 5: Recent CVs (Real database list) ── */}
      {activeTab === 'recent' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-ink-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-ink-100">Recent Candidate Resumes</h3>
              <p className="text-xs text-ink-400">Live database telemetry</p>
            </div>

            {/* Template Filter Pill */}
            {selectedTemplateFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-300">
                  Filtered by: <strong className="text-brand-300">{selectedTemplateFilter}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedTemplateFilter('all');
                    fetchResumes();
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {loadingResumes ? (
            <div className="p-8 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
              <span>Loading resumes...</span>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-ink-200 mb-1">No Resumes Generated Yet</p>
              <p className="text-xs text-ink-500">When users create or download resumes in the CV Maker app, they will appear here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target Job Title</th>
                    <th>Chosen Template</th>
                    <th>Downloads</th>
                    <th>Tier</th>
                    <th>Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map(c => (
                    <tr key={c.id}>
                      <td className="font-semibold text-ink-100">{c.candidate_name || 'Candidate'}</td>
                      <td className="text-ink-300">{c.job_title || '—'}</td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded bg-ink-800/80 text-ink-300 border border-ink-700/50">
                          {c.template_name || 'Standard'}
                        </span>
                      </td>
                      <td className="font-mono text-ink-200">{c.downloads_count || 0}</td>
                      <td>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                          c.is_paid || c.is_vip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-ink-700/40 text-ink-400'
                        }`}>
                          {c.is_paid || c.is_vip ? 'VIP Paid' : 'Free Tier'}
                        </span>
                      </td>
                      <td className="text-2xs text-ink-500">{c.created_at ? timeAgo(c.created_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
