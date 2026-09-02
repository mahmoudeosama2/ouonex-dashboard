import { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, Search, Wallet, Clock, Mail, Edit3, Save, X, Key, Shield, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { UserSearchResult } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { Drawer } from '@/components/Drawer';
import { ProductBadge, StatusBadge } from '@/components/Badge';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { egp, date, timeAgo } from '@/lib/format';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.users.search(query, page);
      setResults(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
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

  if (error) return <ErrorState message="Failed to load users." onRetry={load} />;

  const columns: Column<UserSearchResult>[] = [
    { key: 'name', header: 'Name', sortValue: r => r.name, render: r => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-semibold text-ink-200">
          {r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <span className="font-medium text-ink-100">{r.name}</span>
      </div>
    ) },
    { key: 'email', header: 'Email', sortValue: r => r.email, render: r => <span className="text-xs text-ink-400">{r.email}</span> },
    { key: 'products', header: 'Products', render: r => (
      <div className="flex flex-wrap gap-1">{r.products.map(p => <ProductBadge key={p} product={p} />)}</div>
    ) },
    { key: 'payments', header: 'Payments', sortValue: r => r.payment_count, render: r => <span className="tabular-nums text-ink-200">{r.payment_count}</span> },
    { key: 'pending', header: 'Pending', sortValue: r => r.pending_count, render: r => r.pending_count > 0 ? <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/30">{r.pending_count}</span> : <span className="text-ink-500">—</span> },
    { key: 'joined', header: 'Joined', sortValue: r => r.joined_at, render: r => <span className="text-xs text-ink-400">{date(r.joined_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Users Management" description="Global control and profile management across Dawaty and Digital Menu" icon={<UsersIcon className="w-5 h-5" />} />

      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="input pl-9 w-full"
        />
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
        emptyTitle={query ? 'No users found' : 'Start searching'}
        emptyMessage={query ? 'Try a different name or email.' : 'Type a name or email to search across all products.'}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selected?.name ?? 'User'} subtitle={selected?.email}>
        {selected && <UserDetail user={selected} onUpdated={handleUserUpdated} />}
      </Drawer>
    </div>
  );
}

function UserDetail({ user, onUpdated }: { user: UserSearchResult; onUpdated: (u: Partial<UserSearchResult>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    status: 'active',
  });

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      status: 'active',
    });
    setIsEditing(false);
    setSuccessMsg('');
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
      onUpdated({ name: formData.name, email: formData.email });
      setSuccessMsg('User updated successfully!');
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Edit Button */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white shadow-soft">
            {user.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-100">{user.name}</p>
            <p className="text-xs text-ink-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white transition"
        >
          {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          {isEditing ? 'Cancel' : 'Edit User'}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-4 rounded-xl bg-ink-950/80 border border-ink-800/80 space-y-3 animate-fade-in">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">Edit Profile & Credentials</h4>
          <div>
            <label className="block text-2xs text-ink-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1">Account Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="input w-full text-xs bg-ink-950"
            >
              <option value="active">Active (نشط)</option>
              <option value="suspended">Suspended (معلق)</option>
              <option value="banned">Banned (محظور)</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs text-ink-400 mb-1 flex items-center gap-1">
              <Key className="w-3 h-3 text-warning-400" /> Reset Password (leave blank to keep current)
            </label>
            <input
              type="password"
              placeholder="Enter new password"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-2">Products</h4>
        <div className="flex flex-wrap gap-2">{user.products.map(p => <ProductBadge key={p} product={p} />)}</div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">Payment History</h4>
        {user.payments.length === 0 ? (
          <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-4">
            <EmptyState icon={<Wallet className="w-5 h-5" />} title="No payments" message="This user has no payment history." />
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
        <h4 className="text-sm font-semibold text-ink-100 mb-3">Activity Timeline</h4>
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
