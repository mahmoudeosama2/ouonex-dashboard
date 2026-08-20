import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Wallet, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { AIUsageSummary, AIScan, Product } from '@/lib/types';
import { KPICard } from '@/components/KPICard';
import { LineChart, BarChart, CHART_COLORS } from '@/components/Charts';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterItem } from '@/components/FilterBar';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { ProductBadge } from '@/components/Badge';
import { num, egp, dateTime, pct } from '@/lib/format';

export function AIUsage() {
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [scans, setScans] = useState<AIScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [productFilter, setProductFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    setError(false);
    Promise.all([
      api.ai.summary(),
      api.ai.scans({ product: productFilter === 'all' ? undefined : productFilter as Product, page, per_page: 10 }),
    ]).then(([s, r]) => {
      if (!ok) return;
      setSummary(s);
      setScans(r.data);
      setTotal(r.meta.total);
    }).catch(() => setError(true)).finally(() => setLoading(false));
    return () => { ok = false; };
  }, [productFilter, page]);

  if (error) return <ErrorState message="Failed to load AI usage data." />;
  if (loading || !summary) return (
    <div>
      <PageHeader title="AI Usage" description="Cross-product AI scan analytics" icon={<Sparkles className="w-5 h-5" />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  );

  const filters: FilterItem[] = [
    {
      type: 'select', label: 'Product', value: productFilter,
      options: [{ label: 'All', value: 'all' }, { label: 'Digital Menu', value: 'digital_menu' }, { label: 'Dawaty', value: 'dawaty' }],
      onChange: v => { setProductFilter(v); setPage(1); },
    },
  ];

  const columns: Column<AIScan>[] = [
    { key: 'id', header: 'Scan ID', sortValue: r => r.id, render: r => <span className="font-mono text-xs text-ink-100">{r.id}</span> },
    { key: 'product', header: 'Product', render: r => <ProductBadge product={r.product} /> },
    { key: 'restaurant', header: 'Restaurant', sortValue: r => r.restaurant_name ?? '', render: r => <span className="text-ink-200">{r.restaurant_name ?? '—'}</span> },
    { key: 'status', header: 'Status', sortValue: r => r.status, render: r => (
      <span className={`badge ${r.status === 'success' ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'success' ? 'bg-success-400' : 'bg-danger-400'}`} />
        {r.status === 'success' ? 'Success' : 'Failed'}
      </span>
    ) },
    { key: 'cost', header: 'Cost', sortValue: r => r.cost, render: r => <span className="tabular-nums text-ink-200">EGP {r.cost.toFixed(2)}</span> },
    { key: 'duration', header: 'Duration', sortValue: r => r.duration_ms, render: r => <span className="text-xs text-ink-400">{r.duration_ms}ms</span> },
    { key: 'error', header: 'Error', render: r => r.error ? <span className="text-xs text-danger-400 truncate max-w-[160px] block">{r.error}</span> : <span className="text-ink-500">—</span> },
    { key: 'date', header: 'Date', sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{dateTime(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader title="AI Usage" description="Cross-product AI scan analytics" icon={<Sparkles className="w-5 h-5" />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Scans" value={summary.totalScans} format="num" icon={<Sparkles className="w-4 h-4" />} />
        <KPICard label="Success Rate" value={summary.successRate} format="num" icon={<CheckCircle2 className="w-4 h-4" />} accent="success" />
        <KPICard label="Failed" value={summary.failedCount} format="num" icon={<AlertCircle className="w-4 h-4" />} accent="danger" />
        <KPICard label="Total Cost" value={summary.totalCost} format="egp" icon={<Wallet className="w-4 h-4" />} accent="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">Cost Over Time</h3>
              <p className="text-xs text-ink-400">Last 30 days</p>
            </div>
            <TrendingUp className="w-4 h-4 text-ink-400" />
          </div>
          <LineChart data={summary.costOverTime.map(c => ({ date: c.date, value: c.cost }))} height={200} color={CHART_COLORS.warning} format={n => `EGP ${n}`} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-4">Top Errors</h3>
          <div className="space-y-3">
            {summary.topErrors.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-ink-400 w-5">{i + 1}.</span>
                <span className="text-sm text-ink-200 flex-1">{e.error}</span>
                <span className="text-sm font-semibold text-ink-100 tabular-nums">{num(e.count)}</span>
                <div className="w-24 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full transition-all duration-500" style={{ width: `${(e.count / summary.topErrors[0].count) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink-100 mb-4">Scans by Restaurant</h3>
        <BarChart
          data={summary.byRestaurant.map((r, i) => ({ label: r.name.split(' ').slice(0, 2).join(' '), value: r.scans, color: i % 2 === 0 ? CHART_COLORS.brand : CHART_COLORS.accent }))}
          height={220}
          format={n => num(n)}
        />
      </div>

      <FilterBar filters={filters} />

      <DataTable
        columns={columns}
        rows={scans}
        loading={loading}
        page={page}
        perPage={10}
        total={total}
        onPageChange={setPage}
        emptyTitle="No AI scans found"
      />
    </div>
  );
}
