import { useEffect, useState, useCallback } from 'react';
import { 
  Heart, Eye, QrCode, Users, FileText, ChevronRight, ExternalLink, 
  Sparkles, CheckCircle2, PauseCircle, Loader2, MapPin, Calendar, Clock, UserCheck,
  Edit3, Save, X, Trash2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';
import { api } from '@/lib/api';
import type { Invitation } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterItem } from '@/components/FilterBar';
import { Drawer } from '@/components/Drawer';
import { StatusBadge } from '@/components/Badge';
import { KPICard } from '@/components/KPICard';
import { LineChart, CHART_COLORS } from '@/components/Charts';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { num, date, relativeDays } from '@/lib/format';
import { useLocale } from '@/context/LocaleContext';
import { AppUsersManager } from '@/components/AppUsersManager';

export function Dawaty() {
  const { t, locale } = useLocale();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kpis, setKpis] = useState({ total: 0, published: 0, visits: 0, rsvp: 0 });
  const [usersCount, setUsersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'invitations' | 'users'>('invitations');
  const [toggling, setToggling] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.dawaty.invitations({ status: statusFilter === 'all' ? undefined : statusFilter, page, per_page: 10 });
      setInvitations(res.data);
      setTotal(res.meta.total);
      api.users.search('', 1, 'dawaty').then(r => setUsersCount(r.meta.total)).catch(() => {});
      const all = await api.dawaty.invitations({ per_page: 200 });
      setKpis({
        total: all.data.length,
        published: all.data.filter(i => i.status === 'published').length,
        visits: all.data.reduce((s, i) => s + (i.visit_count || 0), 0),
        rsvp: all.data.reduce((s, i) => s + (i.rsvp_attending || 0), 0),
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
    if (selectedIds.length === invitations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invitations.map(i => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} invitations? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api.dawaty.bulkDelete(selectedIds);
      setInvitations(prev => prev.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
      setTotal(prev => Math.max(0, prev - selectedIds.length));
    } catch (err) {
      alert('Failed to delete selected invitations.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (inv: Invitation) => {
    if (!window.confirm(`Are you sure you want to permanently delete invitation "${inv.couple_names}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api.dawaty.delete(inv.id);
      setInvitations(prev => prev.filter(i => i.id !== inv.id));
      setDrawerOpen(false);
      setSelected(null);
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert('Failed to delete invitation.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportInvitations = () => {
    const headers = [
      'ID', 'Couple Names', 'Date', 'Time', 'Venue', 'Venue Address',
      'Status', 'Template', 'Visits', 'Attending', 'Declined', 'Pending', 'Live Link'
    ];
    const data = invitations.map(inv => {
      const extra = inv as any;
      return [
        inv.id,
        inv.couple_names,
        inv.date,
        extra.time || '',
        extra.venue_name || extra.venue || '',
        extra.venue_address || '',
        inv.status,
        extra.template_id || '',
        inv.visit_count || 0,
        inv.rsvp_attending || 0,
        inv.rsvp_declined || 0,
        inv.rsvp_pending || 0,
        `https://dawety.ouonex.com/${inv.slug}`,
      ];
    });
    exportToCsv('ouonex_dawaty_invitations_database', headers, data);
  };

  const handleRowClick = async (inv: Invitation) => {
    setSelected(inv);
    setDrawerOpen(true);
    try {
      const detail = await api.dawaty.invitation(inv.id);
      if (detail) setSelected(detail);
    } catch {
      // keep current selected item
    }
  };

  const handleTogglePublish = async (inv: Invitation) => {
    setToggling(true);
    try {
      const res = await api.dawaty.togglePublish(inv.id);
      const updated = res.data ?? res;
      setSelected(updated);
      setInvitations(prev => prev.map(item => item.id === inv.id ? { ...item, ...updated } : item));
      
      // Refresh KPIs
      setKpis(prev => {
        const wasPublished = inv.status === 'published';
        const isPublished = updated.status === 'published';
        return {
          ...prev,
          published: isPublished ? prev.published + (wasPublished ? 0 : 1) : Math.max(0, prev.published - (wasPublished ? 1 : 0))
        };
      });
    } catch (err) {
      console.error('Failed to toggle publish state', err);
    } finally {
      setToggling(false);
    }
  };

  if (error) return <ErrorState message="Failed to load invitations." onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: t('dawaty.th_status'), value: statusFilter,
      options: [
        { label: t('dawaty.filter_all'), value: 'all' },
        { label: t('dawaty.filter_draft'), value: 'draft' },
        { label: t('dawaty.filter_published'), value: 'published' },
        { label: t('dawaty.filter_expired'), value: 'expired' },
      ],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Invitation>[] = [
    { key: 'couple', header: t('dawaty.th_couple'), sortValue: r => r.couple_names, render: r => <span className="font-medium text-ink-100">{r.couple_names}</span> },
    { key: 'slug', header: t('dawaty.th_live_url'), render: r => (
      r.status === 'published' ? (
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
    { key: 'status', header: t('dawaty.th_status'), sortValue: r => r.status, align: 'center', render: r => <StatusBadge status={r.status} /> },
    { key: 'template', header: t('dawaty.th_template'), render: r => <span className="text-xs text-ink-300">{r.template}</span> },
    { key: 'owner', header: t('dawaty.th_owner'), sortValue: r => r.owner, render: r => <span className="text-xs text-ink-300">{r.owner}</span> },
    { key: 'visits', header: t('dawaty.th_visits'), sortValue: r => r.visit_count, align: 'center', render: r => <span className="tabular-nums text-ink-200">{num(r.visit_count)}</span> },
    { key: 'rsvp', header: t('dawaty.th_rsvp'), align: 'center', render: r => <span className="text-xs"><span className="text-success-400">{r.rsvp_attending}</span> / <span className="text-danger-400">{r.rsvp_declined}</span> / <span className="text-ink-400">{r.rsvp_pending}</span></span> },
    { key: 'created', header: t('dawaty.th_created'), sortValue: r => r.created_at, align: 'center', render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title={t('dawaty.title')} description={t('dawaty.description')} icon={<Heart className="w-5 h-5" />} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {loading && !kpis.total ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard label={locale === 'ar' ? 'عدد المستخدمين' : 'Total Users'} value={usersCount} format="num" icon={<Users className="w-4 h-4" />} accent="brand" />
            <KPICard label={t('dawaty.kpi_total')} value={kpis.total} format="num" icon={<FileText className="w-4 h-4" />} />
            <KPICard label={t('dawaty.kpi_published')} value={kpis.published} format="num" icon={<Heart className="w-4 h-4" />} accent="success" />
            <KPICard label={t('dawaty.kpi_visits')} value={kpis.visits} format="compactNum" icon={<Eye className="w-4 h-4" />} />
            <KPICard label={t('dawaty.kpi_rsvp')} value={kpis.rsvp} format="num" icon={<UserCheck className="w-4 h-4" />} accent="success" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-ink-800 pb-3">
        <button
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'invitations'
              ? 'bg-brand-600 text-white shadow-soft'
              : 'bg-ink-900 text-ink-400 hover:text-ink-200 border border-ink-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{locale === 'ar' ? 'دعوات الزفاف' : 'Invitations List'}</span>
          <span className="text-3xs px-2 py-0.5 rounded-full bg-ink-950/60 font-mono">
            {kpis.total || invitations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow-soft'
              : 'bg-ink-900 text-ink-400 hover:text-ink-200 border border-ink-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{locale === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}</span>
          {usersCount > 0 && (
            <span className="text-3xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
              {usersCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'users' ? (
        <AppUsersManager product="dawaty" productNameAr="دعوتي" productNameEn="Dawaty" icon={<Heart className="w-4 h-4 text-rose-400" />} />
      ) : (
        <>
      {/* Funnel widget */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink-100 mb-4">{t('dawaty.funnel_title')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('dawaty.funnel_created'), value: kpis.total || 0, icon: <FileText className="w-4 h-4" />, color: 'bg-ink-700' },
            { label: t('dawaty.funnel_published'), value: kpis.published || 0, icon: <Heart className="w-4 h-4" />, color: 'bg-accent-600' },
            { label: t('dawaty.funnel_viewed'), value: kpis.visits || 0, icon: <Eye className="w-4 h-4" />, color: 'bg-brand-600' },
            { label: t('dawaty.funnel_rsvp'), value: kpis.rsvp || 0, icon: <Users className="w-4 h-4" />, color: 'bg-success-600' },
          ].map((s, i) => (
            <div key={i} className="relative">
              <div className="rounded-xl2 border border-ink-800 p-4 bg-ink-950/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center text-white`}>{s.icon}</div>
                  <span className="text-xs text-ink-400">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-ink-50 tabular-nums">{num(s.value)}</p>
              </div>
              {i < 3 && <ChevronRight className="hidden lg:block absolute top-1/2 -right-2.5 -translate-y-1/2 w-4 h-4 text-ink-600" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <FilterBar filters={filters} />

        <button
          onClick={handleExportInvitations}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-ink-900 hover:bg-ink-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-soft transition self-end sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{t('dawaty.export_excel')}</span>
        </button>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 mb-4 rounded-xl bg-ink-900 border border-brand-500/40 shadow-soft animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-ink-100">
              {t('dawaty.selected_count', { count: selectedIds.length })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-white transition"
            >
              {t('dawaty.clear_selection')}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? (locale === 'ar' ? 'جاري الحذف...' : 'Deleting...') : t('dawaty.delete_selected', { count: selectedIds.length })}
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={invitations}
        loading={loading}
        onRowClick={handleRowClick}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        emptyTitle={t('dawaty.empty_title')}
        emptyMessage={t('dawaty.empty_desc')}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected?.couple_names ?? 'Invitation'}
        subtitle={selected ? `/${selected.slug}` : ''}
        width="lg"
      >
        {selected && (
          <InvitationDetail 
            inv={selected} 
            toggling={toggling}
            onTogglePublish={() => handleTogglePublish(selected)}
            onDelete={() => handleDeleteSingle(selected)}
            onUpdated={(updated) => {
              setSelected({ ...selected, ...updated });
              setInvitations(prev => prev.map(item => item.id === selected.id ? { ...item, ...updated } : item));
            }}
          />
        )}
      </Drawer>
      </>
      )}
    </div>
  );
}

function InvitationDetail({ 
  inv, 
  toggling, 
  onTogglePublish,
  onUpdated,
  onDelete,
}: { 
  inv: Invitation; 
  toggling: boolean; 
  onTogglePublish: () => void;
  onUpdated: (updated: Partial<Invitation>) => void;
  onDelete: () => void;
}) {
  const { locale, t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const extra = inv as any;

  const [formData, setFormData] = useState({
    groom_name: extra.groom_name || inv.couple_names.split('&')[0]?.trim() || '',
    bride_name: extra.bride_name || inv.couple_names.split('&')[1]?.trim() || '',
    wedding_date: extra.wedding_date || inv.date || '',
    time: extra.time || '8:00 PM',
    venue_name: extra.venue_name || extra.venue || '',
    venue_address: extra.venue_address || '',
    template_id: extra.template_id || 'envelope_romantic',
    slug: inv.slug,
    status: inv.status,
    notifications_enabled: true,
  });

  useEffect(() => {
    setFormData({
      groom_name: extra.groom_name || inv.couple_names.split('&')[0]?.trim() || '',
      bride_name: extra.bride_name || inv.couple_names.split('&')[1]?.trim() || '',
      wedding_date: extra.wedding_date || inv.date || '',
      time: extra.time || '8:00 PM',
      venue_name: extra.venue_name || extra.venue || '',
      venue_address: extra.venue_address || '',
      template_id: extra.template_id || 'envelope_romantic',
      slug: inv.slug,
      status: inv.status,
      notifications_enabled: true,
    });
    setIsEditing(false);
    setSuccessMsg('');
  }, [inv]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.dawaty.update(inv.id, {
        groom_name: formData.groom_name,
        bride_name: formData.bride_name,
        invitation_title: `${formData.groom_name} & ${formData.bride_name}`,
        wedding_date: formData.wedding_date,
        time: formData.time,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        template_id: formData.template_id,
        slug: formData.slug,
        status: formData.status,
        notifications_enabled: formData.notifications_enabled,
      });

      const updated = res.data ?? res;
      onUpdated({
        couple_names: `${formData.groom_name} & ${formData.bride_name}`,
        slug: formData.slug,
        status: formData.status as any,
        date: formData.wedding_date,
        ...updated,
      });
      setSuccessMsg('Invitation updated successfully!');
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update invitation.');
    } finally {
      setSaving(false);
    }
  };

  const isPublished = inv.status === 'published';
  const total_rsvp = (inv.rsvp_attending || 0) + (inv.rsvp_declined || 0) + (inv.rsvp_pending || 0);
  const liveUrl = `https://dawety.ouonex.com/${inv.slug}`;

  return (
    <div className="space-y-6">
      {/* Action Control Panel */}
      <div className="p-4 rounded-xl border border-ink-800 bg-ink-900/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={inv.status} />
            <span className="text-xs text-ink-400 font-mono">/{inv.slug}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-200 hover:text-white border border-ink-700 transition"
            >
              {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? (locale === 'ar' ? 'إلغاء' : 'Cancel') : (locale === 'ar' ? 'تعديل البيانات' : 'Edit Details')}
            </button>

            <button
              onClick={onTogglePublish}
              disabled={toggling}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isPublished
                  ? 'bg-ink-800 hover:bg-ink-700 text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:shadow-emerald-900/60'
              }`}
            >
              {toggling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {locale === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : isPublished ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  {locale === 'ar' ? 'تعطيل' : 'Deactivate'}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  {locale === 'ar' ? 'تفعيل ونشر' : 'Activate & Publish'}
                </>
              )}
            </button>

            {isPublished && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
              >
                {locale === 'ar' ? 'معاينة مباشرة' : 'Live'} <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
              title={locale === 'ar' ? 'حذف الدعوة' : 'Delete Invitation'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-ink-950/80 border border-ink-800/80 space-y-3 animate-fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
            {locale === 'ar' ? 'تعديل بيانات الدعوة والمناسبة' : 'Edit Invitation & Event Data'}
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'اسم العريس' : 'Groom Name'}</label>
              <input
                type="text"
                required
                value={formData.groom_name}
                onChange={e => setFormData({ ...formData, groom_name: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'اسم العروس' : 'Bride Name'}</label>
              <input
                type="text"
                required
                value={formData.bride_name}
                onChange={e => setFormData({ ...formData, bride_name: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'تاريخ الزفاف' : 'Wedding Date'}</label>
              <input
                type="date"
                required
                value={formData.wedding_date}
                onChange={e => setFormData({ ...formData, wedding_date: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'الوقت' : 'Time'}</label>
              <input
                type="text"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'اسم القاعة' : 'Venue Name'}</label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={e => setFormData({ ...formData, venue_name: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'عنوان القاعة / الخريطة' : 'Venue Address / Maps'}</label>
              <input
                type="text"
                value={formData.venue_address}
                onChange={e => setFormData({ ...formData, venue_address: e.target.value })}
                className="input w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'قالب التصميم' : 'Design Template'}</label>
              <select
                value={formData.template_id}
                onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="envelope_romantic">{locale === 'ar' ? 'المغلف الرومانسي' : 'Romantic Envelope'}</option>
                <option value="royal_gold">{locale === 'ar' ? 'الملكي الذهبي' : 'Royal Gold'}</option>
                <option value="emerald_royal">{locale === 'ar' ? 'الزمرد الملكي' : 'Emerald Royal'}</option>
                <option value="classic_pearl">{locale === 'ar' ? 'اللؤلؤي الكلاسيكي' : 'Classic Pearl'}</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs text-ink-400 mb-1">{t('common.status')}</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="input w-full text-xs bg-ink-950"
              >
                <option value="published">{locale === 'ar' ? 'منشورة ونشطة' : 'Published'}</option>
                <option value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</option>
                <option value="inactive">{locale === 'ar' ? 'متوقفة' : 'Inactive'}</option>
                <option value="expired">{locale === 'ar' ? 'منتهية' : 'Expired'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'الرابط المخصص (Slug)' : 'URL Slug'}</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              className="input w-full text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-white"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>
      )}

      {/* Basic Info Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label={locale === 'ar' ? 'الزيارات' : 'Visits'} value={num(inv.visit_count || 0)} icon={<Eye className="w-4 h-4" />} />
        <Stat label={locale === 'ar' ? 'مسح الباركود' : 'QR Scans'} value={num(inv.qr_scan_count || 0)} icon={<QrCode className="w-4 h-4" />} />
        <Stat label={locale === 'ar' ? 'المدعوون' : 'Guests'} value={num(inv.guest_count || 0)} icon={<Users className="w-4 h-4" />} />
        <Stat label={locale === 'ar' ? 'المالك' : 'Owner'} value={inv.owner || '—'} icon={<Heart className="w-4 h-4" />} />
      </div>

      {/* Wedding Details */}
      <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          {locale === 'ar' ? 'تفاصيل المناسبة' : 'Event Details'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(extra.groom_name || extra.bride_name) && (
            <div>
              <span className="text-ink-500 block mb-0.5">{locale === 'ar' ? 'العروسان' : 'Couple'}</span>
              <span className="text-ink-100 font-medium">{extra.groom_name || '—'} & {extra.bride_name || '—'}</span>
            </div>
          )}
          <div>
            <span className="text-ink-500 block mb-0.5">{locale === 'ar' ? 'القالب' : 'Template'}</span>
            <span className="text-ink-200 font-mono">{inv.template}</span>
          </div>
          {inv.event_date && (
            <div>
              <span className="text-ink-500 block mb-0.5">{locale === 'ar' ? 'تاريخ المناسبة' : 'Event Date'}</span>
              <span className="text-ink-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-ink-400" />
                {date(inv.event_date)} ({relativeDays(inv.event_date)})
              </span>
            </div>
          )}
          {extra.venue_name && (
            <div>
              <span className="text-ink-500 block mb-0.5">{locale === 'ar' ? 'مكان الحفل' : 'Venue'}</span>
              <span className="text-ink-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ink-400" />
                {extra.venue_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RSVP Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">
          {locale === 'ar' ? 'توزيع تأكيدات الحضور' : 'RSVP Breakdown'}
        </h4>
        <div className="space-y-2">
          <RSVPRRow label={locale === 'ar' ? 'حاضر' : 'Attending'} value={inv.rsvp_attending || 0} total={total_rsvp} color="bg-success-500" />
          <RSVPRRow label={locale === 'ar' ? 'معتذر' : 'Declined'} value={inv.rsvp_declined || 0} total={total_rsvp} color="bg-danger-500" />
          <RSVPRRow label={locale === 'ar' ? 'معلق' : 'Pending'} value={inv.rsvp_pending || 0} total={total_rsvp} color="bg-ink-500" />
        </div>
      </div>

      {/* Visits Over Time Chart */}
      {inv.visits_over_time && inv.visits_over_time.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ink-100 mb-3">
            {locale === 'ar' ? 'الزيارات (آخر 30 يوماً)' : 'Visits (Last 30 Days)'}
          </h4>
          <LineChart 
            data={inv.visits_over_time.map(v => ({ date: v.date, value: v.count }))} 
            height={160} 
            color={CHART_COLORS.brand} 
            format={n => num(n)} 
          />
        </div>
      )}

      {/* Guest list preview if available */}
      {extra.guests && Array.isArray(extra.guests) && extra.guests.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ink-100 mb-3">
            {locale === 'ar' ? `قائمة المدعوين (${extra.guests.length})` : `Guest List (${extra.guests.length})`}
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {extra.guests.map((g: any, idx: number) => (
              <div key={g.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-ink-900 border border-ink-800 text-xs">
                <span className="font-medium text-ink-200">{g.name}</span>
                <div className="flex items-center gap-2">
                  {g.companion_count > 0 && <span className="text-ink-400">+{g.companion_count}</span>}
                  <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                    g.status === 'attending' ? 'bg-success-500/20 text-success-400' :
                    g.status === 'declined' ? 'bg-danger-500/20 text-danger-400' :
                    'bg-ink-700 text-ink-300'
                  }`}>
                    {g.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
      <div className="flex items-center gap-1.5 text-ink-400 mb-1">{icon}<span className="text-2xs uppercase tracking-wide">{label}</span></div>
      <p className="text-lg font-semibold text-ink-100 tabular-nums">{value}</p>
    </div>
  );
}

function RSVPRRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-ink-300">{label}</span>
        <span className="text-ink-100 font-medium">{num(value)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
