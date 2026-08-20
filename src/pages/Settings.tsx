import { useEffect, useState, useCallback } from 'react';
import {
  Settings as SettingsIcon, Users, ScrollText, Activity, ShieldCheck,
  CheckCircle2, XCircle, Crown, Lock, Save, Loader2, Bell, Globe, Building,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { TeamMember, AuditLogEntry, HealthIndicator, Role } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { CardSkeleton } from '@/components/Skeleton';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/context/ToastContext';
import { ROLES } from '@/lib/rbac';
import { dateTime, timeAgo } from '@/lib/format';

type SubTab = 'team' | 'audit' | 'health' | 'general';

export function Settings() {
  const { canManageTeam } = useRole();
  const toast = useToast();
  const [tab, setTab] = useState<SubTab>('general');

  return (
    <div>
      <PageHeader title="Settings" description="Team, audit log, and system health" icon={<SettingsIcon className="w-5 h-5" />} />

      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'general', label: 'General', icon: <SettingsIcon className="w-3.5 h-3.5" /> },
          { key: 'team', label: 'Team', icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'audit', label: 'Audit Log', icon: <ScrollText className="w-3.5 h-3.5" /> },
          { key: 'health', label: 'Health', icon: <Activity className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-brand-500 text-brand-300' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.icon}
            {t.label}
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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (error) return <ErrorState message="Failed to load team members." onRetry={load} />;
  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  const roleLabel = (r: Role) => ROLES.find(x => x.id === r)?.label ?? r;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-400">{members.length} team members</p>
        {canManage ? (
          <button className="btn-primary">Invite member</button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-ink-400 px-3 py-2 rounded-lg bg-ink-800/60">
            <Lock className="w-3.5 h-3.5" />
            <span>Only the Owner can manage team</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {members.map(m => (
          <div key={m.id} className="card card-hover p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: m.avatar_color }}>
              {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink-100 truncate">{m.name}</p>
                {m.role === 'owner' && <Crown className="w-3.5 h-3.5 text-warning-400 shrink-0" />}
              </div>
              <p className="text-xs text-ink-400 truncate">{m.email}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`badge ${
                m.role === 'owner' ? 'bg-warning-500/15 text-warning-400 border border-warning-500/30' :
                m.role === 'admin' ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' :
                m.role === 'finance' ? 'bg-success-500/15 text-success-400 border border-success-500/30' :
                m.role === 'support' ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30' :
                'bg-ink-500/15 text-ink-300 border border-ink-600/40'
              }`}>{roleLabel(m.role)}</span>
              <p className="text-2xs text-ink-500 mt-1">Active {timeAgo(m.last_active)}</p>
            </div>
          </div>
        ))}
      </div>
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
  const [health, setHealth] = useState<HealthIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.team.health();
      setHealth(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message="Failed to load health indicators." onRetry={load} />;
  if (loading) return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {health.map(h => (
        <div key={h.product} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${h.reachable ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-100">{h.name}</p>
                <p className="text-2xs text-ink-400">{h.product}</p>
              </div>
            </div>
            <span className={`badge ${h.reachable ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${h.reachable ? 'bg-success-400 animate-pulse' : 'bg-danger-400'}`} />
              {h.reachable ? 'Reachable' : 'Offline'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ink-950/50 border border-ink-800 p-3">
              <p className="text-2xs text-ink-400 uppercase tracking-wide mb-1">Last Sync</p>
              <p className="text-sm font-medium text-ink-100">{timeAgo(h.last_sync)}</p>
            </div>
            <div className="rounded-lg bg-ink-950/50 border border-ink-800 p-3">
              <p className="text-2xs text-ink-400 uppercase tracking-wide mb-1">Latency</p>
              <p className="text-sm font-medium text-ink-100 tabular-nums">{h.latency_ms}ms</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneralTab() {
  const toast = useToast();
  const [form, setForm] = useState({
    dashboard_name: 'Ouonex Dashboard',
    timezone: 'Africa/Cairo',
    currency: 'EGP',
    email_notifications: true,
    auto_refresh_seconds: 30,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.save(form);
      toast.success('Settings saved', 'Your changes have been applied');
    } catch {
      toast.error('Save failed', 'Could not save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">Organization</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Dashboard name</label>
          <input
            type="text"
            value={form.dashboard_name}
            onChange={e => setForm(f => ({ ...f, dashboard_name: e.target.value }))}
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="input w-full cursor-pointer"
            >
              <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">Currency</label>
            <select
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="input w-full cursor-pointer"
            >
              <option value="EGP">EGP — Egyptian Pound</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="SAR">SAR — Saudi Riyal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-100">Notifications</h3>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-ink-200">Email notifications</p>
            <p className="text-xs text-ink-500">Receive alerts for new pending payments</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, email_notifications: !f.email_notifications }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.email_notifications ? 'bg-brand-600' : 'bg-ink-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.email_notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-1.5">Auto-refresh interval (seconds)</label>
          <input
            type="number"
            min={10}
            max={120}
            value={form.auto_refresh_seconds}
            onChange={e => setForm(f => ({ ...f, auto_refresh_seconds: Number(e.target.value) }))}
            className="input w-32"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
