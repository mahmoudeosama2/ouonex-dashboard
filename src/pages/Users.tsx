import { useEffect, useState, useCallback } from 'react';
import {
  Users as UsersIcon, Search, Wallet, Clock, Mail, Edit3, Save, X, Key,
  Shield, CheckCircle2, FileSpreadsheet, LogIn, Copy, Check, ExternalLink,
  Plus, Phone, Trash2, Power, Layers, Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import type { UserSearchResult, Product } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { Drawer } from '@/components/Drawer';
import { ProductBadge, StatusBadge } from '@/components/Badge';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { egp, date, timeAgo } from '@/lib/format';
import { exportToCsv } from '@/lib/exportCsv';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';

export function UsersPage() {
  const { t, locale } = useLocale();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    product: 'dawaty' as Product,
    role: 'user',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.users.search(query, page, selectedProduct, selectedStatus);
      setResults(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [query, page, selectedProduct, selectedStatus]);

  useEffect(() => {
    const tTimer = setTimeout(load, 300);
    return () => clearTimeout(tTimer);
  }, [load]);

  const handleRowClick = async (u: UserSearchResult) => {
    setSelected(u);
    setDrawerOpen(true);
    const detail = await api.users.detail(u.id);
    if (detail) setSelected(detail);
  };

  const handleUserUpdated = (updated: Partial<UserSearchResult>) => {
    if (!selected) return;
    const newObj = { ...selected, ...updated };
    setSelected(newObj);
    setResults(prev => prev.map(u => u.id === selected.id ? { ...u, ...updated } : u));
  };

  const handleToggleStatus = async (user: UserSearchResult) => {
    const nextStatus = (user.status || 'active') === 'active' ? 'suspended' : 'active';
    try {
      await api.users.toggleStatus(user.id, nextStatus);
      toast.success(
        nextStatus === 'active' ? t('users.activate_user') : t('users.suspend_user'),
        user.name
      );
      setResults(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      if (selected && selected.id === user.id) {
        setSelected({ ...selected, status: nextStatus });
      }
    } catch {
      toast.error('Error', 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (user: UserSearchResult) => {
    if (!confirm(t('users.confirm_delete'))) return;
    try {
      await api.users.delete(user.id);
      toast.success(t('users.delete_user'), user.name);
      setResults(prev => prev.filter(u => u.id !== user.id));
      setTotal(prev => Math.max(0, prev - 1));
      if (selected && selected.id === user.id) {
        setDrawerOpen(false);
        setSelected(null);
      }
    } catch {
      toast.error('Error', 'Failed to delete user.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.users.create({
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        product: addForm.product,
        role: addForm.role,
        status: 'active',
      });
      toast.success(t('users.add_user'), `${res.data.name} created successfully.`);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', password: '', product: 'dawaty', role: 'user' });
      load();
    } catch (err: any) {
      toast.error('Error', err?.message || 'Failed to create user account.');
    } finally {
      setCreating(false);
    }
  };

  const handleExportUsers = () => {
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Status', 'Products', 'Payments Count', 'Pending Payments', 'Joined Date'];
    const data = results.map(u => [
      u.id,
      u.name,
      u.email,
      u.phone || '',
      u.status || 'active',
      u.products.join(', '),
      u.payment_count,
      u.pending_count,
      date(u.joined_at),
    ]);
    exportToCsv('ouonex_users_database', headers, data);
  };

  if (error) return <ErrorState message={locale === 'ar' ? 'فشل تحميل قائمة المستخدمين.' : 'Failed to load users.'} onRetry={load} />;

  const columns: Column<UserSearchResult>[] = [
    { key: 'name', header: t('users.th_name'), align: 'start', sortValue: r => r.name, render: r => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-semibold text-ink-200 shrink-0">
          {r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div>
          <span className="font-medium text-ink-100 block">{r.name}</span>
          {r.phone && <span className="text-3xs text-ink-500 flex items-center gap-1 font-mono"><Phone className="w-2.5 h-2.5" />{r.phone}</span>}
        </div>
      </div>
    ) },
    { key: 'email', header: locale === 'ar' ? 'البريد الإلكتروني' : 'Email', align: 'start', sortValue: r => r.email, render: r => <span className="text-xs text-ink-400">{r.email}</span> },
    { key: 'status', header: t('common.status'), align: 'start', sortValue: r => r.status || 'active', render: r => (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold ${
        (r.status || 'active') === 'active' 
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
          : 'bg-danger-500/15 text-danger-300 border border-danger-500/30'
      }`}>
        {(r.status || 'active') === 'active' ? t('users.status_active') : t('users.status_suspended')}
      </span>
    ) },
    { key: 'products', header: t('users.th_products'), align: 'start', render: r => (
      <div className="flex flex-wrap gap-1">{r.products.map(p => <ProductBadge key={p} product={p} />)}</div>
    ) },
    { key: 'payments', header: t('users.th_payments'), align: 'center', sortValue: r => r.payment_count, render: r => <span className="tabular-nums text-ink-200">{r.payment_count}</span> },
    { key: 'pending', header: t('overview.pending_payments'), align: 'center', sortValue: r => r.pending_count, render: r => r.pending_count > 0 ? <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/30">{r.pending_count}</span> : <span className="text-ink-500">—</span> },
    { key: 'joined', header: t('users.th_joined'), align: 'start', sortValue: r => r.joined_at, render: r => <span className="text-xs text-ink-400">{date(r.joined_at)}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t('users.title')} description={t('users.description')} icon={<UsersIcon className="w-5 h-5" />} />

      {/* Product Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-800 overflow-x-auto pb-1">
        {[
          { key: 'all', label: t('common.all') },
          { key: 'dawaty', label: t('nav.dawaty') },
          { key: 'digital_menu', label: t('nav.digital_menu') },
          { key: 'cv_maker', label: t('nav.cv_maker') },
          { key: 'qr_me', label: t('nav.qr_me') },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setSelectedProduct(tab.key as any); setPage(1); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedProduct === tab.key
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar: Search, Status Filter, Add User, Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('users.search_placeholder')}
              className="input pl-9 w-full"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value as any); setPage(1); }}
            className="input text-xs bg-ink-900 border-ink-700 py-2"
          >
            <option value="all">{t('common.all')}</option>
            <option value="active">{t('users.status_active')}</option>
            <option value="suspended">{t('users.status_suspended')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <Plus className="w-4 h-4" />
            <span>{t('users.add_user')}</span>
          </button>

          <button
            onClick={handleExportUsers}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-ink-900 hover:bg-ink-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-soft transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{locale === 'ar' ? 'تصدير إلى Excel (CSV)' : 'Export to Excel (CSV)'}</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={results}
        loading={loading}
        onRowClick={handleRowClick}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle={query ? t('users.empty_title') : (locale === 'ar' ? 'ابدأ البحث' : 'Start searching')}
        emptyMessage={query ? t('users.empty_desc') : (locale === 'ar' ? 'اكتب اسماً أو بريداً للبحث في كافة المنتجات.' : 'Type a name or email to search across all products.')}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selected?.name ?? 'User'} subtitle={selected?.email}>
        {selected && (
          <UserDetail 
            user={selected} 
            onUpdated={handleUserUpdated}
            onToggleStatus={() => handleToggleStatus(selected)}
            onDelete={() => handleDeleteUser(selected)}
          />
        )}
      </Drawer>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl border border-ink-700">
            <div className="flex items-center justify-between pb-3 border-b border-ink-800">
              <h3 className="text-base font-bold text-ink-50 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                <span>{t('users.add_user')}</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-ink-400 hover:text-ink-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">{t('users.th_name')} *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Ahmed Ali"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+201012345678"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">{t('users.target_app')}</label>
                  <select
                    value={addForm.product}
                    onChange={e => setAddForm({ ...addForm, product: e.target.value as Product })}
                    className="input w-full text-xs bg-ink-950"
                  >
                    <option value="dawaty">{t('nav.dawaty')}</option>
                    <option value="digital_menu">{t('nav.digital_menu')}</option>
                    <option value="cv_maker">{t('nav.cv_maker')}</option>
                    <option value="qr_me">{t('nav.qr_me')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-300 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                    className="input w-full text-xs bg-ink-950"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-ink-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-ink-400 hover:text-ink-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{creating ? t('common.saving') : t('users.add_user')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetail({ 
  user, 
  onUpdated, 
  onToggleStatus, 
  onDelete 
}: { 
  user: UserSearchResult; 
  onUpdated: (u: Partial<UserSearchResult>) => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
}) {
  const { t, locale } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonationModal, setImpersonationModal] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    status: user.status || 'active',
  });

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      status: user.status || 'active',
    });
    setIsEditing(false);
    setSuccessMsg('');
    setImpersonationModal(null);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
      };
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      await api.users.update(user.id, payload);
      onUpdated({ name: formData.name, email: formData.email, status: formData.status });
      setSuccessMsg(locale === 'ar' ? 'تم تحديث المستخدم بنجاح!' : 'User updated successfully!');
      setIsEditing(false);
    } catch {
      alert(locale === 'ar' ? 'فشل تحديث المستخدم. يرجى المحاولة ثانية.' : 'Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await api.users.impersonate(user.id);
      setImpersonationModal(res.data);
    } catch {
      alert(locale === 'ar' ? 'فشل إنشاء جلسة تسجيل الدخول لهذا المستخدم.' : 'Failed to generate impersonation token for this user.');
    } finally {
      setImpersonating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const isSuspended = (user.status || 'active') === 'suspended';

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white shadow-soft">
            {user.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink-100">{user.name}</p>
              <span className={`text-3xs px-2 py-0.5 rounded-full font-semibold ${
                !isSuspended ? 'bg-emerald-500/15 text-emerald-300' : 'bg-danger-500/15 text-danger-300'
              }`}>
                {!isSuspended ? t('users.status_active') : t('users.status_suspended')}
              </span>
            </div>
            <p className="text-xs text-ink-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition disabled:opacity-50"
            title={locale === 'ar' ? 'دخول كالمستخدم' : 'Login as this user'}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{impersonating ? (locale === 'ar' ? 'جاري الاتصال...' : 'Connecting...') : (locale === 'ar' ? 'دخول' : 'Login')}</span>
          </button>

          {onToggleStatus && (
            <button
              onClick={onToggleStatus}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                !isSuspended 
                  ? 'bg-ink-800 text-ink-300 hover:text-amber-300 border-ink-700 hover:border-amber-500/40' 
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
              title={!isSuspended ? t('users.suspend_user') : t('users.activate_user')}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{!isSuspended ? t('users.suspend_user') : t('users.activate_user')}</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white transition"
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? t('common.cancel') : t('common.edit')}</span>
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-danger-500/15 text-danger-300 border border-danger-500/30 hover:bg-danger-500/25 transition"
              title={t('users.delete_user')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Impersonation Bridge Modal / Panel */}
      {impersonationModal && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <LogIn className="w-4 h-4" /> {locale === 'ar' ? 'جلسة تقمص نشطة للمستخدم' : 'Impersonation Active'}
            </span>
            <button onClick={() => setImpersonationModal(null)} className="text-ink-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xs text-ink-300">
            {locale === 'ar' ? 'تم تسجيل الدخول بنجاح بحساب' : 'You are authenticated as'} <strong>{impersonationModal.user?.name}</strong> ({impersonationModal.user?.email}).
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            {locale === 'ar' ? 'تعديل الملف الشخصي والبيانات' : 'Edit Profile & Credentials'}
          </h4>
          <div>
            <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">{locale === 'ar' ? 'حالة الحساب' : 'Account Status'}</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="input w-full text-xs bg-ink-950"
            >
              <option value="active">{locale === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="suspended">{locale === 'ar' ? 'معلق' : 'Suspended'}</option>
              <option value="banned">{locale === 'ar' ? 'محظور' : 'Banned'}</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1 flex items-center gap-1">
              <Key className="w-3 h-3 text-warning-400" /> {locale === 'ar' ? 'إعادة تعيين كلمة المرور (اتركه فارغاً للإبقاء على الحالية)' : 'Reset Password (leave blank to keep current)'}
            </label>
            <input
              type="password"
              placeholder={locale === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="input w-full text-xs"
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-2">{locale === 'ar' ? 'المنتجات' : 'Products'}</h4>
        <div className="flex flex-wrap gap-2">{user.products.map(p => <ProductBadge key={p} product={p} />)}</div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">{locale === 'ar' ? 'سجل المدفوعات' : 'Payment History'}</h4>
        {user.payments.length === 0 ? (
          <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-4">
            <EmptyState
              icon={<Wallet className="w-5 h-5" />}
              title={locale === 'ar' ? 'لا توجد دفعات' : 'No payments'}
              message={locale === 'ar' ? 'لا يوجد سجل مدفوعات لهذا المستخدم.' : 'This user has no payment history.'}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {user.payments.map(p => (
              <div key={p.id} className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-ink-100">{p.reference_id}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-400">{p.method} · {date(p.created_at)}</span>
                  <span className="text-sm font-semibold text-ink-100 tabular-nums">{egp(p.submitted_amount)}</span>
                </div>
                {p.reject_reason && <p className="text-xs text-danger-400 mt-1.5">{p.reject_reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">{locale === 'ar' ? 'سجل النشاط' : 'Activity Timeline'}</h4>
        <div className="space-y-3">
          {user.activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-ink-200">{a.message}</p>
                <p className="text-2xs text-ink-500 mt-0.5">{timeAgo(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
