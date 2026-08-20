import { useEffect, useState, useCallback } from 'react';
import { UtensilsCrossed, Sparkles, ShoppingBag, AlertCircle, Store, CheckCircle2 } from 'lucide-react';
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

type SubTab = 'restaurants' | 'ai' | 'orders';

export function DigitalMenu() {
  const [tab, setTab] = useState<SubTab>('restaurants');
  return (
    <div>
      <PageHeader title="Digital Menu" description="Restaurant menus, AI scan, and orders" icon={<UtensilsCrossed className="w-5 h-5" />} />
      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'restaurants', label: 'Restaurants', icon: <Store className="w-3.5 h-3.5" /> },
          { key: 'ai', label: 'AI Scan', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { key: 'orders', label: 'Orders', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
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
      {tab === 'restaurants' && <RestaurantsTab />}
      {tab === 'ai' && <AITab />}
      {tab === 'orders' && <OrdersTab />}
    </div>
  );
}

function RestaurantsTab() {
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kpis, setKpis] = useState({ total: 0, active: 0, aiScans: 0, aiCost: 0 });

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

  const handleRowClick = async (r: Restaurant) => {
    setSelected(r);
    setDrawerOpen(true);
    const detail = await api.digitalMenu.restaurant(r.id);
    if (detail) setSelected(detail);
  };

  if (error) return <ErrorState message="Failed to load restaurants." onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: 'Status', value: statusFilter,
      options: [{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Trial', value: 'trial' }, { label: 'Suspended', value: 'suspended' }],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Restaurant>[] = [
    { key: 'name', header: 'Restaurant', sortValue: r => r.store_name, render: r => <span className="font-medium text-ink-100">{r.store_name}</span> },
    { key: 'status', header: 'Status', sortValue: r => r.status, render: r => <StatusBadge status={r.status} /> },
    { key: 'plan', header: 'Plan', sortValue: r => r.plan, render: r => <PlanBadge plan={r.plan} /> },
    { key: 'menu', header: 'Menu Published', render: r => r.menu_published ? <CheckCircle2 className="w-4 h-4 text-success-400" /> : <span className="text-2xs text-ink-500">Unpublished</span> },
    { key: 'owner', header: 'Owner', sortValue: r => r.owner, render: r => <span className="text-xs text-ink-300">{r.owner}</span> },
    { key: 'orders', header: 'Orders', sortValue: r => r.orders_count, render: r => <span className="tabular-nums text-ink-200">{num(r.orders_count)}</span> },
    { key: 'ai', header: 'AI Scans', sortValue: r => r.ai_scans_count, render: r => <span className="tabular-nums text-ink-200">{num(r.ai_scans_count)}</span> },
    { key: 'created', header: 'Joined', sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && !kpis.total ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard label="Total Restaurants" value={kpis.total} format="num" icon={<Store className="w-4 h-4" />} />
            <KPICard label="Active" value={kpis.active} format="num" icon={<UtensilsCrossed className="w-4 h-4" />} accent="success" />
            <KPICard label="AI Scans" value={kpis.aiScans} format="compactNum" icon={<Sparkles className="w-4 h-4" />} />
            <KPICard label="AI Cost" value={kpis.aiCost} format="egp" icon={<AlertCircle className="w-4 h-4" />} accent="warning" />
          </>
        )}
      </div>

      <FilterBar filters={filters} />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={handleRowClick}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle="No restaurants found"
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selected?.store_name ?? 'Restaurant'} subtitle={selected ? `/${selected.slug}` : ''}>
        {selected && <RestaurantDetail r={selected} />}
      </Drawer>
    </>
  );
}

function RestaurantDetail({ r }: { r: Restaurant }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <StatusBadge status={r.status} />
        <PlanBadge plan={r.plan} />
        <span className="text-xs text-ink-400 ml-auto">Joined {date(r.created_at)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DetailStat label="Categories" value={num(r.categories_count)} />
        <DetailStat label="Products" value={num(r.products_count)} />
        <DetailStat label="Orders" value={num(r.orders_count)} />
        <DetailStat label="AI Scans" value={num(r.ai_scans_count)} />
        <DetailStat label="AI Cost" value={egp(r.ai_cost)} />
        <DetailStat label="Menu Published" value={r.menu_published ? 'Yes' : 'No'} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-100 mb-2">Owner</h4>
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
        <EmptyState icon={<ShoppingBag className="w-5 h-5" />} title="Orders not yet tracked for this product" message="The Digital Menu backend hasn't shipped an Order model yet. Check back once the endpoint is live." />
      </div>
    );
  }

  if (error) return <ErrorState message="Failed to load orders." onRetry={load} />;

  const filters: FilterItem[] = [
    {
      type: 'select', label: 'Status', value: statusFilter,
      options: [{ label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Preparing', value: 'preparing' }, { label: 'Ready', value: 'ready' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }],
      onChange: v => { setStatusFilter(v); setPage(1); },
    },
  ];

  const columns: Column<Order>[] = [
    { key: 'id', header: 'Order', sortValue: r => r.id, render: r => <span className="font-mono text-xs text-ink-100">{r.id}</span> },
    { key: 'restaurant', header: 'Restaurant', sortValue: r => r.restaurant_name, render: r => <span className="text-ink-100">{r.restaurant_name}</span> },
    { key: 'customer', header: 'Customer', sortValue: r => r.customer, render: r => <span className="text-xs text-ink-300">{r.customer}</span> },
    { key: 'items', header: 'Items', sortValue: r => r.items, render: r => <span className="tabular-nums text-ink-200">{r.items}</span> },
    { key: 'total', header: 'Total', sortValue: r => r.total, render: r => <span className="font-semibold text-ink-100 tabular-nums">{egp(r.total)}</span> },
    { key: 'status', header: 'Status', sortValue: r => r.status, render: r => <StatusBadge status={r.status} /> },
    { key: 'date', header: 'Date', sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{date(r.created_at)}</span> },
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
        emptyTitle="No orders found"
      />
    </>
  );
}
