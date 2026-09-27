import { useState, useEffect, useCallback } from 'react';
import { UtensilsCrossed, Sparkles, ShoppingBag, AlertCircle, Store, CheckCircle2, ExternalLink, Globe2, Edit3, Save, X, QrCode, Trash2, FileSpreadsheet, LogIn, Copy, Check, Users, Mail, Phone, Zap, Loader2 } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';
import { api } from '@/lib/api';
import type { Restaurant, Order, AIUsageSummary, RestaurantStatus } from '@/lib/types';
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
import { AppUsersManager } from '@/components/AppUsersManager';

type SubTab = 'restaurants' | 'users' | 'ai' | 'orders';

export function DigitalMenu() {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<SubTab>('restaurants');
  return (
    <div>
      <PageHeader title={t('menu.title')} description={t('menu.description')} icon={<UtensilsCrossed className="w-5 h-5" />} />
      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'restaurants', label: t('menu.tab_restaurants'), icon: <Store className="w-3.5 h-3.5" /> },
          { key: 'users', label: locale === 'ar' ? 'إدارة المستخدمين' : 'Users Management', icon: <Users className="w-3.5 h-3.5" /> },
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
      {tab === 'users' && <AppUsersManager product="digital_menu" productNameAr="المنيو الرقمي" productNameEn="Digital Menu" icon={<UtensilsCrossed className="w-4 h-4 text-amber-400" />} />}
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
  const [usersCount, setUsersCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.digitalMenu.restaurants({ status: statusFilter === 'all' ? undefined : statusFilter, page, per_page: 10 });
      setRows(res.data);
      setTotal(res.meta.total);
      api.users.search('', 1, 'digital_menu').then(r => setUsersCount(r.meta.total)).catch(() => {});
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
    try {
      const detail = await api.digitalMenu.restaurant(r.id);
      if (detail && typeof detail === 'object') {
        const actual = 'data' in detail && (detail as any).data ? (detail as any).data : detail;
        setSelected(prev => (prev ? { ...prev, ...actual } : actual));
      }
    } catch (err) {
      console.error('Failed to load restaurant details:', err);
    }
  };

  const handleTogglePublish = async (r: Restaurant) => {
    try {
      const res = await api.digitalMenu.togglePublish(r.id);
      const newVal = res.data.menu_published;
      setRows(prev => prev.map(row => row.id === r.id ? { ...row, menu_published: newVal } : row));
      if (selected?.id === r.id) {
        setSelected(prev => (prev ? { ...prev, menu_published: newVal } : prev));
      }
    } catch {
      alert(locale === 'ar' ? 'فشل تغيير حالة نشر المنيو.' : 'Failed to toggle menu publication.');
    }
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
          href={`https://menu.ouonex.com/${r.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          menu.ouonex.com/{r.slug} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-mono text-xs text-ink-600">menu.ouonex.com/{r.slug}</span>
      )
    ) },
    { key: 'status', header: t('menu.th_status'), sortValue: r => r.status, align: 'center', render: r => <StatusBadge status={r.status} /> },
    { key: 'plan', header: t('menu.th_plan'), sortValue: r => r.plan, align: 'center', render: r => <PlanBadge plan={r.plan} /> },
    { key: 'menu', header: locale === 'ar' ? 'نشر المنيو' : 'Menu Published', align: 'center', render: r => (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); handleTogglePublish(r); }}
        title={locale === 'ar' ? (r.menu_published ? 'انقر لإلغاء النشر' : 'انقر لنشر المنيو') : (r.menu_published ? 'Click to unpublish' : 'Click to publish')}
        className="px-2 py-1 rounded hover:bg-ink-800 transition-colors mx-auto flex items-center justify-center gap-1 group"
      >
        {r.menu_published ? (
          <CheckCircle2 className="w-4 h-4 text-success-400 group-hover:text-amber-400" />
        ) : (
          <span className="text-2xs text-ink-500 group-hover:text-brand-400 font-medium">{locale === 'ar' ? 'غير منشور' : 'Unpublished'}</span>
        )}
      </button>
    ) },
    { key: 'owner', header: locale === 'ar' ? 'المالك' : 'Owner', sortValue: r => r.owner, render: r => <span className="text-xs text-ink-300">{r.owner}</span> },
    { key: 'orders', header: t('menu.th_orders'), sortValue: r => r.orders_count, align: 'center', render: r => <span className="tabular-nums text-ink-200">{num(r.orders_count)}</span> },
    { key: 'ai', header: t('menu.kpi_ai_scans'), sortValue: r => r.ai_scans_count, align: 'center', render: r => <span className="tabular-nums text-ink-200">{num(r.ai_scans_count)}</span> },
    { key: 'created', header: t('menu.th_created'), sortValue: r => r.created_at, align: 'center', render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {loading && !kpis.total ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard label={locale === 'ar' ? 'عدد المستخدمين' : 'Total Users'} value={usersCount} format="num" icon={<Users className="w-4 h-4" />} />
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

      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        title={selected?.store_name ?? 'Restaurant'} 
        subtitle={selected?.slug ? `menu.ouonex.com/${selected.slug}` : ''}
      >
        {selected && (
          <RestaurantDetail
            r={selected}
            onDelete={() => handleDeleteSingle(selected)}
            onOwnerDeleted={() => {
              setRows(prev => prev.filter(item => item.id !== selected.id));
              setDrawerOpen(false);
              setSelected(null);
              setTotal(prev => Math.max(0, prev - 1));
            }}
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
  onDelete,
  onOwnerDeleted,
}: { 
  r: Restaurant; 
  onUpdated: (updated: Partial<Restaurant>) => void;
  onDelete: () => void;
  onOwnerDeleted: () => void;
}) {
  const { locale, t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [deletingOwner, setDeletingOwner] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonationModal, setImpersonationModal] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    store_name: r.store_name ?? '',
    slug: r.slug ?? '',
    status: r.status ?? 'active',
    menu_published: r.menu_published ?? true,
    currency: 'EGP',
    delivery_fee: 15,
  });

  const [ownerFormData, setOwnerFormData] = useState({
    name: r.owner ?? '',
    email: r.owner_email ?? '',
    phone: r.owner_phone ?? '',
    password: '',
  });

  useEffect(() => {
    setFormData({
      store_name: r.store_name ?? '',
      slug: r.slug ?? '',
      status: r.status ?? 'active',
      menu_published: r.menu_published ?? true,
      currency: 'EGP',
      delivery_fee: 15,
    });
    setOwnerFormData({
      name: r.owner ?? '',
      email: r.owner_email ?? '',
      phone: r.owner_phone ?? '',
      password: '',
    });
    setIsEditing(false);
    setIsEditingOwner(false);
    setSuccessMsg('');
    setImpersonationModal(null);
  }, [r]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r.id) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.digitalMenu.update(r.id, {
        store_name: formData.store_name,
        name: formData.store_name,
        slug: formData.slug,
        status: formData.status,
        menu_published: formData.menu_published,
        currency: formData.currency,
        delivery_fee: formData.delivery_fee,
      });

      onUpdated({
        store_name: formData.store_name,
        slug: formData.slug,
        status: formData.status as any,
        menu_published: formData.menu_published,
      });
      setSuccessMsg(locale === 'ar' ? 'تم تحديث بيانات المطعم بنجاح!' : 'Restaurant updated successfully!');
      setIsEditing(false);
    } catch (err) {
      alert(locale === 'ar' ? 'فشل تحديث بيانات المطعم.' : 'Failed to update restaurant.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r.owner_id) return;
    setSavingOwner(true);
    try {
      const payload: Record<string, unknown> = {
        name: ownerFormData.name,
        email: ownerFormData.email,
        phone: ownerFormData.phone,
      };
      if (ownerFormData.password.trim()) {
        payload.password = ownerFormData.password.trim();
      }
      await api.users.update(r.owner_id, payload);
      onUpdated({
        owner: ownerFormData.name,
        owner_email: ownerFormData.email,
        owner_phone: ownerFormData.phone,
      });
      setIsEditingOwner(false);
      setSuccessMsg(locale === 'ar' ? 'تم تحديث بيانات حساب المالك بنجاح!' : 'Owner details updated successfully!');
    } catch (err) {
      alert(locale === 'ar' ? 'فشل تحديث بيانات المالك.' : 'Failed to update owner profile.');
    } finally {
      setSavingOwner(false);
    }
  };

  const handleDeleteOwner = async () => {
    if (!r.owner_id) return;
    const confirmMsg = locale === 'ar'
      ? `هل أنت متأكد من رغبتك في حذف حساب المالك "${r.owner}" ومطعمه بالكامل نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`
      : `Are you sure you want to permanently delete owner "${r.owner}" and their restaurant? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingOwner(true);
    try {
      await api.users.delete(r.owner_id);
      onOwnerDeleted();
    } catch (err) {
      alert(locale === 'ar' ? 'فشل حذف حساب المالك.' : 'Failed to delete owner account.');
      setDeletingOwner(false);
    }
  };

  const handleImpersonate = async () => {
    if (!r.id) return;
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

  const [activatingSub, setActivatingSub] = useState(false);

  const handleActivateSubscription = async () => {
    if (!r.id) return;
    const confirmMsg = locale === 'ar'
      ? `هل أنت متأكد من تفعيل اشتراك ودفع مطعم "${r.store_name}" يدوياً؟ سيتم تفعيل الحساب فوراً ونشر المنيو وإرسال إشعار للمالك.`
      : `Are you sure you want to manually activate subscription and payment for "${r.store_name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setActivatingSub(true);
    try {
      await api.digitalMenu.activateSubscription(r.id);
      onUpdated({
        status: 'active',
        menu_published: true,
        plan: 'monthly',
      });
      setSuccessMsg(locale === 'ar' ? 'تم تفعيل الاشتراك والدفع بنجاح وتحديث حالة المطعم إلى نشط!' : 'Subscription activated successfully!');
    } catch (err) {
      alert(locale === 'ar' ? 'فشل تفعيل الاشتراك.' : 'Failed to activate subscription.');
    } finally {
      setActivatingSub(false);
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
            disabled={impersonating || !r.id}
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

        </div>
      </div>

      {/* Quick Subscription & Payment Activation Banner */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
        r.status === 'active'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="text-xs">
            <span className="font-bold">
              {r.status === 'active'
                ? (locale === 'ar' ? 'الاشتراك والدفع مفعّل ونشط' : 'Active Subscription')
                : (locale === 'ar' ? 'حساب المطعم غير مفعل أو بانتظار الدفع' : 'Subscription Inactive / Pending Payment')}
            </span>
            <p className="text-2xs text-ink-400">
              {r.status === 'active'
                ? (locale === 'ar' ? 'المنيو منشور ومتاح للجمهور والطلبات نشطة.' : 'Public menu is online.')
                : (locale === 'ar' ? 'يمكنك تفعيل الاشتراك يدوياً وتأكيد الدفع بنقرة واحدة.' : 'Manually approve payment & activate.')}
            </p>
          </div>
        </div>
        {r.status !== 'active' && (
          <button
            type="button"
            onClick={handleActivateSubscription}
            disabled={activatingSub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {activatingSub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{locale === 'ar' ? '⚡ تفعيل الاشتراك والدفع الآن' : '⚡ Activate Now'}</span>
          </button>
        )}
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

      {/* Edit Restaurant Form */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as RestaurantStatus })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="active">{locale === 'ar' ? 'مفعل (Active)' : 'Active'}</option>
                <option value="trial">{locale === 'ar' ? 'تجريبي (Trial)' : 'Trial'}</option>
                <option value="pending_payment">{locale === 'ar' ? 'في انتظار الدفع' : 'Pending Payment'}</option>
                <option value="pending_approval">{locale === 'ar' ? 'في انتظار المراجعة' : 'Pending Approval'}</option>
                <option value="suspended">{locale === 'ar' ? 'موقوف (Suspended)' : 'Suspended'}</option>
                <option value="inactive">{locale === 'ar' ? 'معطل (Inactive)' : 'Inactive'}</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'نشر المنيو للجمهور' : 'Menu Published'}</label>
              <select
                value={formData.menu_published ? 'yes' : 'no'}
                onChange={e => setFormData({ ...formData, menu_published: e.target.value === 'yes' })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="yes">{locale === 'ar' ? 'منشور (مفعل)' : 'Published'}</option>
                <option value="no">{locale === 'ar' ? 'غير منشور (مخفي)' : 'Unpublished'}</option>
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
        <StatusBadge status={r.status || 'active'} />
        <PlanBadge plan={r.plan || 'free'} />
        <span className="text-xs text-ink-400 ml-auto">{locale === 'ar' ? `تاريخ الانضمام ${date(r.created_at || new Date().toISOString())}` : `Joined ${date(r.created_at || new Date().toISOString())}`}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailStat label={locale === 'ar' ? 'الأقسام' : 'Categories'} value={num(r.categories_count ?? 0)} />
        <DetailStat label={locale === 'ar' ? 'الأطباق والمنتجات' : 'Products'} value={num(r.products_count ?? 0)} />
        <DetailStat label={t('menu.th_orders')} value={num(r.orders_count ?? 0)} />
        <DetailStat label={t('menu.kpi_ai_scans')} value={num(r.ai_scans_count ?? 0)} />
        <DetailStat label={t('menu.kpi_ai_cost')} value={egp(r.ai_cost ?? 0)} />
        <DetailStat label={locale === 'ar' ? 'نشر المنيو' : 'Menu Published'} value={r.menu_published ? (locale === 'ar' ? 'نعم' : 'Yes') : (locale === 'ar' ? 'لا' : 'No')} />
      </div>

      {/* Owner Profile Management Card */}
      <div className="p-4 rounded-xl bg-ink-900/80 border border-ink-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm shadow-soft">
              {(r.owner || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink-100">{r.owner}</span>
                <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-ink-800 text-ink-400">UID: {r.owner_id}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-400 mt-0.5">
                {r.owner_email && (
                  <span className="flex items-center gap-1 text-ink-300">
                    <Mail className="w-3 h-3 text-brand-400" />
                    {r.owner_email}
                  </span>
                )}
                {r.owner_phone && (
                  <span className="flex items-center gap-1 text-ink-300">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {r.owner_phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditingOwner(!isEditingOwner)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-200 transition"
              title={locale === 'ar' ? 'تعديل بيانات بروفايل المالك' : 'Edit Owner Profile'}
            >
              {isEditingOwner ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              <span>{isEditingOwner ? (locale === 'ar' ? 'إلغاء' : 'Cancel') : (locale === 'ar' ? 'تعديل الحساب' : 'Edit Account')}</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteOwner}
              disabled={deletingOwner}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition disabled:opacity-50"
              title={locale === 'ar' ? 'حذف حساب المالك نهائياً' : 'Delete Owner Account'}
            >
              <Trash2 className="w-3 h-3" />
              <span>{deletingOwner ? (locale === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (locale === 'ar' ? 'حذف الحساب' : 'Delete Account')}</span>
            </button>
          </div>
        </div>

        {/* Edit Owner Inline Form */}
        {isEditingOwner && (
          <form onSubmit={handleSaveOwner} className="pt-3 border-t border-ink-800/80 space-y-2.5 animate-fade-in">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-brand-400">
              {locale === 'ar' ? 'تعديل بيانات حساب المالك' : 'Edit Owner Profile Details'}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-3xs text-ink-400 mb-0.5">{locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={ownerFormData.name}
                  onChange={e => setOwnerFormData({ ...ownerFormData, name: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-3xs text-ink-400 mb-0.5">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input
                  type="email"
                  required
                  value={ownerFormData.email}
                  onChange={e => setOwnerFormData({ ...ownerFormData, email: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-3xs text-ink-400 mb-0.5">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={ownerFormData.phone}
                  onChange={e => setOwnerFormData({ ...ownerFormData, phone: e.target.value })}
                  className="input w-full text-xs"
                  placeholder="+201..."
                />
              </div>
              <div>
                <label className="block text-3xs text-ink-400 mb-0.5">{locale === 'ar' ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)'}</label>
                <input
                  type="password"
                  value={ownerFormData.password}
                  onChange={e => setOwnerFormData({ ...ownerFormData, password: e.target.value })}
                  className="input w-full text-xs"
                  placeholder="******"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingOwner(false)}
                className="px-2.5 py-1 rounded-lg text-2xs text-ink-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={savingOwner}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-2xs font-semibold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                {savingOwner ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
            </div>
          </form>
        )}
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









