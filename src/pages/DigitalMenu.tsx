import { useEffect, useState, useCallback } from 'react';
import { UtensilsCrossed, Sparkles, ShoppingBag, AlertCircle, Store, CheckCircle2, ExternalLink, Globe2, Edit3, Save, X, QrCode, Trash2, FileSpreadsheet, LogIn, Copy, Check } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';
import { api } from '@/lib/api';
import type { Restaurant, Order, AIUsageSummary } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterItem } from '@/components/FilterBar';
import { Drawer } from '@/components/Drawer';
import { StatusBadge, PlanBadge } from '@/components/Badge';
import { KPICard } from '@/components/KPICard';
import { LineChart, BarChart, CHART_COLORS } from '@/components/Charts';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { num, egp, compactEGP, date, pct } from '@/lib/format';
import { useLocale } from '@/context/LocaleContext';

type SubTab = 'restaurants' | 'ai' | 'orders';

export function DigitalMenu() {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<SubTab>('restaurants');
  return (
    <div>
      <PageHeader title={t('menu.title')} description={t('menu.description')} icon={<UtensilsCrossed className="w-5 h-5" />} />
      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'restaurants', label: t('menu.tab_restaurants'), icon: <Store className="w-3.5 h-3.5" /> },
          { key: 'ai', label: t('menu.tab_ai'), icon: <Sparkles className="w-3.5 h-3.5" /> },
          { key: 'orders', label: t('menu.tab_orders'), icon: <ShoppingBag className="w-3.5 h-3.5" /> },
        ] as const).map(tItem => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tItem.key ? 'border-brand-500 text-brand-300' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {tItem.icon}
            {tItem.label}
          </button>
        ))}
      </div>
      {tab === 'restaurants' && <RestaurantsTab />}
      {tab === 'ai' && <AITab />}
      {tab === 'orders' && <OrdersTab />}
    </div>
  );
}

