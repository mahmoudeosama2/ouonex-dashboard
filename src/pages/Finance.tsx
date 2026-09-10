import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, Clock, CheckCircle2, XCircle, TrendingUp, Filter, Receipt,
  Check, X, AlertCircle, Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Payment, Product, PaymentStatus } from '@/lib/types';
import { KPICard } from '@/components/KPICard';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterItem } from '@/components/FilterBar';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { StatusBadge, ProductBadge } from '@/components/Badge';
import { LineChart, BarChart, CHART_COLORS } from '@/components/Charts';
import { CardSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { useToast } from '@/context/ToastContext';
import { useRole } from '@/context/RoleContext';
import { useLocale } from '@/context/LocaleContext';
import { egp, compactEGP, dateTime, timeAgo } from '@/lib/format';

type Tab = 'pending' | 'all' | 'rejected';

export function Finance() {
  const { canApprove, actorName } = useRole();
  const { t, locale } = useLocale();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirm, setConfirm] = useState<{ payment: Payment; action: 'approve' | 'reject' } | null>(null);
  const [receiptModal, setReceiptModal] = useState<{ payment: Payment; action: 'approve' | 'reject' } | null>(null);
  const [acting, setActing] = useState(false);
  const [kpis, setKpis] = useState({ total: 0, pending: 0, pendingAmount: 0, rejected: 0, approved: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (tab === 'pending') {
        const res = await api.payments.pending();
        setPayments(res);
        setTotal(res.length);
      } else {
        const status = tab === 'rejected' ? 'rejected' : statusFilter;
        const res = await api.payments.list({ product: productFilter === 'all' ? undefined : productFilter as Product, status: status === 'all' ? undefined : status, page, per_page: 10 });
        setPayments(res.data);
        setTotal(res.meta.total);
      }
      const all = await api.payments.list({ per_page: 200 });
      setKpis({
        total: all.data.reduce((s, p) => s + (p.status === 'paid' ? p.submitted_amount : 0), 0),
        pending: all.data.filter(p => p.status === 'pending_review').length,
        pendingAmount: all.data.filter(p => p.status === 'pending_review').reduce((s, p) => s + p.submitted_amount, 0),
        rejected: all.data.filter(p => p.status === 'rejected').length,
        approved: all.data.filter(p => p.status === 'paid').length,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab, page, productFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (reason?: string) => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.action === 'approve') {
        await api.payments.approve(confirm.payment.id, actorName);
        toast.success('Payment approved', `${confirm.payment.user_name} · ${egp(confirm.payment.submitted_amount)}`);
      } else {
        await api.payments.reject(confirm.payment.id, reason ?? '', actorName);
        toast.error('Payment rejected', `${confirm.payment.user_name} · ${reason?.slice(0, 60)}...`);
      }
      setConfirm(null);
      await load();
    } catch {
      toast.error('Action failed', 'Please try again');
    } finally {
      setActing(false);
    }
  };

  const filters: FilterItem[] = tab === 'pending' ? [] : [
    {
      type: 'select', label: t('finance.filter_product'), value: productFilter,
      options: [
        { label: t('finance.filter_all'), value: 'all' },
        { label: 'Dawaty', value: 'dawaty' },
        { label: 'Digital Menu', value: 'digital_menu' },
      ],
      onChange: (v: string) => { setProductFilter(v); setPage(1); },
    },
    ...(tab === 'all' ? [{
      type: 'select' as const, label: t('finance.filter_status'), value: statusFilter,
      options: [
        { label: t('finance.filter_all'), value: 'all' },
        { label: t('finance.filter_pending'), value: 'pending_review' },
        { label: t('finance.filter_paid'), value: 'paid' },
        { label: t('finance.filter_rejected'), value: 'rejected' },
      ],
      onChange: (v: string) => { setStatusFilter(v); setPage(1); },
    }] : []),
  ];

  const columns: Column<Payment>[] = [
    {
      key: 'reference', header: t('finance.th_reference'), sortValue: r => r.reference_id,
      render: r => (
        <div>
          <p className="font-mono text-xs text-ink-100">{r.reference_id}</p>
          <p className="text-2xs text-ink-500">{r.method}</p>
        </div>
      ),
    },
    { key: 'user', header: t('finance.th_user_restaurant'), sortValue: r => r.user_name, render: r => <span className="text-ink-100">{r.user_name}</span> },
    { key: 'product', header: t('finance.th_product'), render: r => <ProductBadge product={r.product} /> },
    {
      key: 'amount', header: t('finance.th_amount'), sortValue: r => r.submitted_amount,
      render: r => (
        <div>
          <p className="font-semibold text-ink-100 tabular-nums">{egp(r.submitted_amount)}</p>
          {r.expected_amount !== r.submitted_amount && (
            <p className="text-2xs text-warning-400">
              {locale === 'ar' ? `المتوقع ${egp(r.expected_amount)}` : `expected ${egp(r.expected_amount)}`}
            </p>
          )}
        </div>
      ),
    },
    { key: 'status', header: t('finance.th_status'), render: r => <StatusBadge status={r.status} /> },
    { key: 'date', header: t('finance.th_submitted'), sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{timeAgo(r.created_at)}</span> },
  ];

  if (error) return <ErrorState message="Failed to load payments." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title={t('finance.title')}
        description={t('finance.description')}
        icon={<Wallet className="w-5 h-5" />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && !kpis.total ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KPICard label={t('finance.kpi_total_revenue')} value={kpis.total} format="egp" icon={<TrendingUp className="w-4 h-4" />} accent="success" />
            <KPICard label={t('finance.kpi_pending_review')} value={kpis.pending} format="num" icon={<Clock className="w-4 h-4" />} highlight />
            <KPICard label={t('finance.kpi_pending_amount')} value={kpis.pendingAmount} format="egp" icon={<Wallet className="w-4 h-4" />} accent="warning" />
            <KPICard label={t('finance.kpi_rejected')} value={kpis.rejected} format="num" icon={<XCircle className="w-4 h-4" />} accent="danger" />
          </>
        )}
      </div>

      {/* Revenue charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-100 mb-1">{t('finance.chart_rev_over_time')}</h3>
          <p className="text-xs text-ink-400 mb-4">{t('finance.chart_rev_over_time_sub')}</p>
          <LineChart data={(() => { const r: { date: string; value: number }[] = []; for (let d = 29; d >= 0; d--) { r.push({ date: new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10), value: Math.round(30_000 + Math.sin(d / 4) * 8_000 + (30 - d) * 120 + (d * 37) % 5_000) }); } return r; })()} height={200} color={CHART_COLORS.success} format={n => egp(n)} />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-100 mb-1">{t('finance.chart_rev_by_product')}</h3>
          <p className="text-xs text-ink-400 mb-4">{t('finance.chart_rev_by_product_sub')}</p>
          <BarChart
            data={[
              { label: 'Dawaty', value: 486_200, color: CHART_COLORS.pink },
              { label: 'Digital Menu', value: 798_300, color: CHART_COLORS.brand },
            ]}
            height={200}
            format={n => compactEGP(n)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-ink-800">
        {([
          { key: 'pending' as Tab, label: t('finance.tab_pending'), icon: <Clock className="w-3.5 h-3.5" />, badge: kpis.pending },
          { key: 'all' as Tab, label: t('finance.tab_all'), icon: <Wallet className="w-3.5 h-3.5" />, badge: 0 },
          { key: 'rejected' as Tab, label: t('finance.tab_rejected'), icon: <XCircle className="w-3.5 h-3.5" />, badge: kpis.rejected },
        ]).map(tItem => (
          <button
            key={tItem.key}
            onClick={() => { setTab(tItem.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === tItem.key ? 'border-brand-500 text-brand-300' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {tItem.icon}
            {tItem.label}
            {tItem.badge !== undefined && tItem.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-warning-500 text-ink-970 text-2xs font-bold">{tItem.badge}</span>
            )}
          </button>
        ))}
      </div>

      {filters.length > 0 && <FilterBar filters={filters} />}

      {/* Pending review special view */}
      {tab === 'pending' ? (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4"><div className="flex gap-4"><div className="skeleton h-12 w-12 rounded-lg" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-1/2" /></div></div></div>)
          ) : payments.length === 0 ? (
            <div className="card">
              <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-success-400" />} title={t('finance.all_caught_up')} message={t('finance.no_pending_msg')} />
            </div>
          ) : (
            payments.map(p => (
              <PendingPaymentRow key={p.id} payment={p} canApprove={canApprove} onApprove={() => {
                if (p.receipt_url) {
                  setReceiptModal({ payment: p, action: 'approve' });
                } else {
                  setConfirm({ payment: p, action: 'approve' });
                }
              }} onReject={() => setConfirm({ payment: p, action: 'reject' })} onViewReceipt={() => setReceiptModal({ payment: p, action: 'approve' })} />
            ))
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={payments}
          loading={loading}
          page={page}
          perPage={10}
          total={total}
          onPageChange={setPage}
          emptyTitle={tab === 'rejected' ? (locale === 'ar' ? 'لا توجد دفعات مرفوضة' : 'No rejected payments') : (locale === 'ar' ? 'لم يتم العثور على معاملات' : 'No transactions found')}
          emptyMessage={locale === 'ar' ? 'جرب تغيير خيارات التصفية.' : 'Try adjusting your filters.'}
          rowActions={(r) => (
            tab === 'rejected' ? (
              <span className="text-xs text-ink-400 max-w-[200px] truncate block" title={r.reject_reason}>{r.reject_reason}</span>
            ) : undefined
          )}
        />
      )}

      <ConfirmActionModal
        open={!!confirm}
        payment={confirm?.payment ?? null}
        action={confirm?.action ?? 'approve'}
        onConfirm={handleConfirm}
        onClose={() => !acting && setConfirm(null)}
      />

      <ReceiptModal
        open={!!receiptModal}
        receiptUrl={receiptModal?.payment.receipt_url ?? null}
        onClose={() => setReceiptModal(null)}
      />
      {receiptModal && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[96]">
          <button
            onClick={() => { setConfirm({ payment: receiptModal.payment, action: receiptModal.action }); setReceiptModal(null); }}
            className="btn-success shadow-pop"
          >
            <Check className="w-4 h-4" /> {locale === 'ar' ? 'متابعة للاعتماد' : 'Proceed to approve'}
          </button>
        </div>
      )}
    </div>
  );
}

