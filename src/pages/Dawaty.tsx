import { useEffect, useState, useCallback } from 'react';
import { 
  Heart, Eye, QrCode, Users, FileText, ChevronRight, ExternalLink, 
  Sparkles, CheckCircle2, PauseCircle, Loader2, MapPin, Calendar, Clock, UserCheck 
} from 'lucide-react';
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
  const [toggling, setToggling] = useState(false);

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
      type: 'select', label: 'Status', value: statusFilter,
      options: [{ label: 'All', value: 'all' }, { label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }, { label: 'Expired', value: 'expired' }],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Invitation>[] = [
    { key: 'couple', header: 'Couple', sortValue: r => r.couple_names, render: r => <span className="font-medium text-ink-100">{r.couple_names}</span> },
    { key: 'slug', header: 'Live URL', render: r => (
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
            { label: 'Created', value: kpis.total || 0, icon: <FileText className="w-4 h-4" />, color: 'bg-ink-700' },
            { label: 'Published', value: kpis.published || 0, icon: <Heart className="w-4 h-4" />, color: 'bg-accent-600' },
            { label: 'Viewed', value: kpis.visits || 0, icon: <Eye className="w-4 h-4" />, color: 'bg-brand-600' },
            { label: 'RSVP Submitted', value: kpis.rsvp || 0, icon: <Users className="w-4 h-4" />, color: 'bg-success-600' },
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
        {selected && (
          <InvitationDetail 
            inv={selected} 
            toggling={toggling}
            onTogglePublish={() => handleTogglePublish(selected)}
          />
        )}
      </Drawer>
    </div>
  );
}

function InvitationDetail({ 
  inv, 
  toggling, 
  onTogglePublish 
}: { 
  inv: Invitation; 
  toggling: boolean; 
  onTogglePublish: () => void;
}) {
  const isPublished = inv.status === 'published';
  const total_rsvp = (inv.rsvp_attending || 0) + (inv.rsvp_declined || 0) + (inv.rsvp_pending || 0);
  const extra = inv as any;

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
                  Updating...
                </>
              ) : isPublished ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  Deactivate / Unpublish
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  Activate & Publish Live
                </>
              )}
            </button>

            {isPublished && (
              <a
                href={`https://${inv.slug}.ouonex.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-ink-800 hover:bg-ink-700 text-brand-300 border border-ink-700 hover:text-brand-200 transition-colors"
              >
                Live <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Visits" value={num(inv.visit_count || 0)} icon={<Eye className="w-4 h-4" />} />
        <Stat label="QR Scans" value={num(inv.qr_scan_count || 0)} icon={<QrCode className="w-4 h-4" />} />
        <Stat label="Guests" value={num(inv.guest_count || 0)} icon={<Users className="w-4 h-4" />} />
        <Stat label="Owner" value={inv.owner || 'Unknown'} icon={<Heart className="w-4 h-4" />} />
      </div>

      {/* Wedding Details */}
      <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Event Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {(extra.groom_name || extra.bride_name) && (
            <div>
              <span className="text-ink-500 block mb-0.5">Couple</span>
              <span className="text-ink-100 font-medium">{extra.groom_name || '—'} & {extra.bride_name || '—'}</span>
            </div>
          )}
          <div>
            <span className="text-ink-500 block mb-0.5">Template</span>
            <span className="text-ink-200 font-mono">{inv.template}</span>
          </div>
          {inv.event_date && (
            <div>
              <span className="text-ink-500 block mb-0.5">Event Date</span>
              <span className="text-ink-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-ink-400" />
                {date(inv.event_date)} ({relativeDays(inv.event_date)})
              </span>
            </div>
          )}
          {extra.venue_name && (
            <div>
              <span className="text-ink-500 block mb-0.5">Venue</span>
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
        <h4 className="text-sm font-semibold text-ink-100 mb-3">RSVP Breakdown</h4>
        <div className="space-y-2">
          <RSVPRRow label="Attending" value={inv.rsvp_attending || 0} total={total_rsvp} color="bg-success-500" />
          <RSVPRRow label="Declined" value={inv.rsvp_declined || 0} total={total_rsvp} color="bg-danger-500" />
          <RSVPRRow label="Pending" value={inv.rsvp_pending || 0} total={total_rsvp} color="bg-ink-500" />
        </div>
      </div>

      {/* Visits Over Time Chart */}
      {inv.visits_over_time && inv.visits_over_time.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-ink-100 mb-3">Visits (Last 30 Days)</h4>
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
          <h4 className="text-sm font-semibold text-ink-100 mb-3">Guest List ({extra.guests.length})</h4>
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
