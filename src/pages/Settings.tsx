import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Settings as SettingsIcon, Users, ScrollText, Activity, ShieldCheck,
  CheckCircle2, XCircle, Crown, Lock, Save, Loader2, Bell, Globe, Building,
  FileText, QrCode, Zap, AlertTriangle, Smartphone, Tag, Rocket, UtensilsCrossed,
  UserPlus, Edit2, Trash2, Mail, Phone, Key, Check, CheckSquare, Square, Store, X, Search, Shield,
  Cpu, HardDrive, Database, Server, RefreshCw, Gauge,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { TeamMember, AuditLogEntry, HealthIndicator, Role, ServerMetrics } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { CardSkeleton } from '@/components/Skeleton';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { ROLES, ALL_PAGES, ALL_APPS, PAGE_ACCESS, type PageKey } from '@/lib/rbac';
import { dateTime, timeAgo, formatHealthName, formatProductLabel } from '@/lib/format';
import { useLocale } from '@/context/LocaleContext';


type SubTab = 'team' | 'audit' | 'health' | 'general';

export function Settings() {
  const { t } = useLocale();
  const { canManageTeam } = useRole();
  const toast = useToast();
  const [tab, setTab] = useState<SubTab>('general');

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        description={t('settings.description')}
        icon={<SettingsIcon className="w-5 h-5" />}
      />

      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'general', label: t('settings.tab_general'), icon: <SettingsIcon className="w-3.5 h-3.5" /> },
          { key: 'team', label: t('settings.tab_team'), icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'audit', label: t('settings.tab_audit'), icon: <ScrollText className="w-3.5 h-3.5" /> },
          { key: 'health', label: t('settings.tab_health'), icon: <Activity className="w-3.5 h-3.5" /> },
        ] as const).map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tabItem.key ? 'border-brand-500 text-brand-300' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'team' && <TeamTab canManage={canManageTeam} />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'health' && <HealthTab />}
    </div>
  );
}