function PendingPaymentRow({ payment, canApprove, onApprove, onReject, onViewReceipt }: {
  payment: Payment;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  onViewReceipt: () => void;
}) {
  const { t, locale } = useLocale();
  const mismatch = payment.expected_amount !== payment.submitted_amount;
  return (
    <div className="card card-hover p-4 group">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${mismatch ? 'bg-warning-500/10 text-warning-400' : 'bg-ink-800 text-ink-300'}`}>
          <Receipt className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-100 truncate">{payment.user_name}</p>
            <p className="text-2xs text-ink-500 font-mono">{payment.reference_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <ProductBadge product={payment.product} />
            <span className="text-2xs text-ink-500">{payment.method}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-100 tabular-nums">{egp(payment.submitted_amount)}</p>
            {mismatch && (
              <p className="text-2xs text-warning-400">
                {locale === 'ar' ? `المتوقع ${egp(payment.expected_amount)}` : `expected ${egp(payment.expected_amount)}`}
              </p>
            )}
            {payment.receipt_url && (
              <button onClick={onViewReceipt} className="text-2xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-0.5">
                <Receipt className="w-3 h-3" /> {t('finance.btn_view_receipt')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            {canApprove ? (
              <>
                <button onClick={onApprove} className="btn-success text-xs px-3 py-1.5">
                  <Check className="w-3.5 h-3.5" /> {t('finance.btn_approve')}
                </button>
                <button onClick={onReject} className="btn-danger text-xs px-3 py-1.5">
                  <X className="w-3.5 h-3.5" /> {t('finance.btn_reject')}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-2xs text-ink-400 px-2 py-1.5 rounded-lg bg-ink-800/60" title="Requires Owner, Admin, or Finance role">
                <Lock className="w-3 h-3" />
                <span>{locale === 'ar' ? 'الاعتماد/الرفض يتطلب صلاحية المالية' : 'Approve/reject requires Finance role'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {mismatch && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-500/5 border border-warning-500/20 p-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-300">
            {t('finance.mismatch_warning', { sub: egp(payment.submitted_amount), exp: egp(payment.expected_amount) })}
          </p>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2 text-2xs text-ink-500">
        <Clock className="w-3 h-3" /> {locale === 'ar' ? `أرسلت منذ ${timeAgo(payment.created_at)}` : `Submitted ${timeAgo(payment.created_at)}`}
      </div>
    </div>
  );
}