function RestaurantsTab() {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kpis, setKpis] = useState({ total: 0, active: 0, aiScans: 0, aiCost: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.digitalMenu.restaurants({ status: statusFilter === 'all' ? undefined : statusFilter, page, per_page: 10 });
      setRows(res.data);
      setTotal(res.meta.total);
      const all = await api.digitalMenu.restaurants({ per_page: 200 });
      setKpis({
        total: all.data.length,
        active: all.data.filter(r => r.status === 'active').length,
        aiScans: all.data.reduce((s, r) => s + r.ai_scans_count, 0),
        aiCost: all.data.reduce((s, r) => s + r.ai_cost, 0),
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map(r => r.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(locale === 'ar' ? `هل أنت متأكد من رغبتك في حذف ${selectedIds.length} مطعم؟ لا يمكن التراجع.` : `Are you sure you want to permanently delete ${selectedIds.length} restaurants and their menus? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api.digitalMenu.bulkDelete(selectedIds);
      setRows(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setTotal(prev => Math.max(0, prev - selectedIds.length));
    } catch (err) {
      alert(locale === 'ar' ? 'فشل حذف المطاعم المحددة.' : 'Failed to delete selected restaurants.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (r: Restaurant) => {
    if (!window.confirm(locale === 'ar' ? `هل أنت متأكد من حذف المطعم "${r.store_name}" وقائمته بالكامل؟` : `Are you sure you want to permanently delete restaurant "${r.store_name}" and its entire menu? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api.digitalMenu.delete(r.id);
      setRows(prev => prev.filter(item => item.id !== r.id));
      setDrawerOpen(false);
      setSelected(null);
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert(locale === 'ar' ? 'فشل حذف المطعم.' : 'Failed to delete restaurant.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportRestaurants = () => {
    const headers = ['ID', 'Store Name', 'Owner', 'Slug', 'Status', 'Plan', 'Categories', 'Products', 'Orders', 'AI Scans', 'AI Cost', 'Created Date', 'Live Menu URL'];
    const data = rows.map(r => [
      r.id,
      r.store_name,
      r.owner,
      r.slug,
      r.status,
      r.plan,
      r.categories_count,
      r.products_count,
      r.orders_count,
      r.ai_scans_count,
      r.ai_cost,
      date(r.created_at),
      `https://menu.ouonex.com/${r.slug}`,
    ]);
    exportToCsv('ouonex_restaurants_database', headers, data);
  };

  const handleRowClick = async (r: Restaurant) => {
    setSelected(r);
    setDrawerOpen(true);
    const detail = await api.digitalMenu.restaurant(r.id);
    if (detail) setSelected(detail);
  };

  if (error) return <ErrorState message={locale === 'ar' ? 'فشل تحميل بيانات المطاعم.' : 'Failed to load restaurants.'} onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: t('menu.th_status'), value: statusFilter,
      options: [
        { label: t('common.all'), value: 'all' },
        { label: locale === 'ar' ? 'نشط' : 'Active', value: 'active' },
        { label: locale === 'ar' ? 'تجريبي' : 'Trial', value: 'trial' },
        { label: locale === 'ar' ? 'موقوف' : 'Suspended', value: 'suspended' },
      ],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Restaurant>[] = [
    { key: 'name', header: t('menu.th_restaurant'), sortValue: r => r.store_name, render: r => <span className="font-medium text-ink-100">{r.store_name}</span> },
    { key: 'slug', header: t('menu.th_slug'), render: r => (
      r.menu_published ? (
        <a
          href={`https://${r.slug}.ouonex.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {r.slug}.ouonex.com <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-mono text-xs text-ink-600">{r.slug}.ouonex.com</span>
      )
    ) },
    { key: 'status', header: t('menu.th_status'), sortValue: r => r.status, render: r => <StatusBadge status={r.status} /> },
    { key: 'plan', header: t('menu.th_plan'), sortValue: r => r.plan, render: r => <PlanBadge plan={r.plan} /> },
    { key: 'menu', header: locale === 'ar' ? 'نشر المنيو' : 'Menu Published', render: r => r.menu_published ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <span className="text-2xs text-ink-500">{locale === 'ar' ? 'غير منشور' : 'Unpublished'}</span> },
    { key: 'owner', header: locale === 'ar' ? 'المالك' : 'Owner', sortValue: r => r.owner, render: r => <span className="text-xs text-ink-300">{r.owner}</span> },
    { key: 'orders', header: t('menu.th_orders'), sortValue: r => r.orders_count, render: r => <span className="tabular-nums text-ink-200">{num(r.orders_count)}</span> },
    { key: 'ai', header: t('menu.kpi_ai_scans'), sortValue: r => r.ai_scans_count, render: r => <span className="tabular-nums text-ink-200">{num(r.ai_scans_count)}</span> },
    { key: 'created', header: t('menu.th_created'), sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && !kpis.total ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard label={t('menu.kpi_total_restaurants')} value={kpis.total} format="num" icon={<Store className="w-4 h-4" />} />
            <KPICard label={t('menu.kpi_active_menus')} value={kpis.active} format="num" icon={<UtensilsCrossed className="w-4 h-4" />} accent="success" />
            <KPICard label={t('menu.kpi_ai_scans')} value={kpis.aiScans} format="compactNum" icon={<Sparkles className="w-4 h-4" />} />
            <KPICard label={t('menu.kpi_ai_cost')} value={kpis.aiCost} format="egp" icon={<AlertCircle className="w-4 h-4" />} accent="warning" />
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <FilterBar filters={filters} />

        <button
          onClick={handleExportRestaurants}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-ink-900 hover:bg-ink-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-soft transition self-end sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{locale === 'ar' ? 'تصدير إلى Excel (CSV)' : 'Export to Excel (CSV)'}</span>
        </button>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl bg-ink-900 border border-brand-500/40 shadow-soft animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-ink-100">
              {locale === 'ar' ? `تم تحديد ${selectedIds.length} مطعم` : `${selectedIds.length} ${selectedIds.length === 1 ? 'restaurant' : 'restaurants'} selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-white transition"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? (locale === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (locale === 'ar' ? `حذف المحدد (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`)}
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={handleRowClick}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        emptyTitle={t('menu.empty_title')}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selected?.store_name ?? 'Restaurant'} subtitle={selected ? `/${selected.slug}` : ''}>
        {selected && (
          <RestaurantDetail
            r={selected}
            onDelete={() => handleDeleteSingle(selected)}
            onUpdated={(updated) => {
              setSelected({ ...selected, ...updated });
              setRows(prev => prev.map(item => item.id === selected.id ? { ...item, ...updated } : item));
            }}
          />
        )}
      </Drawer>
    </>
  );
}

function RestaurantDetail({ 
  r, 
  onUpdated,
  onDelete
}: { 
  r: Restaurant; 
  onUpdated: (updated: Partial<Restaurant>) => void;
  onDelete: () => void;
}) {
  const { locale, t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonationModal, setImpersonationModal] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    store_name: r.store_name,
    slug: r.slug,
    status: r.status,
    currency: 'EGP',
    delivery_fee: 15,
  });

  useEffect(() => {
    setFormData({
      store_name: r.store_name,
      slug: r.slug,
      status: r.status,
      currency: 'EGP',
      delivery_fee: 15,
    });
    setIsEditing(false);
    setSuccessMsg('');
    setImpersonationModal(null);
  }, [r]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.digitalMenu.update(r.id, {
        store_name: formData.store_name,
        name: formData.store_name,
        slug: formData.slug,
        status: formData.status,
        currency: formData.currency,
        delivery_fee: formData.delivery_fee,
      });

      onUpdated({
        store_name: formData.store_name,
        slug: formData.slug,
        status: formData.status as any,
      });
      setSuccessMsg('Restaurant updated successfully!');
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update restaurant.');
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await api.digitalMenu.impersonate(r.id);
      setImpersonationModal(res.data);
    } catch (err) {
      alert('Failed to generate restaurant impersonation token.');
    } finally {
      setImpersonating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const liveUrl = `https://menu.ouonex.com/${r.slug}`;

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-ink-800">
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600/15 text-brand-400 border border-brand-500/30 hover:bg-brand-600/25 transition"
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>View Live Menu</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
        </a>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition disabled:opacity-50"
            title="Login as restaurant owner"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{impersonating ? 'Connecting...' : 'Login As'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white transition"
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditing ? 'Cancel' : 'Edit Restaurant'}
          </button>

          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
            title="Delete Restaurant"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Impersonation Bridge Modal / Panel */}
      {impersonationModal && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <LogIn className="w-4 h-4" /> {locale === 'ar' ? 'جلسة تقمص لصاحب المطعم' : 'Restaurant Impersonation'}
            </span>
            <button onClick={() => setImpersonationModal(null)} className="text-ink-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xs text-ink-300">
            {locale === 'ar' ? 'تم تسجيل الدخول بنجاح باسم' : 'Authenticated as'} <strong>{impersonationModal.owner?.name}</strong> ({impersonationModal.owner?.email}) {locale === 'ar' ? 'لمطعم' : 'for'} <strong>{impersonationModal.restaurant?.store_name}</strong>.
          </p>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-950/80 border border-ink-800">
            <span className="font-mono text-3xs text-ink-400 truncate flex-1">{impersonationModal.impersonation_token}</span>
            <button
              onClick={() => copyToClipboard(impersonationModal.impersonation_token)}
              className="flex items-center gap-1 text-3xs text-brand-400 hover:text-brand-300 shrink-0 font-medium"
            >
              {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedToken ? (locale === 'ar' ? 'تم النسخ' : 'Copied') : (locale === 'ar' ? 'نسخ الرمز' : 'Copy Token')}
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-ink-950/80 border border-ink-800/80 space-y-3 animate-fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Edit Restaurant Details</h4>
          <div>
            <label className="block text-2xs text-ink-400 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={e => setFormData({ ...formData, store_name: e.target.value })}
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">URL Slug</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="input w-full text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="active">{locale === 'ar' ? 'مفعل' : 'Active'}</option>
                <option value="trial">{locale === 'ar' ? 'تجريبي' : 'Trial'}</option>
                <option value="suspended">{locale === 'ar' ? 'موقوف' : 'Suspended'}</option>
                <option value="inactive">{locale === 'ar' ? 'معطل' : 'Inactive'}</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'العملة' : 'Currency'}</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="EGP">{locale === 'ar' ? 'جنيه مصري (EGP)' : 'Egyptian Pound (EGP)'}</option>
                <option value="SAR">{locale === 'ar' ? 'ريال سعودي (SAR)' : 'Saudi Riyal (SAR)'}</option>
                <option value="USD">{locale === 'ar' ? 'دولار أمريكي (USD)' : 'US Dollar (USD)'}</option>
                <option value="AED">{locale === 'ar' ? 'درهم إماراتي (AED)' : 'UAE Dirham (AED)'}</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-white"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-ink-950 hover:bg-amber-400 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex items-center gap-3">
        <StatusBadge status={r.status} />
        <PlanBadge plan={r.plan} />
        <span className="text-xs text-ink-400 ml-auto">{locale === 'ar' ? `تاريخ الانضمام ${date(r.created_at)}` : `Joined ${date(r.created_at)}`}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailStat label={locale === 'ar' ? 'الأقسام' : 'Categories'} value={num(r.categories_count)} />
        <DetailStat label={locale === 'ar' ? 'الأطباق والمنتجات' : 'Products'} value={num(r.products_count)} />
        <DetailStat label={t('menu.th_orders')} value={num(r.orders_count)} />
        <DetailStat label={t('menu.kpi_ai_scans')} value={num(r.ai_scans_count)} />
        <DetailStat label={t('menu.kpi_ai_cost')} value={egp(r.ai_cost)} />
        <DetailStat label={locale === 'ar' ? 'نشر المنيو' : 'Menu Published'} value={r.menu_published ? (locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'ar' ? 'لا' : 'No')} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-2">{locale === 'ar' ? 'المالك' : 'Owner'}</h4>
        <p className="text-sm text-ink-200">{r.owner}</p>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
      <p className="text-2xs text-ink-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-semibold text-ink-100 tabular-nums">{value}</p>
    </div>
  );
}

function AITab() {
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ok = true;
    api.ai.summary().then(s => ok && setSummary(s)).catch(() => setError(true)).finally(() => setLoading(false));
    return () => { ok = false; };
  }, []);

  if (error) return <ErrorState message="Failed to load AI usage data." />;
  if (loading || !summary) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Scans" value={summary.totalScans} format="num" icon={<Sparkles className="w-4 h-4" />} />
        <KPICard label="Success Rate" value={summary.successRate} format="num" icon={<CheckCircle2 className="w-4 h-4" />} accent="success" />
        <KPICard label="Failed" value={summary.failedCount} format="num" icon={<AlertCircle className="w-4 h-4" />} accent="danger" />
        <KPICard label="Total Cost" value={summary.totalCost} format="egp" icon={<UtensilsCrossed className="w-4 h-4" />} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">Cost Over Time</h3>
          <LineChart data={summary.costOverTime.map(c => ({ date: c.date, value: c.cost }))} height={200} color={CHART_COLORS.warning} format={n => `EGP ${n}`} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">Top Errors</h3>
          <div className="space-y-2">
            {summary.topErrors.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-ink-400 w-5">{i + 1}.</span>
                <span className="text-sm text-ink-200 flex-1">{e.error}</span>
                <span className="text-sm font-semibold text-ink-100 tabular-nums">{num(e.count)}</span>
                <div className="w-20 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full" style={{ width: `${(e.count / summary.topErrors[0].count) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink-100 mb-4">Scans by Restaurant</h3>
        <BarChart
          data={summary.byRestaurant.map((r, i) => ({ label: r.name.split(' ').slice(0, 2).join(' '), value: r.scans, color: i % 2 === 0 ? CHART_COLORS.brand : CHART_COLORS.accent }))}
          height={220}
          format={n => num(n)}
        />
      </div>
    </div>
  );
}

function OrdersTab() {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notImplemented] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.digitalMenu.orders({ status: statusFilter === 'all' ? undefined : statusFilter, page, per_page: 10 });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  if (notImplemented) {
    return (
      <div className="card">
        <EmptyState icon={<ShoppingBag className="w-5 h-5" />} title={locale === 'ar' ? 'الطلبات غير مسجلة بعد لهذا المنتج' : 'Orders not yet tracked for this product'} message={locale === 'ar' ? 'لم يتم تفعيل نموذج الطلبات بعد.' : 'The Digital Menu backend hasn\'t shipped an Order model yet. Check back once the endpoint is live.'} />
      </div>
    );
  }

  if (error) return <ErrorState message={locale === 'ar' ? 'فشل تحميل الطلبات.' : 'Failed to load orders.'} onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: t('common.status'), value: statusFilter,
      options: [
        { label: t('common.all'), value: 'all' },
        { label: locale === 'ar' ? 'قيد الانتظار' : 'Pending', value: 'pending' },
        { label: locale === 'ar' ? 'جاري التحضير' : 'Preparing', value: 'preparing' },
        { label: locale === 'ar' ? 'جاهز' : 'Ready', value: 'ready' },
        { label: locale === 'ar' ? 'مكتمل' : 'Completed', value: 'completed' },
        { label: locale === 'ar' ? 'ملغي' : 'Cancelled', value: 'cancelled' },
      ],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Order>[] = [
    { key: 'id', header: locale === 'ar' ? 'رقم الطلب' : 'Order ID', sortValue: r => r.id, render: r => <span className="font-mono text-xs text-ink-100">{r.id}</span> },
    { key: 'restaurant', header: t('menu.th_restaurant'), sortValue: r => r.restaurant_name, render: r => <span className="text-ink-100">{r.restaurant_name}</span> },
    { key: 'customer', header: locale === 'ar' ? 'العميل' : 'Customer', sortValue: r => r.customer, render: r => <span className="text-xs text-ink-300">{r.customer}</span> },
    { key: 'items', header: locale === 'ar' ? 'عدد الأصناف' : 'Items', sortValue: r => r.items, render: r => <span className="tabular-nums text-ink-200">{r.items}</span> },
    { key: 'total', header: t('finance.th_amount'), sortValue: r => r.total, render: r => <span className="font-semibold text-ink-100 tabular-nums">{egp(r.total)}</span> },
    { key: 'status', header: t('common.status'), sortValue: r => r.status, render: r => <StatusBadge status={r.status} /> },
    { key: 'date', header: t('common.date'), sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <>
      <FilterBar filters={filters} />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle={locale === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
      />
    </>
  );
}









