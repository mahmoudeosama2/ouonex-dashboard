import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Edit3, Trash2, Power, CheckCircle2, AlertTriangle,
  X, Save, Key, Mail, Phone, Lock, FileSpreadsheet, LogIn, Check, Copy, ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import type { UserSearchResult, Product } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { KPICard } from '@/components/KPICard';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { date, timeAgo } from '@/lib/format';
import { exportToCsv } from '@/lib/exportCsv';

interface Props {
  product: Product;
  productNameAr: string;
  productNameEn: string;
  icon?: React.ReactNode;
}

export function AppUsersManager({ product, productNameAr, productNameEn, icon }: Props) {
  const { t, locale } = useLocale();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserSearchResult | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserSearchResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Add User Form
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'suspended',
  });

  // Edit User Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'suspended',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.users.search(query, page, product, statusFilter === 'all' ? undefined : statusFilter);
      setUsers(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to load app users:', err);
    } finally {
      setLoading(false);
    }
  }, [query, page, product, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error(locale === 'ar' ? 'بيانات ناقصة' : 'Missing fields', locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await api.users.create({
        ...newUserData,
        product,
      });
      toast.success(
        locale === 'ar' ? 'تمت الإضافة بنجاح' : 'User created',
        locale === 'ar' ? `تم إضافة المستخدم إلى ${productNameAr}` : `User added to ${productNameEn}`
      );
      setAddModalOpen(false);
      setNewUserData({ name: '', email: '', phone: '', password: '', status: 'active' });
      loadUsers();
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل الإنشاء' : 'Creation failed', String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        status: editFormData.status,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      await api.users.update(editUser.id, payload);
      toast.success(
        locale === 'ar' ? 'تم التحديث' : 'User updated',
        locale === 'ar' ? 'تم حفظ تعديلات المستخدم بنجاح' : 'User changes saved successfully'
      );
      setEditUser(null);
      loadUsers();
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل التعديل' : 'Update failed', String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: UserSearchResult) => {
    const currentStatus = u.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.users.toggleStatus(u.id, nextStatus);
      toast.success(
        locale === 'ar' ? (nextStatus === 'active' ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب') : `Account ${nextStatus}`,
        locale === 'ar' ? `تم تغيير حالة حساب ${u.name}` : `Status updated for ${u.name}`
      );
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: nextStatus } : item));
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل تغيير الحالة' : 'Status change failed', String(err));
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await api.users.delete(deleteUser.id);
      toast.success(
        locale === 'ar' ? 'تم الحذف بنجاح' : 'User deleted',
        locale === 'ar' ? `تم حذف حساب ${deleteUser.name}` : `Account deleted for ${deleteUser.name}`
      );
      setDeleteUser(null);
      loadUsers();
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل الحذف' : 'Delete failed', String(err));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserSearchResult) => {
    setEditUser(u);
    setEditFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      status: (u.status || 'active') as 'active' | 'suspended',
    });
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Payments', 'Joined Date'];
    const data = users.map(u => [
      u.id,
      u.name,
      u.email,
      u.phone || '—',
      u.status || 'active',
      u.payment_count,
      date(u.joined_at),
    ]);
    exportToCsv(`${product}_users`, headers, data);
  };

  const columns: Column<UserSearchResult>[] = [
    {
      key: 'name',
      header: t('users.th_name'),
      sortValue: r => r.name,
      render: r => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-ink-100 text-xs">{r.name}</p>
            <p className="text-3xs text-ink-400 font-mono">{r.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: locale === 'ar' ? 'بيانات الاتصال' : 'Contact',
      render: r => (
        <div className="space-y-0.5 text-xs">
          <p className="text-ink-300 flex items-center gap-1"><Mail className="w-3 h-3 text-ink-500" /> {r.email}</p>
          {r.phone && <p className="text-ink-400 flex items-center gap-1 text-2xs"><Phone className="w-3 h-3 text-ink-500" /> {r.phone}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'center',
      render: r => {
        const isActive = (r.status || 'active') === 'active';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'موقوف' : 'Suspended')}
          </span>
        );
      },
    },
    {
      key: 'joined',
      header: t('users.th_joined'),
      align: 'center',
      sortValue: r => r.joined_at,
      render: r => <span className="text-xs text-ink-400">{date(r.joined_at)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'end',
      render: r => {
        const isActive = (r.status || 'active') === 'active';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleToggleStatus(r)}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition ${
                isActive
                  ? 'bg-ink-900 hover:bg-rose-500/20 text-ink-400 hover:text-rose-400 border-ink-800 hover:border-rose-500/30'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
              }`}
              title={isActive ? (locale === 'ar' ? 'إيقاف الحساب' : 'Suspend') : (locale === 'ar' ? 'تفعيل الحساب' : 'Activate')}
            >
              <Power className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => openEdit(r)}
              className="p-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-ink-300 hover:text-white border border-ink-800 transition"
              title={locale === 'ar' ? 'تعديل البيانات' : 'Edit'}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setDeleteUser(r)}
              className="p-1.5 rounded-lg bg-ink-900 hover:bg-rose-500/20 text-ink-400 hover:text-rose-400 border border-ink-800 hover:border-rose-500/30 transition"
              title={locale === 'ar' ? 'حذف الحساب' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top KPIs for this App's Users */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label={locale === 'ar' ? `إجمالي مستخدمي ${productNameAr}` : `Total ${productNameEn} Users`}
          value={total}
          format="num"
          icon={icon || <Users className="w-4 h-4" />}
        />
        <KPICard
          label={locale === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
          value={activeCount}
          format="num"
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label={locale === 'ar' ? 'الحسابات الموقوفة' : 'Suspended Users'}
          value={suspendedCount}
          format="num"
          icon={<AlertTriangle className="w-4 h-4" />}
          accent="warning"
        />
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-ink-900/60 border border-ink-800/80">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={locale === 'ar' ? `بحث في مستخدمي ${productNameAr}...` : `Search ${productNameEn} users...`}
              className="input pl-9 w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-950 border border-ink-800 text-xs">
            {[
              { id: 'all', ar: 'الكل', en: 'All' },
              { id: 'active', ar: 'النشطين', en: 'Active' },
              { id: 'suspended', ar: 'الموقوفين', en: 'Suspended' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id as any); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-2xs font-medium transition ${
                  statusFilter === tab.id
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {locale === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-ink-950 text-emerald-400 border border-emerald-500/30 hover:bg-ink-900 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'تصدير' : 'Export'}</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
          </button>
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle={locale === 'ar' ? `لا يوجد مستخدمون في ${productNameAr}` : `No ${productNameEn} users found`}
        emptyMessage={locale === 'ar' ? 'يمكنك إضافة مستخدم جديد بالضغط على زر الإضافة أعلاه.' : 'You can add a new user using the button above.'}
      />

      {/* ── Modal: Add New User ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md bg-ink-950 border border-ink-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-ink-800 bg-ink-900/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-bold text-ink-50">
                  {locale === 'ar' ? `إضافة مستخدم جديد إلى ${productNameAr}` : `Add New User to ${productNameEn}`}
                </h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-ink-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder={locale === 'ar' ? 'أحمد محمد' : 'John Doe'}
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newUserData.phone}
                  onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })}
                  placeholder="+20 100 000 0000"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'كلمة المرور *' : 'Password *'}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserData.password}
                  onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'حالة الحساب الأولية' : 'Initial Status'}
                </label>
                <select
                  value={newUserData.status}
                  onChange={e => setNewUserData({ ...newUserData, status: e.target.value as any })}
                  className="input w-full text-xs bg-ink-950"
                >
                  <option value="active">{locale === 'ar' ? 'نشط (مفعل)' : 'Active'}</option>
                  <option value="suspended">{locale === 'ar' ? 'معلق (موقوف)' : 'Suspended'}</option>
                </select>
              </div>

              <div className="pt-3 border-t border-ink-800/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? t('common.saving') : (locale === 'ar' ? 'حفظ وإنشاء' : 'Save & Create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit User ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md bg-ink-950 border border-ink-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-ink-800 bg-ink-900/50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-400" />
                <h3 className="text-sm font-bold text-ink-50">
                  {locale === 'ar' ? `تعديل حساب: ${editUser.name}` : `Edit User: ${editUser.name}`}
                </h3>
              </div>
              <button onClick={() => setEditUser(null)} className="text-ink-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-warning-400" />
                  <span>{t('users.password_hint')}</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editFormData.password}
                  onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'حالة الحساب' : 'Account Status'}
                </label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="input w-full text-xs bg-ink-950"
                >
                  <option value="active">{locale === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="suspended">{locale === 'ar' ? 'معلق (موقوف)' : 'Suspended'}</option>
                </select>
              </div>

              <div className="pt-3 border-t border-ink-800/80 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? t('common.saving') : t('common.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete User Confirmation ── */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm bg-ink-950 border border-rose-500/30 shadow-2xl rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-50">{t('users.delete_user')}</h3>
                <p className="text-xs text-ink-400">{deleteUser.name} ({deleteUser.email})</p>
              </div>
            </div>

            <p className="text-xs text-ink-300 leading-relaxed">
              {t('users.confirm_delete')}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50"
              >
                {saving ? t('common.saving') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