function TeamTab({ canManage }: { canManage: boolean }) {
  const { t, locale } = useLocale();
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
    status: 'active' | 'inactive';
    assigned_apps: string[];
    permissions: PageKey[];
  }>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee',
    status: 'active',
    assigned_apps: ['digital_menu'],
    permissions: ['overview', 'digital_menu', 'users'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.team.list();
      setMembers(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee',
      status: 'active',
      assigned_apps: ['digital_menu'],
      permissions: ['overview', 'digital_menu', 'users', 'support'],
    });
    setModalOpen(true);
  };

  const openEditModal = (m: TeamMember) => {
    setModalMode('edit');
    setEditingId(m.id);
    setFormError(null);
    setFormData({
      name: m.name,
      email: m.email,
      phone: m.phone || '',
      password: '',
      role: m.role,
      status: m.status || 'active',
      assigned_apps: Array.isArray(m.assigned_apps) ? m.assigned_apps : [],
      permissions: Array.isArray(m.permissions) ? (m.permissions as PageKey[]) : (PAGE_ACCESS[m.role] || ['overview']),
    });
    setModalOpen(true);
  };

  const handleApplyRoleDefaults = (role: Role) => {
    const defaultPages = (PAGE_ACCESS[role] || ['overview']) as PageKey[];
    const defaultPagesStr = defaultPages as string[];
    const defaultApps: string[] = [];
    if (defaultPagesStr.includes('digital_menu')) defaultApps.push('digital_menu');
    if (defaultPagesStr.includes('dawety')) defaultApps.push('dawety');
    if (defaultPagesStr.includes('cv_maker')) defaultApps.push('cv_maker');
    if (defaultPagesStr.includes('qr_me')) defaultApps.push('qr_me');

    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPages,
      assigned_apps: defaultApps.length > 0 ? defaultApps : prev.assigned_apps,
    }));
  };

  const toggleApp = (appId: string) => {
    setFormData(prev => {
      const exists = prev.assigned_apps.includes(appId);
      const nextApps = exists ? prev.assigned_apps.filter(a => a !== appId) : [...prev.assigned_apps, appId];
      // If toggled ON, ensure corresponding page is in permissions
      let nextPerms = [...prev.permissions];
      if (!exists && (appId === 'digital_menu' || appId === 'dawety' || appId === 'cv_maker' || appId === 'qr_me')) {
        if (!nextPerms.includes(appId as PageKey)) {
          nextPerms.push(appId as PageKey);
        }
      }
      return { ...prev, assigned_apps: nextApps, permissions: nextPerms };
    });
  };

  const togglePermission = (pageKey: PageKey) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(pageKey);
      const next = exists ? prev.permissions.filter(p => p !== pageKey) : [...prev.permissions, pageKey];
      return { ...prev, permissions: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError(locale === 'ar' ? 'يرجى إدخال الاسم والبريد الإلكتروني.' : 'Name and Email are required.');
      return;
    }

    if (modalMode === 'create' && (!formData.password || formData.password.length < 6)) {
      setFormError(locale === 'ar' ? 'كلمة المرور مطلوبة وتكون 6 أحرف على الأقل.' : 'Password is required (min 6 characters).');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await api.team.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          role: formData.role,
          assigned_apps: formData.assigned_apps,
          permissions: formData.permissions,
        });
        toast.success(
          locale === 'ar' ? 'تمت إضافة الموظف بنجاح' : 'Team Member Created',
          formData.name
        );
        setModalOpen(false);
        load();
      } else if (editingId) {
        const payload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          status: formData.status,
          assigned_apps: formData.assigned_apps,
          permissions: formData.permissions,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await api.team.update(editingId, payload);
        toast.success(
          locale === 'ar' ? 'تم تحديث بيانات وصلاحيات الموظف' : 'Team Member Updated',
          formData.name
        );
        setModalOpen(false);
        load();
      }
    } catch (err: any) {
      setFormError(err?.message || (locale === 'ar' ? 'حدث خطأ أثناء حفظ البيانات.' : 'Failed to save team member.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: TeamMember) => {
    if (m.role === 'owner') {
      alert(locale === 'ar' ? 'لا يمكن حذف حساب المالك الرئيسي.' : 'Cannot delete the primary owner account.');
      return;
    }
    const confirmed = window.confirm(
      locale === 'ar'
        ? `هل أنت متأكد من رغبتك في حذف حساب "${m.name}"؟ سيتم إلغاء تعيين أي مطاعم أو عملاء منسوبين إليه وإعادتهم للمالك.`
        : `Are you sure you want to delete "${m.name}"? Any assigned restaurants or clients will be reverted to the unassigned pool.`
    );
    if (!confirmed) return;

    try {
      await api.team.delete(m.id);
      toast.success(
        locale === 'ar' ? 'تم حذف الحساب' : 'Member Deleted',
        m.name
      );
      setMembers(prev => prev.filter(x => x.id !== m.id));
    } catch (err: any) {
      toast.error('Error', err?.message || (locale === 'ar' ? 'فشل حذف الحساب.' : 'Failed to delete member.'));
    }
  };

  const roleLabel = (r: Role) => ROLES.find(x => x.id === r)?.label ?? r;

  const filteredMembers = members.filter(m => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (error) return <ErrorState message={locale === 'ar' ? 'فشل تحميل بيانات فريق العمل.' : 'Failed to load team members.'} onRetry={load} />;
  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-ink-300">
            {locale === 'ar' ? `${members.length} عضو في فريق العمل` : `${members.length} team members`}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                className="input text-xs pl-8 pr-3 py-1.5 w-44 sm:w-56"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input text-xs py-1.5 px-2 bg-ink-950 text-ink-300"
            >
              <option value="all">{locale === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {canManage ? (
          <button
            onClick={openCreateModal}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-md shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة موظف جديد' : 'Add Employee'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-ink-400 px-3 py-2 rounded-lg bg-ink-800/60">
            <Lock className="w-3.5 h-3.5" />
            <span>{locale === 'ar' ? 'فقط المالك يمكنه إدارة الفريق والصلاحيات' : 'Only the Owner can manage team'}</span>
          </div>
        )}
      </div>

      {/* Team Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          title={locale === 'ar' ? 'لا يوجد أعضاء مطابقين' : 'No team members found'}
          message={locale === 'ar' ? 'جرب البحث بكلمة أخرى أو أضف موظفاً جديداً.' : 'Try a different search term or add an employee.'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMembers.map(m => {
            const isOwner = m.role === 'owner';
            const isActive = (m.status || 'active') === 'active';
            const apps = Array.isArray(m.assigned_apps) ? m.assigned_apps : [];
            const perms = Array.isArray(m.permissions) ? m.permissions : [];

            return (
              <div key={m.id} className="card card-hover p-4 flex flex-col justify-between gap-3 border border-ink-800 hover:border-ink-700 transition">
                <div>
                  {/* Top Row: Avatar, Name, Email, Status, Role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: m.avatar_color || '#4f46e5' }}
                      >
                        {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-ink-100 truncate">{m.name}</p>
                          {isOwner && (
                            <span title="Primary Owner">
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-ink-500 shrink-0" />
                          <span>{m.email}</span>
                        </p>
                        {m.phone && (
                          <p className="text-3xs text-ink-500 truncate flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-ink-500 shrink-0" />
                            <span>{m.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`badge text-2xs font-semibold ${
                        m.role === 'owner' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        m.role === 'admin' ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' :
                        m.role === 'sales' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        m.role === 'support' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                        m.role === 'finance' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                        'bg-ink-500/15 text-ink-300 border border-ink-600/40'
                      }`}>
                        {roleLabel(m.role)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-3xs font-medium ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-danger-400'}`} />
                        {isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'معطل' : 'Inactive')}
                      </span>
                    </div>
                  </div>

                  {/* Mid Row: Client Scopes & Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ink-800/60">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-950/60 border border-ink-800/80">
                      <Store className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-3xs text-ink-400 uppercase font-semibold">{locale === 'ar' ? 'المطاعم المخصصة' : 'Assigned Restaurants'}</p>
                        <p className="text-xs font-bold text-ink-100 tabular-nums">
                          {isOwner ? (locale === 'ar' ? 'الكل (مالك)' : 'All (Owner)') : `${m.assigned_restaurants_count || 0}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-950/60 border border-ink-800/80">
                      <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-3xs text-ink-400 uppercase font-semibold">{locale === 'ar' ? 'العملاء المخصصون' : 'Assigned Clients'}</p>
                        <p className="text-xs font-bold text-ink-100 tabular-nums">
                          {isOwner ? (locale === 'ar' ? 'الكل (مالك)' : 'All (Owner)') : `${m.assigned_users_count || 0}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Apps & Permissions preview */}
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-3xs text-ink-400">
                      <span>{locale === 'ar' ? 'التطبيقات المصرح بها:' : 'Assigned Apps:'}</span>
                      <span className="text-ink-300 font-medium">
                        {isOwner ? (locale === 'ar' ? 'كافة التطبيقات' : 'All Apps') : (apps.length > 0 ? `${apps.length} تطبيقات` : (locale === 'ar' ? 'لا يوجد' : 'None'))}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {isOwner ? (
                        <span className="badge text-3xs bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {locale === 'ar' ? 'وصول شامل لجميع الأنظمة' : 'Full Unrestricted Access'}
                        </span>
                      ) : apps.length > 0 ? (
                        apps.map(appId => {
                          const appObj = ALL_APPS.find(a => a.id === appId);
                          return (
                            <span key={appId} className="badge text-3xs bg-ink-800 text-ink-200 border border-ink-700">
                              {appObj?.name || appId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-3xs text-ink-500 italic">{locale === 'ar' ? 'لم يتم ربط أي تطبيقات' : 'No apps assigned'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-ink-800/60 mt-1">
                  <span className="text-3xs text-ink-500">
                    {m.last_active ? `${locale === 'ar' ? 'آخر نشاط' : 'Active'} ${timeAgo(m.last_active, locale)}` : ''}
                  </span>

                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(m)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg text-ink-200 hover:text-white bg-ink-800 hover:bg-ink-700 border border-ink-700 transition flex items-center gap-1"
                        title={locale === 'ar' ? 'تعديل البيانات والصلاحيات' : 'Edit details & permissions'}
                      >
                        <Edit2 className="w-3 h-3 text-brand-400" />
                        <span>{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {!isOwner && (
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 text-ink-400 hover:text-danger-400 hover:bg-danger-500/10 rounded-lg transition"
                          title={locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Team Member */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-ink-700 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-ink-800">
              <h3 className="text-base font-bold text-ink-50 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-400" />
                <span>
                  {modalMode === 'create'
                    ? (locale === 'ar' ? 'إضافة موظف جديد وتحديد صلاحياته' : 'Add Employee & Assign Permissions')
                    : (locale === 'ar' ? 'تعديل بيانات وصلاحيات الموظف' : 'Edit Employee & Permissions')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-ink-400 hover:text-ink-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/25 text-danger-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'البيانات الشخصية وبيانات الدخول' : 'Personal & Login Credentials'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-ink-300 mb-1">
                      {locale === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Mostafa Mahmoud"
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
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@ouonex.com"
                      className="input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-ink-300 mb-1">
                      {locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+2010..."
                      className="input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-ink-300 mb-1">
                      {modalMode === 'create'
                        ? (locale === 'ar' ? 'كلمة المرور * (للدخول للداش بورد والتطبيق)' : 'Password * (for Dashboard & Apps)')
                        : (locale === 'ar' ? 'كلمة مرور جديدة (اتركه فارغاً للإبقاء على الحالية)' : 'New Password (leave empty to keep current)')}
                    </label>
                    <input
                      type="password"
                      required={modalMode === 'create'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder={modalMode === 'create' ? '••••••••' : (locale === 'ar' ? 'بدون تغيير' : 'Unchanged')}
                      className="input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-ink-300 mb-1">
                      {locale === 'ar' ? 'الدور الوظيفي' : 'Role'}
                    </label>
                    <select
                      value={formData.role}
                      onChange={e => {
                        const nextRole = e.target.value as Role;
                        setFormData({ ...formData, role: nextRole });
                        handleApplyRoleDefaults(nextRole);
                      }}
                      className="input w-full text-xs bg-ink-950"
                    >
                      <option value="employee">{locale === 'ar' ? 'موظف تشغيل (Employee)' : 'Employee (Operations)'}</option>
                      <option value="sales">{locale === 'ar' ? 'مسؤول مبيعات وعملاء (Sales)' : 'Sales & Clients'}</option>
                      <option value="support">{locale === 'ar' ? 'دعم فني وطلبات (Support)' : 'Support Specialist'}</option>
                      <option value="finance">{locale === 'ar' ? 'مالية ومدفوعات (Finance)' : 'Finance Manager'}</option>
                      <option value="admin">{locale === 'ar' ? 'مدير عام (Admin)' : 'General Administrator'}</option>
                    </select>
                  </div>

                  {modalMode === 'edit' && (
                    <div>
                      <label className="block text-2xs font-semibold text-ink-300 mb-1">
                        {locale === 'ar' ? 'حالة الحساب' : 'Account Status'}
                      </label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="input w-full text-xs bg-ink-950"
                      >
                        <option value="active">{locale === 'ar' ? 'نشط (مسموح بالدخول)' : 'Active (Login allowed)'}</option>
                        <option value="inactive">{locale === 'ar' ? 'معطل (موقوف مؤقتاً)' : 'Inactive (Suspended)'}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Apps Section */}
              <div className="space-y-2.5 pt-3 border-t border-ink-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'التطبيقات المسموح للموظف بإدارتها' : 'Permitted Applications'}</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assigned_apps: ALL_APPS.map(a => a.id) }))}
                      className="text-3xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      {locale === 'ar' ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-ink-600">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assigned_apps: [] }))}
                      className="text-3xs text-ink-400 hover:text-ink-200"
                    >
                      {locale === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_APPS.map(app => {
                    const isChecked = formData.assigned_apps.includes(app.id);
                    return (
                      <div
                        key={app.id}
                        onClick={() => toggleApp(app.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-200'
                            : 'bg-ink-950/50 border-ink-800/80 text-ink-400 hover:bg-ink-900/60'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-brand-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-ink-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium">{app.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dashboard Pages Permissions Section */}
              <div className="space-y-2.5 pt-3 border-t border-ink-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>{locale === 'ar' ? 'صفحات الداش بورد المصرح بفتحها' : 'Allowed Dashboard Pages'}</span>
                    </h4>
                    <p className="text-3xs text-ink-400 mt-0.5">
                      {locale === 'ar'
                        ? 'الموظف سيرى فقط الصفحات المحددة في القائمة الجانبية ولن يتمكن من فتح غيرها.'
                        : 'Staff will only see these pages in the navigation sidebar.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: ALL_PAGES.map(p => p.key) }))}
                      className="text-3xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      {locale === 'ar' ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-ink-600">|</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: ['overview'] }))}
                      className="text-3xs text-ink-400 hover:text-ink-200"
                    >
                      {locale === 'ar' ? 'الافتراضي فقط' : 'Overview only'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_PAGES.map(page => {
                    const isChecked = formData.permissions.includes(page.key);
                    return (
                      <div
                        key={page.key}
                        onClick={() => togglePermission(page.key)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-200 font-semibold'
                            : 'bg-ink-950/40 border-ink-800/80 text-ink-400 hover:bg-ink-900/40'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-ink-600 shrink-0" />
                        )}
                        <span className="text-xs truncate">
                          {locale === 'ar' ? page.labelAr : page.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-ink-300 hover:bg-ink-800 transition"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-1.5 py-2 px-5 shadow-lg shadow-brand-500/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{modalMode === 'create' ? (locale === 'ar' ? 'إنشاء حساب الموظف' : 'Create Account') : (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function AuditTab() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.audit.list({ page, per_page: 15 });
      setEntries(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message="Failed to load audit log." onRetry={load} />;

  const columns: Column<AuditLogEntry>[] = [
    { key: 'action', header: 'Action', sortValue: r => r.action, render: r => (
      <span className={`badge ${r.action === 'approve' ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
        {r.action === 'approve' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {r.action === 'approve' ? 'Approved' : 'Rejected'}
      </span>
    ) },
    { key: 'entity', header: 'Entity', render: r => <span className="text-xs text-ink-300">{r.entity}</span> },
    { key: 'entity_id', header: 'ID', render: r => <span className="font-mono text-xs text-ink-400">{r.entity_id}</span> },
    { key: 'actor', header: 'Actor', sortValue: r => r.actor, render: r => (
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-ink-400" />
        <span className="text-sm text-ink-200">{r.actor}</span>
      </div>
    ) },
    { key: 'change', header: 'Change', render: r => (
      <span className="text-xs">
        <span className="text-ink-400">{r.before}</span>
        <span className="text-ink-500 mx-1">→</span>
        <span className={r.after === 'paid' ? 'text-success-400' : 'text-danger-400'}>{r.after}</span>
      </span>
    ) },
    { key: 'reason', header: 'Reason', render: r => r.reason ? <span className="text-xs text-ink-400 max-w-[200px] truncate block" title={r.reason}>{r.reason}</span> : <span className="text-ink-500">—</span> },
    { key: 'at', header: 'When', sortValue: r => r.at, render: r => <span className="text-xs text-ink-400">{dateTime(r.at)}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries}
      loading={loading}
      page={page}
      perPage={15}
      total={total}
      onPageChange={setPage}
      emptyTitle="No audit entries"
      emptyMessage="Audit log is empty."
    />
  );
}

function HealthTab() {
  const { t, locale, isRTL } = useLocale();
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.system.serverMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
      setSecondsAgo(0);
      setError(false);
    } catch (err) {
      console.error('Failed to fetch server metrics:', err);
      if (!metrics) setError(true);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [metrics]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  useEffect(() => {
    if (!lastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  if (error && !metrics) {
    return <ErrorState message={isRTL ? "تعذر الاتصال بمركز القياسات الحية للخادم." : "Failed to load live server telemetry."} onRetry={() => loadData(true)} />;
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const stressColor = 
    metrics?.stress_level === 'critical' ? 'text-danger-400 bg-danger-500/15 border-danger-500/30' :
    metrics?.stress_level === 'moderate' ? 'text-warning-400 bg-warning-500/15 border-warning-500/30' :
    'text-success-400 bg-success-500/15 border-success-500/30';

  const stressBarColor = 
    metrics?.stress_level === 'critical' ? 'bg-danger-500' :
    metrics?.stress_level === 'moderate' ? 'bg-warning-500' :
    'bg-success-500';

  const getUsageColor = (pct: number) => {
    if (pct >= 85) return { text: 'text-danger-400', bar: 'bg-danger-500', track: 'bg-danger-500/20' };
    if (pct >= 65) return { text: 'text-warning-400', bar: 'bg-warning-500', track: 'bg-warning-500/20' };
    return { text: 'text-emerald-400', bar: 'bg-emerald-500', track: 'bg-ink-800' };
  };

  const cpuColor = getUsageColor(metrics?.cpu.usage_percent || 0);
  const memColor = getUsageColor(metrics?.memory.usage_percent || 0);
  const diskColor = getUsageColor(metrics?.storage.usage_percent || 0);

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header Bar */}
      <div className="card p-5 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 border border-ink-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-ink-800/80 border border-ink-700/60 flex items-center justify-center text-brand-400 shadow-inner">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-ink-100">
                  {isRTL ? 'مركز مراقبة الخادم والعتاد الحي' : 'Live Server & Hardware Telemetry'}
                </h2>
                <span className={`badge px-2.5 py-0.5 text-xs font-semibold rounded-full border ${stressColor}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse mr-1" />
                  {isRTL ? metrics?.stress_status_ar : metrics?.stress_status_en}
                </span>
              </div>
              <p className="text-xs text-ink-400 mt-1 flex items-center gap-2">
                <span>{metrics?.system.os_name}</span>
                <span>•</span>
                <span>PHP {metrics?.system.php_version}</span>
                <span>•</span>
                <span>Laravel {metrics?.system.laravel_version}</span>
                <span>•</span>
                <span className="text-ink-300 font-medium">
                  {isRTL ? `جاهزية الخادم: ${metrics?.system.uptime_human}` : `Uptime: ${metrics?.system.uptime_human}`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                autoRefresh 
                  ? 'bg-brand-500/10 text-brand-300 border-brand-500/30' 
                  : 'bg-ink-900 text-ink-400 border-ink-800 hover:text-ink-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-brand-400 animate-ping' : 'bg-ink-600'}`} />
              {isRTL 
                ? (autoRefresh ? 'تحديث تلقائي: نشط (15ث)' : 'تحديث تلقائي: متوقف') 
                : (autoRefresh ? 'Auto-Refresh: ON (15s)' : 'Auto-Refresh: OFF')}
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
              title={isRTL ? 'تحديث فوري للبيانات' : 'Refresh Telemetry'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
              <span>{isRTL ? 'تحديث القياسات' : 'Refresh'}</span>
            </button>

            {lastUpdated && (
              <span className="text-2xs text-ink-500 whitespace-nowrap">
                {isRTL ? `منذ ${secondsAgo} ثانية` : `${secondsAgo}s ago`}
              </span>
            )}
          </div>
        </div>

        {/* Global Stress Score Meter */}
        <div className="mt-5 pt-4 border-t border-ink-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-400 font-medium flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-brand-400" />
              {isRTL ? 'مؤشر الضغط الكلي على موارد الخادم (Overall Stress Gauge)' : 'Overall Server Load & Stress Gauge'}
            </span>
            <span className="font-mono font-bold text-ink-100">
              {metrics?.stress_score}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-ink-950 rounded-full overflow-hidden border border-ink-800/80">
            <div 
              className={`h-full transition-all duration-700 ease-out rounded-full ${stressBarColor}`} 
              style={{ width: `${Math.min(100, Math.max(5, metrics?.stress_score || 0))}%` }}
            />
          </div>
        </div>

        {/* Diagnostic Alerts (if any) */}
        {metrics?.alerts && metrics.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {metrics.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                  alert.level === 'critical'
                    ? 'bg-danger-500/10 border-danger-500/30 text-danger-300'
                    : 'bg-warning-500/10 border-warning-500/30 text-warning-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {isRTL ? alert.message_ar : alert.message_en}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 Core Hardware Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Load Card */}
        <div className="card p-5 border border-ink-800 hover:border-ink-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-400" />
              {isRTL ? 'المعالج (CPU)' : 'CPU Compute'}
            </span>
            <span className="badge bg-ink-800/80 text-ink-300 text-2xs px-2 py-0.5 rounded">
              {metrics?.cpu.cores} {isRTL ? 'أنوية' : 'Cores'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-black font-mono tracking-tight ${cpuColor.text}`}>
              {metrics?.cpu.usage_percent}%
            </span>
            <span className="text-2xs text-ink-400 font-medium">
              {isRTL ? 'الاستهلاك الفعلي' : 'Current Usage'}
            </span>
          </div>

          <div className="w-full h-2 bg-ink-950 rounded-full overflow-hidden mb-3 border border-ink-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${cpuColor.bar}`}
              style={{ width: `${Math.min(100, metrics?.cpu.usage_percent || 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-ink-800/60 text-center">
            <div>
              <p className="text-3xs text-ink-500 uppercase">1m Load</p>
              <p className="text-xs font-mono font-semibold text-ink-200">{metrics?.cpu.load_1m}</p>
            </div>
            <div>
              <p className="text-3xs text-ink-500 uppercase">5m Load</p>
              <p className="text-xs font-mono font-semibold text-ink-200">{metrics?.cpu.load_5m}</p>
            </div>
            <div>
              <p className="text-3xs text-ink-500 uppercase">15m Load</p>
              <p className="text-xs font-mono font-semibold text-ink-200">{metrics?.cpu.load_15m}</p>
            </div>
          </div>
        </div>

        {/* RAM Memory Card */}
        <div className="card p-5 border border-ink-800 hover:border-ink-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              {isRTL ? 'الذاكرة (RAM)' : 'System Memory'}
            </span>
            <span className="badge bg-ink-800/80 text-ink-300 text-2xs px-2 py-0.5 rounded">
              {metrics?.memory.total_formatted} Total
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-black font-mono tracking-tight ${memColor.text}`}>
              {metrics?.memory.usage_percent}%
            </span>
            <span className="text-2xs text-ink-400 font-medium">
              {metrics?.memory.used_formatted} {isRTL ? 'مستخدم' : 'Used'}
            </span>
          </div>

          <div className="w-full h-2 bg-ink-950 rounded-full overflow-hidden mb-3 border border-ink-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${memColor.bar}`}
              style={{ width: `${Math.min(100, metrics?.memory.usage_percent || 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-800/60 text-xs">
            <div>
              <p className="text-3xs text-ink-500">{isRTL ? 'الذاكرة المتاحة' : 'Free Memory'}</p>
              <p className="font-mono font-medium text-ink-200">{metrics?.memory.free_formatted}</p>
            </div>
            <div>
              <p className="text-3xs text-ink-500">PHP Used / Peak</p>
              <p className="font-mono font-medium text-ink-200">
                {metrics?.memory.php_used_formatted} / {metrics?.memory.php_peak_formatted}
              </p>
            </div>
          </div>
        </div>

        {/* Storage / SSD Card */}
        <div className="card p-5 border border-ink-800 hover:border-ink-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              {isRTL ? 'مساحة القرص (SSD)' : 'Storage / Disk'}
            </span>
            <span className="badge bg-ink-800/80 text-ink-300 text-2xs px-2 py-0.5 rounded">
              {metrics?.storage.total_formatted} Total
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-black font-mono tracking-tight ${diskColor.text}`}>
              {metrics?.storage.usage_percent}%
            </span>
            <span className="text-2xs text-ink-400 font-medium">
              {metrics?.storage.used_formatted} {isRTL ? 'مشغول' : 'Used'}
            </span>
          </div>

          <div className="w-full h-2 bg-ink-950 rounded-full overflow-hidden mb-3 border border-ink-800">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${diskColor.bar}`}
              style={{ width: `${Math.min(100, metrics?.storage.usage_percent || 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-800/60 text-xs">
            <div>
              <p className="text-3xs text-ink-500">{isRTL ? 'المساحة الفارغة' : 'Free Storage'}</p>
              <p className="font-mono font-medium text-ink-200">{metrics?.storage.free_formatted}</p>
            </div>
            <div>
              <p className="text-3xs text-ink-500">{isRTL ? 'مجلد المرفقات' : 'Uploads Size'}</p>
              <p className="font-mono font-medium text-ink-200">{metrics?.storage.uploads_formatted}</p>
            </div>
          </div>
        </div>

        {/* Database Engine Card */}
        <div className="card p-5 border border-ink-800 hover:border-ink-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-ink-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              {isRTL ? 'قاعدة البيانات' : 'Database Engine'}
            </span>
            <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-2xs px-2 py-0.5 rounded uppercase font-mono font-bold">
              {metrics?.database.driver}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black font-mono tracking-tight text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {metrics?.database.ping_ms} ms
            </span>
            <span className="text-2xs text-ink-400 font-medium">
              {isRTL ? 'زمن الاستجابة (Ping)' : 'Query Latency'}
            </span>
          </div>

          <div className="w-full h-2 bg-ink-950 rounded-full overflow-hidden mb-3 border border-ink-800">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink-800/60 text-xs">
            <div>
              <p className="text-3xs text-ink-500">{isRTL ? 'الحالة الحالية' : 'Engine State'}</p>
              <p className="font-medium text-emerald-400">
                {metrics?.database.connected ? (isRTL ? 'متصل بنجاح ✓' : 'Online & Active') : 'Disconnected'}
              </p>
            </div>
            <div>
              <p className="text-3xs text-ink-500">{isRTL ? 'حجم البيانات' : 'Database Size'}</p>
              <p className="font-mono font-medium text-ink-200">{metrics?.database.size_formatted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Services & App Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            {isRTL ? 'حالة التطبيقات والخدمات السحابية المتصلة' : 'Connected Applications & Microservices Status'}
          </h3>
          <span className="text-2xs text-ink-400">
            {isRTL ? 'فحص دوري لحالة استجابة الـ API وبوابة الرسائل' : 'Live health probes for APIs & SMS Gateway'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics?.services.map(s => (
            <div key={s.id} className="card p-4.5 border border-ink-800 bg-ink-950/40 hover:bg-ink-950/70 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.reachable ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
                    {s.id === 'sms_gateway' ? <Smartphone className="w-4.5 h-4.5" /> : <Activity className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-100">
                      {isRTL && s.name_ar ? s.name_ar : s.name}
                    </p>
                    <p className="text-3xs text-ink-400 font-mono">
                      {s.id}
                    </p>
                  </div>
                </div>
                <span className={`badge text-2xs px-2 py-0.5 rounded-full ${s.reachable ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.reachable ? 'bg-success-400 animate-pulse' : 'bg-danger-400'} mr-1`} />
                  {s.reachable ? (isRTL ? 'متصل' : 'Operational') : (isRTL ? 'متوقف' : 'Offline')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-ink-900/50 rounded-lg p-2.5 border border-ink-800/80 text-xs">
                <div>
                  <p className="text-3xs text-ink-500 uppercase">{isRTL ? 'زمن الاستجابة' : 'Latency'}</p>
                  <p className="font-mono font-semibold text-ink-200">
                    {s.latency_ms} ms
                  </p>
                </div>
                <div>
                  <p className="text-3xs text-ink-500 uppercase">{isRTL ? 'آخر فحص' : 'Last Sync'}</p>
                  <p className="text-xs text-ink-300">
                    {timeAgo(s.last_sync, locale)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Server Environment & Infrastructure Specifications */}
      <div className="card p-5 border border-ink-800 bg-ink-900/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {isRTL ? 'المواصفات التقنية وبيئة التشغيل السحابية' : 'Cloud Infrastructure & Runtime Specs'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">Operating System</p>
            <p className="font-medium text-ink-200 truncate" title={metrics?.system.os_name}>
              {metrics?.system.os_family}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">PHP Engine</p>
            <p className="font-medium text-ink-200">
              v{metrics?.system.php_version}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">Framework Core</p>
            <p className="font-medium text-ink-200">
              Laravel {metrics?.system.laravel_version}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">Public IP / Host</p>
            <p className="font-mono font-medium text-ink-200">
              {metrics?.system.server_ip}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">OPcache Accelerator</p>
            <p className="font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {metrics?.system.opcache_enabled ? 'Enabled (Fast)' : 'Disabled'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-ink-950/60 border border-ink-800">
            <p className="text-3xs text-ink-500 uppercase mb-1">Memory Limit</p>
            <p className="font-mono font-medium text-ink-200">
              {metrics?.memory.php_memory_limit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  const toast = useToast();
  const { t, locale } = useLocale();
  const [form, setForm] = useState({
    dashboard_name: 'Ouonex Dashboard',
    timezone: 'Africa/Cairo',
    currency: 'EGP',
    email_notifications: true,
    auto_refresh_seconds: 30,
    global_emergency_free_mode: false,
    menu_price_monthly: 100,
    menu_price_yearly: 1000,
    menu_free_mode: false,
    dawaty_invitation_price: 150,
    dawaty_free_mode: false,
    cv_price_single: 25,
    cv_price_subscription: 120,
    cv_free_mode: false,
    qr_me_vip_price: 15,
    qr_me_free_mode: true,
    vodafone_cash_number: '01019603225',
    instapay_address: 'instapay@address',
    instapay_link: '',
    qr_me_app_store_url: '',
    qr_me_play_store_url: '',
    menu_app_store_url: '',
    menu_play_store_url: '',
    dawaty_app_store_url: '',
    dawaty_play_store_url: '',
    cv_maker_app_store_url: '',
    cv_maker_play_store_url: '',
    cv_app_store_url: '',
    cv_play_store_url: '',
    // ── Version Control per app ──
    cv_maker_latest_version: '1.0.0',
    cv_maker_min_version: '1.0.0',
    cv_maker_force_update: false,
    cv_maker_update_title_ar: 'تحديث جديد متوفر!',
    cv_maker_update_message_ar: 'يرجى التحديث للحصول على أفضل تجربة.',
    dawety_latest_version: '1.0.0',
    dawety_min_version: '1.0.0',
    dawety_force_update: false,
    dawety_update_title_ar: 'تحديث جديد متوفر!',
    dawety_update_message_ar: 'يرجى التحديث للحصول على أفضل تجربة.',
    menu_latest_version: '1.0.0',
    menu_min_version: '1.0.0',
    menu_force_update: false,
    menu_update_title_ar: 'تحديث جديد متوفر!',
    menu_update_message_ar: 'يرجى التحديث للحصول على أفضل تجربة.',
    qr_me_latest_version: '1.0.0',
    qr_me_min_version: '1.0.0',
    qr_me_force_update: false,
    qr_me_update_title_ar: 'تحديث جديد متوفر!',
    qr_me_update_message_ar: 'يرجى التحديث للحصول على أفضل تجربة.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    api.settings.get().then(res => {
      setForm(prev => ({
        ...prev,
        ...res,
        cv_maker_app_store_url: res.cv_maker_app_store_url || res.cv_app_store_url || '',
        cv_maker_play_store_url: res.cv_maker_play_store_url || res.cv_play_store_url || '',
      }));
      setLoading(false);
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 400);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const saveSettingsPayload = async (data: typeof form, showToast = false) => {
    setAutoSaveStatus('saving');
    setSaving(true);
    try {
      await api.settings.save(data);
      setAutoSaveStatus('saved');
      if (showToast) {
        toast.success(t('common.save'), 'تم تطبيق وحفظ الإعدادات تلقائياً بنجاح');
      }
      setTimeout(() => {
        setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch {
      setAutoSaveStatus('error');
      toast.error('Save failed', 'Could not save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof form, explicitValue?: any) => {
    setForm(prev => {
      const nextVal = explicitValue !== undefined ? explicitValue : !prev[key];
      const next = { ...prev, [key]: nextVal };
      saveSettingsPayload(next, true);
      return next;
    });
  };

  const updateField = (key: keyof typeof form, val: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'cv_maker_app_store_url') (next as any).cv_app_store_url = val;
      if (key === 'cv_maker_play_store_url') (next as any).cv_play_store_url = val;
      if (isLoadedRef.current) {
        setAutoSaveStatus('saving');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          saveSettingsPayload(next, false);
        }, 1000);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await saveSettingsPayload(form, true);
  };

  if (loading) {
    return <div className="text-sm text-ink-400">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Auto-save notification banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-ink-900/60 border border-ink-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-xs text-ink-300">
            الحفظ التلقائي مفعّل: تفعيل أي مفتاح أو تعديل أي قيمة يُحفظ ويُطبق فوراً دون الحاجة للنقر اليدوي.
          </span>
        </div>
        <div className="shrink-0">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الحفظ...</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-success-400 bg-success-500/10 px-3 py-1 rounded-full border border-success-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم الحفظ تلقائياً ✓</span>
            </span>
          )}
          {autoSaveStatus === 'idle' && (
            <span className="text-2xs text-ink-500">جاهز ومتزامن</span>
          )}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.organization')}</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.dashboard_name')}</label>
          <input
            type="text"
            value={form.dashboard_name}
            onChange={e => updateField('dashboard_name', e.target.value)}
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.timezone')}</label>
            <select
              value={form.timezone}
              onChange={e => updateField('timezone', e.target.value)}
              className="input w-full cursor-pointer"
            >
              <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.currency')}</label>
            <select
              value={form.currency}
              onChange={e => updateField('currency', e.target.value)}
              className="input w-full cursor-pointer"
            >
              <option value="EGP">{t('settings.currency_egp')}</option>
              <option value="USD">{t('settings.currency_usd')}</option>
              <option value="EUR">{t('settings.currency_eur')}</option>
              <option value="SAR">{t('settings.currency_sar')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GLOBAL EMERGENCY KILL SWITCH ── */}
      <div className={`card p-5 space-y-3 border-2 transition-all ${
        form.global_emergency_free_mode
          ? 'bg-rose-950/20 border-rose-500/50'
          : 'bg-ink-900/60 border-ink-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              form.global_emergency_free_mode ? 'bg-rose-500 text-white' : 'bg-ink-800 text-ink-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-100">{t('settings.kill_switch')}</h3>
                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                  form.global_emergency_free_mode ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-ink-800 text-ink-400'
                }`}>
                  {form.global_emergency_free_mode ? t('settings.kill_switch_active') : t('settings.kill_switch_normal')}
                </span>
              </div>
              <p className="text-xs text-ink-400 mt-0.5">
                {t('settings.kill_switch_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('global_emergency_free_mode')}
            className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 ${
              form.global_emergency_free_mode ? 'bg-rose-600' : 'bg-ink-700'
            }`}
          >
            <span className={`absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform ${
              form.global_emergency_free_mode ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* ── Digital Menu Pricing ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.menu_pricing')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.menu_monthly')}</label>
            <input
              type="number"
              value={form.menu_price_monthly}
              onChange={e => updateField('menu_price_monthly', Number(e.target.value))}
              className="input w-full"
              disabled={form.menu_free_mode || form.global_emergency_free_mode}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.menu_yearly')}</label>
            <input
              type="number"
              value={form.menu_price_yearly}
              onChange={e => updateField('menu_price_yearly', Number(e.target.value))}
              className="input w-full"
              disabled={form.menu_free_mode || form.global_emergency_free_mode}
            />
          </div>
        </div>
        <label className="flex items-center justify-between cursor-pointer pt-2">
          <div>
            <p className="text-sm text-ink-200">{t('settings.menu_free_mode')}</p>
            <p className="text-xs text-ink-500">{t('settings.menu_free_mode_desc')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              form.menu_free_mode
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-ink-800 text-ink-400 border-ink-700'
            }`}>
              {form.menu_free_mode ? (locale === 'ar' ? 'مفعّل (مجاني)' : 'Enabled (Free)') : (locale === 'ar' ? 'معطّل (مدفوع)' : 'Disabled (Paid)')}
            </span>
            <button
              type="button"
              onClick={() => handleToggle('menu_free_mode')}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.menu_free_mode ? 'bg-brand-600' : 'bg-ink-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.menu_free_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </label>
      </div>

      {/* ── Dawaty Pricing ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.dawaty_pricing')}</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.dawaty_single_price')}</label>
          <input
            type="number"
            value={form.dawaty_invitation_price}
            onChange={e => updateField('dawaty_invitation_price', Number(e.target.value))}
            className="input w-full"
            disabled={form.dawaty_free_mode || form.global_emergency_free_mode}
          />
        </div>
        <label className="flex items-center justify-between cursor-pointer pt-2">
          <div>
            <p className="text-sm text-ink-200">{t('settings.dawaty_free_mode') || 'الوضع المجاني لدعوتي'}</p>
            <p className="text-xs text-ink-500">{t('settings.dawaty_free_mode_desc')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              form.dawaty_free_mode
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-ink-800 text-ink-400 border-ink-700'
            }`}>
              {form.dawaty_free_mode ? (locale === 'ar' ? 'مفعّل (مجاني)' : 'Enabled (Free)') : (locale === 'ar' ? 'معطّل (مدفوع)' : 'Disabled (Paid)')}
            </span>
            <button
              type="button"
              onClick={() => handleToggle('dawaty_free_mode')}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.dawaty_free_mode ? 'bg-brand-600' : 'bg-ink-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.dawaty_free_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </label>
      </div>

      {/* ── CV Maker Pricing ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.cv_pricing')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.cv_single_export')}</label>
            <input
              type="number"
              value={form.cv_price_single}
              onChange={e => updateField('cv_price_single', Number(e.target.value))}
              className="input w-full"
              disabled={form.cv_free_mode || form.global_emergency_free_mode}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.cv_unlimited_sub')}</label>
            <input
              type="number"
              value={form.cv_price_subscription}
              onChange={e => updateField('cv_price_subscription', Number(e.target.value))}
              className="input w-full"
              disabled={form.cv_free_mode || form.global_emergency_free_mode}
            />
          </div>
        </div>
        <label className="flex items-center justify-between cursor-pointer pt-2">
          <div>
            <p className="text-sm text-ink-200">{t('settings.cv_free_mode')}</p>
            <p className="text-xs text-ink-500">{t('settings.cv_free_mode_desc')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              form.cv_free_mode
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-ink-800 text-ink-400 border-ink-700'
            }`}>
              {form.cv_free_mode ? (locale === 'ar' ? 'مفعّل (مجاني)' : 'Enabled (Free)') : (locale === 'ar' ? 'معطّل (مدفوع)' : 'Disabled (Paid)')}
            </span>
            <button
              type="button"
              onClick={() => handleToggle('cv_free_mode')}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.cv_free_mode ? 'bg-brand-600' : 'bg-ink-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.cv_free_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </label>
      </div>

      {/* ── QR Me Pricing ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.qrme_pricing')}</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.qrme_vip_price')}</label>
          <input
            type="number"
            value={form.qr_me_vip_price}
            onChange={e => updateField('qr_me_vip_price', Number(e.target.value))}
            className="input w-full"
            disabled={form.qr_me_free_mode || form.global_emergency_free_mode}
          />
        </div>
        <label className="flex items-center justify-between cursor-pointer pt-2">
          <div>
            <p className="text-sm text-ink-200">{t('settings.qrme_free_mode')}</p>
            <p className="text-xs text-ink-500">{t('settings.qrme_free_mode_desc')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              form.qr_me_free_mode
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-ink-800 text-ink-400 border-ink-700'
            }`}>
              {form.qr_me_free_mode ? (locale === 'ar' ? 'مفعّل (مجاني)' : 'Enabled (Free)') : (locale === 'ar' ? 'معطّل (مدفوع)' : 'Disabled (Paid)')}
            </span>
            <button
              type="button"
              onClick={() => handleToggle('qr_me_free_mode')}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.qr_me_free_mode ? 'bg-brand-600' : 'bg-ink-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.qr_me_free_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </label>
      </div>


      {/* ── Payment Gateways ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Save className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.gateways')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.vodafone_cash')}</label>
            <input
              type="text"
              value={form.vodafone_cash_number}
              onChange={e => updateField('vodafone_cash_number', e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">
              {t('settings.instapay')}
            </label>
            <input
              type="text"
              placeholder="مثال: 01019603225 أو username@instapay"
              value={form.instapay_address}
              onChange={e => updateField('instapay_address', e.target.value)}
              className="input w-full font-mono text-xs"
            />
            <p className="text-2xs text-ink-500 mt-1">
              رقم الهاتف المسجل أو عنوان IPA. سيظهر في التطبيقات للنسخ أو الدفع الفوري.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">
            رابط الدفع المباشر لتطبيق انستا باي (InstaPay Direct Link)
          </label>
          <input
            type="text"
            placeholder="مثال: https://ipn.eg/S/username أو رابط الدفع المباشر"
            value={form.instapay_link || ''}
            onChange={e => updateField('instapay_link', e.target.value)}
            className="input w-full font-mono text-xs"
          />
          <p className="text-2xs text-ink-500 mt-1">
            عند إدخال هذا الرابط، سيظهر زر في كافة التطبيقات لفتح تطبيق انستاباي مباشرة على هاتف العميل لتحويل المبلغ فوراً.
          </p>
        </div>
      </div>

      {/* ── SMART APP STORE & VIRAL PROMOTION LINKS ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-ink-400" />
          <div>
            <h3 className="text-sm font-semibold text-ink-100">{t('settings.store_links')}</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              {t('settings.store_links_desc')}
            </p>
          </div>
        </div>

        {/* CV Maker Links */}
        <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-200">
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            <span>{t('settings.cv_links')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.app_store_url')}</label>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/cv-maker/..."
                value={form.cv_maker_app_store_url}
                onChange={e => updateField('cv_maker_app_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.play_store_url')}</label>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={form.cv_maker_play_store_url}
                onChange={e => updateField('cv_maker_play_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* QR Me Links */}
        <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-200">
            <QrCode className="w-3.5 h-3.5 text-brand-400" />
            <span>{t('settings.qrme_links')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.app_store_url')}</label>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/qr-me/..."
                value={form.qr_me_app_store_url}
                onChange={e => updateField('qr_me_app_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.play_store_url')}</label>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={form.qr_me_play_store_url}
                onChange={e => updateField('qr_me_play_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Digital Menu Links */}
        <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-200">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('settings.menu_links')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.app_store_url')}</label>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/ouonex-menu/..."
                value={form.menu_app_store_url}
                onChange={e => updateField('menu_app_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.play_store_url')}</label>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={form.menu_play_store_url}
                onChange={e => updateField('menu_play_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Dawaty Links */}
        <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-200">
            <Building className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('settings.dawaty_links')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.app_store_url')}</label>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/dawaty/..."
                value={form.dawaty_app_store_url}
                onChange={e => updateField('dawaty_app_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-ink-400 mb-1">{t('settings.play_store_url')}</label>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={form.dawaty_play_store_url}
                onChange={e => updateField('dawaty_play_store_url', e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">{t('settings.notifications')}</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-ink-200">{t('settings.email_notifications')}</p>
            <p className="text-xs text-ink-500">{t('settings.email_notifications_desc')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              form.email_notifications
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-ink-800 text-ink-400 border-ink-700'
            }`}>
              {form.email_notifications ? (locale === 'ar' ? 'مفعّل' : 'Enabled') : (locale === 'ar' ? 'معطّل' : 'Disabled')}
            </span>
            <button
              type="button"
              onClick={() => handleToggle('email_notifications')}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.email_notifications ? 'bg-brand-600' : 'bg-ink-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.email_notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </label>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('settings.auto_refresh')}</label>
          <input
            type="number"
            min={10}
            max={120}
            value={form.auto_refresh_seconds}
            onChange={e => updateField('auto_refresh_seconds', Number(e.target.value))}
            className="input w-32"
          />
        </div>
      </div>

      {/* ── APP VERSION CONTROL ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="w-4 h-4 text-brand-400" />
          <div>
            <h3 className="text-sm font-semibold text-ink-100">التحكم في إصدارات التطبيقات</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              حدد أقل إصدار مقبول لكل تطبيق. المستخدمون الذين يمتلكون إصداراً أقل سيرون إشعار التحديث.
            </p>
          </div>
        </div>

        {([ 
          {
            appId: 'cv_maker',
            label: 'CV Maker',
            icon: <FileText className="w-3.5 h-3.5 text-brand-400" />,
            prefix: 'cv_maker',
            color: 'brand',
          },
          {
            appId: 'dawety',
            label: 'Dawaty',
            icon: <Globe className="w-3.5 h-3.5 text-rose-400" />,
            prefix: 'dawety',
            color: 'rose',
          },
          {
            appId: 'digital_menu',
            label: 'Digital Menu',
            icon: <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />,
            prefix: 'menu',
            color: 'amber',
          },
          {
            appId: 'qr_me',
            label: 'QR Me',
            icon: <QrCode className="w-3.5 h-3.5 text-accent-400" />,
            prefix: 'qr_me',
            color: 'accent',
          },
        ] as const).map(({ label, icon, prefix }) => {
          const latestKey = `${prefix}_latest_version` as keyof typeof form;
          const minKey    = `${prefix}_min_version`    as keyof typeof form;
          const forceKey  = `${prefix}_force_update`   as keyof typeof form;
          const titleKey  = `${prefix}_update_title_ar`   as keyof typeof form;
          const msgKey    = `${prefix}_update_message_ar` as keyof typeof form;
          const iosKey    = `${prefix}_app_store_url`  as keyof typeof form;
          const playKey   = `${prefix}_play_store_url` as keyof typeof form;

          const isForce   = !!form[forceKey];
          const hasUpdate = (form[latestKey] as string) !== (form[minKey] as string);

          return (
            <div key={prefix} className="p-4 rounded-xl bg-ink-950/40 border border-ink-800 space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-ink-100">
                  {icon}
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isForce ? (
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-danger-500/20 text-danger-300 border border-danger-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> إجباري
                    </span>
                  ) : hasUpdate ? (
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-300 border border-warning-500/30 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> اختياري
                    </span>
                  ) : (
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-success-500/15 text-success-400 border border-success-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> محدث
                    </span>
                  )}
                </div>
              </div>

              {/* Versions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-medium text-ink-400 mb-1">
                    أحدث إصدار (Latest Version)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-500" />
                    <input
                      type="text"
                      placeholder="1.2.0"
                      value={form[latestKey] as string}
                      onChange={e => updateField(latestKey, e.target.value)}
                      className="input w-full pl-7 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-2xs font-medium text-ink-400 mb-1">
                    أقل إصدار مقبول (Min Version)
                  </label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-500" />
                    <input
                      type="text"
                      placeholder="1.0.0"
                      value={form[minKey] as string}
                      onChange={e => updateField(minKey, e.target.value)}
                      className="input w-full pl-7 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Force Update Toggle */}
              <label className={`flex items-center justify-between cursor-pointer p-3 rounded-lg transition-all ${
                isForce ? 'bg-danger-950/50 border border-danger-500/30' : 'bg-ink-900/40 border border-ink-800'
              }`}>
                <div>
                  <p className="text-xs font-medium text-ink-200">تحديث إجباري (Force Update)</p>
                  <p className="text-2xs text-ink-500 mt-0.5">
                    {isForce ? '🔴 المستخدمون لا يستطيعون تجاهل التحديث' : 'المستخدم يستطيع تجاهل الإشعار'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(forceKey)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${isForce ? 'bg-danger-600' : 'bg-ink-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isForce ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>

              {/* Update Message AR */}
              <div>
                <label className="block text-2xs font-medium text-ink-400 mb-1">
                  رسالة التحديث (عربي)
                </label>
                <input
                  type="text"
                  value={form[titleKey] as string}
                  onChange={e => updateField(titleKey, e.target.value)}
                  placeholder="تحديث جديد متوفر!"
                  className="input w-full text-xs mb-2"
                  dir="rtl"
                />
                <textarea
                  value={form[msgKey] as string}
                  onChange={e => updateField(msgKey, e.target.value)}
                  placeholder="يرجى التحديث للحصول على أفضل تجربة."
                  className="input w-full text-xs resize-none"
                  rows={2}
                  dir="rtl"
                />
              </div>

              {/* Store URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-medium text-ink-400 mb-1 flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" /> Google Play URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    value={form[playKey] as string}
                    onChange={e => updateField(playKey, e.target.value)}
                    className="input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-medium text-ink-400 mb-1 flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" /> App Store URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://apps.apple.com/app/..."
                    value={form[iosKey] as string}
                    onChange={e => updateField(iosKey, e.target.value)}
                    className="input w-full text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الحفظ التلقائي...</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-success-400 bg-success-500/10 px-3 py-1 rounded-full border border-success-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم الحفظ والتطبيق بنجاح ✓</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
