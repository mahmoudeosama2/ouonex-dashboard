import { useEffect, useState, useCallback } from 'react';
import { Heart, Eye, QrCode, Users, FileText, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { Invitation, InvitationStatus } from '@/lib/types';
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

export function Dawaty() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kpis, setKpis] = useState({ total: 0, published: 0, visits: 0, rsvp: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.dawaty.invitations({ status: statusFilter === 'all' ? undefined : statusFilter, page, per_page: 10 });
      setInvitations(res.data);
      setTotal(res.meta.total);
      const all = await api.dawaty.invitations({ per_page: 200 });
      setKpis({
        total: all.data.length,
        published: all.data.filter(i => i.status === 'published').length,
        visits: all.data.reduce((s, i) => s + i.visit_count, 0),
        rsvp: all.data.reduce((s, i) => s + i.rsvp_attending, 0),
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRowClick = async (inv: Invitation) => {
    setSelected(inv);
    setDrawerOpen(true);
    const detail = await api.dawaty.invitation(inv.id);
    if (detail) setSelected(detail);
  };

  if (error) return <ErrorState message="Failed to load invitations." onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: 'Status', value: statusFilter,
      options: [{ label: 'All', value: 'all' }, { label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }, { label: 'Expired', value: 'expired' }],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Invitation>[] = [
    { key: 'couple', header: 'Couple', sortValue: r => r.couple_names, render: r => <span className="font-medium text-ink-100">{r.couple_names}</span> },
    { key: 'slug', header: 'Slug', render: r => <span className="font-mono text-xs text-ink-400">{r.slug}</span> },
    { key: 'status', header: 'Status', sortValue: r => r.status, render: r => <StatusBadge status={r.status} /> },
    { key: 'template', header: 'Template', render: r => <span className="text-xs text-ink-300">{r.template}</span> },
    { key: 'owner', header: 'Owner', sortValue: r => r.owner, render: r => <span className="text-xs text-ink-300">{r.owner}</span> },
    { key: 'visits', header: 'Visits', sortValue: r => r.visit_count, render: r => <span className="tabular-nums text-ink-200">{num(r.visit_count)}</span> },
    { key: 'rsvp', header: 'RSVP', render: r => <span className="text-xs"><span className="text-success-400">{r.rsvp_attending}</span> / <span className="text-danger-400">{r.rsvp_declined}</span> / <span className="text-ink-400">{r.rsvp_pending}</span></span> },
    { key: 'created', header: 'Created', sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Dawaty" description="Wedding invitations platform" icon={<Heart className="w-5 h-5" />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && !kpis.total ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard label="Total Invitations" value={kpis.total} format="num" icon={<FileText className="w-4 h-4" />} />
            <KPICard label="Published" value={kpis.published} format="num" icon={<Heart className="w-4 h-4" />} accent="success" />
            <KPICard label="Total Visits" value={kpis.visits} format="compactNum" icon={<Eye className="w-4 h-4" />} />
            <KPICard label="RSVPs (attending)" value={kpis.rsvp} format="num" icon={<Users className="w-4 h-4" />} accent="success" />
          </>
        )}
      </div>

      {/* Funnel widget */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink-100 mb-4">Invitation Funnel</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Created', value: 48, icon: <FileText className="w-4 h-4" />, color: 'bg-ink-700' },
            { label: 'Published', value: 32, icon: <Heart className="w-4 h-4" />, color: 'bg-accent-600' },
            { label: 'Viewed', value: 8_420, icon: <Eye className="w-4 h-4" />, color: 'bg-brand-600' },
            { label: 'RSVP Submitted', value: 1_240, icon: <Users className="w-4 h-4" />, color: 'bg-success-600' },
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

      <FilterBar filters={filters} />

      <DataTable
        columns={columns}
        rows={invitations}
        loading={loading}
        onRowClick={handleRowClick}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle="No invitations found"
        emptyMessage="Try adjusting your status filter."
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected?.couple_names ?? 'Invitation'}
        subtitle={selected ? `/${selected.slug}` : ''}
        width="lg"
      >
        {selected && <InvitationDetail inv={selected} />}
      </Drawer>
    </div>
  );
}

function InvitationDetail({ inv }: { inv: Invitation }) {
  const total_rsvp = inv.rsvp_attending + inv.rsvp_declined + inv.rsvp_pending;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <StatusBadge status={inv.status} />
        <span className="text-xs text-ink-400">{inv.template}</span>
        <span className="text-xs text-ink-400 ml-auto">Event: {relativeDays(inv.event_date)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Visits" value={num(inv.visit_count)} icon={<Eye className="w-4 h-4" />} />
        <Stat label="QR Scans" value={num(inv.qr_scan_count)} icon={<QrCode className="w-4 h-4" />} />
        <Stat label="Guests" value={num(inv.guest_count)} icon={<Users className="w-4 h-4" />} />
        <Stat label="Owner" value={inv.owner} icon={<Heart className="w-4 h-4" />} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">RSVP Breakdown</h4>
        <div className="space-y-2">
          <RSVPRRow label="Attending" value={inv.rsvp_attending} total={total_rsvp} color="bg-success-500" />
          <RSVPRRow label="Declined" value={inv.rsvp_declined} total={total_rsvp} color="bg-danger-500" />
          <RSVPRRow label="Pending" value={inv.rsvp_pending} total={total_rsvp} color="bg-ink-500" />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-3">Visits Over Time</h4>
        <LineChart data={inv.visits_over_time.map(v => ({ date: v.date, value: v.count }))} height={160} color={CHART_COLORS.brand} format={n => num(n)} />
      </div>
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
