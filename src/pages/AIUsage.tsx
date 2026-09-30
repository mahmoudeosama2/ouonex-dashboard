import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Wallet, TrendingUp, Key, Plus, RefreshCw, Trash2, ShieldCheck, Zap, AlertTriangle, Layers, Power, Calendar, Clock, ExternalLink, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { AIUsageSummary, AIScan, Product, AiApiKey, AIErrorDetail } from '@/lib/types';
import { KPICard } from '@/components/KPICard';
import { LineChart, BarChart, CHART_COLORS } from '@/components/Charts';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterItem } from '@/components/FilterBar';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { ProductBadge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { num, egp, dateTime, timeAgo, date, durationSec } from '@/lib/format';
import { useLocale } from '@/context/LocaleContext';

export function AIUsage() {
  const { t, locale } = useLocale();
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [scans, setScans] = useState<AIScan[]>([]);
  const [keys, setKeys] = useState<AiApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [productFilter, setProductFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Key Pool Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newPriority, setNewPriority] = useState<number>(1);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keyActionId, setKeyActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<AIErrorDetail | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.ai.summary(),
      api.ai.scans({ product: productFilter === 'all' ? undefined : productFilter as Product, page, per_page: 10 }),
      api.ai.keys.list().catch(() => ({ status: 'success', data: [] })),
    ]).then(([s, r, k]) => {
      setSummary(s);
      setScans(r.data);
      setTotal(r.meta.total);
      if (k && Array.isArray(k.data)) {
        setKeys(k.data);
      }
    }).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [productFilter, page]);

  const handleTestCandidateKey = async () => {
    if (!newKey.trim()) {
      setTestResult({ success: false, message: locale === 'ar' ? 'يرجى كتابة مفتاح الـ API أولاً' : 'Please enter an API Key first' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await api.ai.keys.test(newKey.trim(), 'gemini');
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection failed' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newKey.trim()) return;
    setSavingKey(true);
    try {
      await api.ai.keys.create({
        account_label: newLabel.trim(),
        api_key: newKey.trim(),
        priority: newPriority,
        provider: 'gemini',
      });
      setModalOpen(false);
      setNewLabel('');
      setNewKey('');
      setTestResult(null);
      showToast(locale === 'ar' ? 'تمت إضافة المفتاح إلى مصفوفة الـ Fallback بنجاح' : 'API Key added to failover pool successfully');
      loadData();
    } catch (err: any) {
      showToast(locale === 'ar' ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`);
    } finally {
      setSavingKey(false);
    }
  };

  const handleResetCooldown = async (id: string) => {
    setKeyActionId(id);
    try {
      await api.ai.keys.resetCooldown(id);
      showToast(locale === 'ar' ? 'تمت إعادة تعيين المفتاح وأصبح نشطاً الآن' : 'Key cooldown reset. Key is active now');
      loadData();
    } catch (e: any) {
      showToast(e.message);
    } finally {
      setKeyActionId(null);
    }
  };

  const handleToggleKeyStatus = async (key: AiApiKey) => {
    setKeyActionId(key.id);
    try {
      await api.ai.keys.update(key.id, { is_active: !key.is_active });
      showToast(key.is_active 
        ? (locale === 'ar' ? 'تم تعطيل المفتاح' : 'Key disabled') 
        : (locale === 'ar' ? 'تم تفعيل المفتاح' : 'Key activated'));
      loadData();
    } catch (e: any) {
      showToast(e.message);
    } finally {
      setKeyActionId(null);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المفتاح من المصفوفة؟' : 'Are you sure you want to remove this key from the pool?')) {
      return;
    }
    setKeyActionId(id);
    try {
      await api.ai.keys.delete(id);
      showToast(locale === 'ar' ? 'تم حذف المفتاح بنجاح' : 'Key deleted successfully');
      loadData();
    } catch (e: any) {
      showToast(e.message);
    } finally {
      setKeyActionId(null);
    }
  };

  if (error) return <ErrorState message={locale === 'ar' ? 'فشل تحميل بيانات استهلاك الذكاء الاصطناعي.' : 'Failed to load AI usage data.'} />;
  if (loading || !summary) return (
    <div>
      <PageHeader title={t('ai.title')} description={t('ai.description')} icon={<Sparkles className="w-5 h-5" />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  );

  const filters: FilterItem[] = [
    {
      type: 'select', label: t('finance.th_product'), value: productFilter,
      options: [
        { label: t('common.all'), value: 'all' },
        { label: 'Digital Menu', value: 'digital_menu' },
        { label: 'Dawaty', value: 'dawaty' },
      ],
      onChange: v => { setProductFilter(v); setPage(1); },
    },
  ];

  const columns: Column<AIScan>[] = [
    { key: 'id', header: t('ai.th_scan_id'), sortValue: r => r.id, render: r => <span className="font-mono text-xs text-ink-100">{r.id.slice(0, 12)}...</span> },
    { key: 'product', header: t('finance.th_product'), render: r => <ProductBadge product={r.product} /> },
    { key: 'restaurant', header: t('ai.th_restaurant'), sortValue: r => r.restaurant_name ?? '', render: r => <span className="text-ink-200 font-medium">{r.restaurant_name ?? '—'}</span> },
    { 
      key: 'model', 
      header: locale === 'ar' ? 'الموديل والحساب' : 'Model & Key', 
      render: r => (
        <div className="text-xs">
          <span className="font-mono text-ink-200 block">{r.model || 'gemini-3.6-flash'}</span>
          <span className="text-ink-400 text-[11px] block">{r.account_label || 'Default Account'}</span>
        </div>
      )
    },
    {
      key: 'tokens',
      header: locale === 'ar' ? 'التوكنات (In/Out)' : 'Tokens (In/Out)',
      render: r => (
        <span className="text-xs tabular-nums text-ink-300">
          {num(r.tokens_in || 0)} / {num(r.tokens_out || 0)} <span className="text-ink-400">({num((r.tokens_in || 0) + (r.tokens_out || 0))})</span>
        </span>
      )
    },
    { key: 'status', header: t('ai.th_status'), sortValue: r => r.status, render: r => (
      <span className={`badge ${r.status === 'success' ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-danger-500/15 text-danger-400 border border-danger-500/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'success' ? 'bg-success-400' : 'bg-danger-400'}`} />
        {r.status === 'success' ? (locale === 'ar' ? 'ناجح' : 'Success') : (locale === 'ar' ? 'فشل' : 'Failed')}
      </span>
    ) },
    { key: 'cost', header: t('ai.th_cost'), sortValue: r => r.cost, render: r => <span className="tabular-nums text-ink-200">EGP {r.cost.toFixed(4)}</span> },
    { key: 'duration', header: t('ai.th_duration'), sortValue: r => r.duration_ms, render: r => <span className="text-xs text-ink-400 tabular-nums">{durationSec(r.duration_ms)}</span> },
    { key: 'date', header: t('ai.th_date'), sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{dateTime(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader 
        title={t('ai.title')} 
        description={locale === 'ar' ? 'متابعة استهلاك الذكاء الاصطناعي، التوكنات، وسلسلة مفاتيح الحسابات المتعددة (Failover Pool)' : t('ai.description')} 
        icon={<Sparkles className="w-5 h-5 text-brand-400" />} 
      />

      {toastMessage && (
        <div className="mb-4 p-3 bg-brand-500/20 border border-brand-500/40 text-brand-300 text-sm rounded-xl flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-ink-400 hover:text-ink-200 text-xs">✕</button>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard 
          label={t('ai.kpi_total_scans')} 
          value={summary.totalScans} 
          format="num" 
          icon={<Sparkles className="w-4 h-4" />} 
        />
        <KPICard 
          label={locale === 'ar' ? 'إجمالي التوكنات المستهلكة' : 'Total Tokens Consumed'} 
          value={summary.totalTokens || (summary.totalTokensIn || 0) + (summary.totalTokensOut || 0)} 
          format="compactNum" 
          icon={<Zap className="w-4 h-4" />} 
          accent="default"
        />
        <KPICard 
          label={t('ai.kpi_success_rate')} 
          value={summary.successRate} 
          format="num" 
          icon={<CheckCircle2 className="w-4 h-4" />} 
          accent="success" 
        />
        <KPICard 
          label={t('ai.kpi_total_cost')} 
          value={summary.totalCost} 
          format="egp" 
          icon={<Wallet className="w-4 h-4" />} 
          accent="warning" 
        />
      </div>

      {/* GEMINI MULTI-ACCOUNT API KEY POOL & FAILOVER SECTION */}
      <div className="card p-5 mb-6 border border-ink-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-ink-800">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-ink-100">
                {locale === 'ar' ? 'مصفوفة مفاتيح Gemini (Multi-Account Fallback Pool)' : 'Gemini Multi-Account Fallback Pool'}
              </h3>
            </div>
            <p className="text-xs text-ink-400 mt-1">
              {locale === 'ar' 
                ? 'نظام التبديل التلقائي الذكي: عند وصول أي حساب إلى حد الكوتة (429 / ResourceExhausted)، يتحول النظام فوراً للمفتاح التالي دون توقف الخدمة.'
                : 'Zero-downtime failover: when one Google account reaches rate limit (429), requests instantly route to the backup keys.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setTestResult(null);
                setNewPriority(keys.length + 1);
                setModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === 'ar' ? 'إضافة API Key جديد' : 'Add Gemini Key'}</span>
            </button>
          </div>
        </div>

        {/* Keys List */}
        {keys.length === 0 ? (
          <div className="text-center py-6 text-ink-400 text-sm">
            {locale === 'ar' 
              ? 'لم يتم العثور على مفاتيح مخصصة. النظام يستخدم حالياً المفتاح الأساسي من ملف البيئة (.env).'
              : 'No custom keys found. System is using primary key from .env file.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {keys.map((k, index) => {
              const isFallback = index > 0;
              const isRateLimited = k.status === 'rate_limited';
              const isQuotaExceeded = k.status === 'quota_exceeded';
              const isError = k.status === 'error';
              const isActive = k.is_active && !isRateLimited && !isQuotaExceeded && !isError;

              return (
                <div 
                  key={k.id} 
                  className={`card p-4 rounded-xl border transition flex flex-col justify-between ${
                    isActive ? 'border-success-500/30 bg-success-500/[0.02]' : 
                    isRateLimited ? 'border-amber-500/40 bg-amber-500/[0.03]' : 
                    isQuotaExceeded ? 'border-orange-500/40 bg-orange-500/[0.03]' : 
                    'border-danger-500/30 bg-danger-500/[0.02]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          index === 0 ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-ink-800 text-ink-300'
                        }`}>
                          #{k.priority} {index === 0 ? (locale === 'ar' ? 'أساسي' : 'Primary') : (locale === 'ar' ? `بديل ${index}` : `Fallback ${index}`)}
                        </span>
                        <h4 className="text-sm font-bold text-ink-100 truncate">{k.account_label}</h4>
                      </div>

                      {/* Status Badge */}
                      <span className={`badge text-[11px] ${
                        isActive ? 'bg-success-500/15 text-success-400 border border-success-500/30' :
                        isRateLimited ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        isQuotaExceeded ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                        'bg-danger-500/15 text-danger-400 border border-danger-500/30'
                      }`}>
                        {isActive ? (locale === 'ar' ? 'جاهز ونشط' : 'Active') :
                         isRateLimited ? (locale === 'ar' ? 'تبريد مؤقت (60s)' : 'Cooldown (60s)') :
                         isQuotaExceeded ? (locale === 'ar' ? 'انتهاء كوتة اليوم' : 'Daily Quota Hit') :
                         (locale === 'ar' ? 'معطل / خطأ' : 'Disabled')}
                      </span>
                    </div>

                    {/* Masked Key */}
                    <div className="font-mono text-xs text-ink-400 bg-ink-900/60 px-2.5 py-1.5 rounded-lg mb-3 flex items-center justify-between border border-ink-800/80">
                      <span>{k.masked_key}</span>
                      <span className="text-[10px] text-ink-500 uppercase">{k.provider}</span>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-ink-800/30 rounded-lg mb-3 text-xs">
                      <div>
                        <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'الطلبات' : 'Requests'}</span>
                        <span className="font-semibold text-ink-100 tabular-nums">{num(k.total_requests)}</span>
                      </div>
                      <div>
                        <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'التوكنات' : 'Tokens'}</span>
                        <span className="font-semibold text-ink-100 tabular-nums">{num(k.total_tokens)}</span>
                      </div>
                      <div>
                        <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'الأخطاء' : 'Errors'}</span>
                        <span className={`font-semibold tabular-nums ${k.failed_requests > 0 ? 'text-amber-400' : 'text-ink-300'}`}>
                          {num(k.failed_requests)}
                        </span>
                      </div>
                    </div>

                    {k.last_error && (
                      <p className="text-[11px] text-danger-400 bg-danger-500/10 p-2 rounded mb-3 truncate" title={k.last_error}>
                        {k.last_error}
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-ink-800/60 text-xs">
                    {(isRateLimited || isQuotaExceeded) ? (
                      <button 
                        onClick={() => handleResetCooldown(k.id)}
                        disabled={keyActionId === k.id}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${keyActionId === k.id ? 'animate-spin' : ''}`} />
                        <span>{locale === 'ar' ? 'إلغاء التبريد' : 'Clear Cooldown'}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleKeyStatus(k)}
                        disabled={keyActionId === k.id}
                        className={`flex items-center gap-1 font-medium ${k.is_active ? 'text-ink-400 hover:text-amber-400' : 'text-success-400 hover:text-success-300'}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{k.is_active ? (locale === 'ar' ? 'إيقاف' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')}</span>
                      </button>
                    )}

                    <button 
                      onClick={() => handleDeleteKey(k.id)}
                      disabled={keyActionId === k.id}
                      className="text-ink-500 hover:text-danger-400 p-1 transition"
                      title={locale === 'ar' ? 'حذف من المصفوفة' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">{locale === 'ar' ? 'التكلفة عبر الوقت' : 'Cost Over Time'}</h3>
              <p className="text-xs text-ink-400">{locale === 'ar' ? 'آخر 30 يوماً' : 'Last 30 days'}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-ink-400" />
          </div>
          <LineChart data={summary.costOverTime.map(c => ({ date: c.date, value: c.cost }))} height={200} color={CHART_COLORS.warning} format={n => `EGP ${n}`} />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">{locale === 'ar' ? 'أكثر الأخطاء تكراراً وتشخيصها' : 'Top Errors & Diagnostics'}</h3>
              <p className="text-xs text-ink-400">{locale === 'ar' ? 'سجل تفصيلي بالتواريخ والموديلات المتأثرة (اضغط على الخطأ لعرض كامل التفاصيل)' : 'Detailed log with timestamps and models (click to view details)'}</p>
            </div>
            <AlertCircle className="w-4 h-4 text-danger-400" />
          </div>

          <div className="space-y-3">
            {summary.topErrors.length === 0 ? (
              <p className="text-xs text-ink-400 py-6 text-center">{locale === 'ar' ? 'لا توجد أخطاء مسجلة' : 'No recorded errors'}</p>
            ) : (
              summary.topErrors.map((e, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedError(e)}
                  className="p-3 rounded-xl bg-ink-900/40 border border-ink-800 hover:border-ink-700 hover:bg-ink-900/80 transition cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-ink-400 w-5">#{i + 1}</span>
                      {e.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-danger-500/15 text-danger-300 border border-danger-500/30">
                          {e.category}
                        </span>
                      )}
                      {e.model && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-800 text-ink-300">
                          {e.model}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-ink-100 tabular-nums">{num(e.count)} {locale === 'ar' ? 'مرات' : 'times'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-200 line-clamp-2 font-mono leading-relaxed bg-ink-950/40 p-2 rounded border border-ink-800/60" dir="ltr">
                    {e.error}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-ink-400 pt-1">
                    <div className="flex items-center gap-3">
                      {e.last_seen_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ink-500" />
                          <span>{locale === 'ar' ? 'آخر ظهور:' : 'Last:'} {timeAgo(e.last_seen_at, locale)}</span>
                        </span>
                      )}
                      {e.first_seen_at && (
                        <span className="flex items-center gap-1 text-ink-500 hidden sm:flex">
                          <Calendar className="w-3 h-3" />
                          <span>{locale === 'ar' ? 'أول ظهور:' : 'First:'} {dateTime(e.first_seen_at)}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-brand-400 hover:text-brand-300 font-medium text-[11px] flex items-center gap-1">
                      <span>{locale === 'ar' ? 'عرض التفاصيل' : 'Details'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink-100 mb-4">{locale === 'ar' ? 'المسح حسب المطعم' : 'Scans by Restaurant'}</h3>
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
        emptyTitle={locale === 'ar' ? 'لا توجد عمليات مسح' : 'No AI scans found'}
      />

      {/* Add New Key Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={locale === 'ar' ? 'إضافة API Key جديد للحساب' : 'Add New Gemini API Key'}
        description={locale === 'ar' 
          ? 'أضف مفتاح API لحساب Google جديد لتوسيعه في شبكة الـ Failover التلقائية.'
          : 'Add an API Key from another Google account for automatic failover.'}
        icon={<Key className="w-5 h-5 text-amber-400" />}
        size="md"
      >
        <form onSubmit={handleCreateKey} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-ink-200 block mb-1">
              {locale === 'ar' ? 'اسم الحساب أو المسمى التوضيحي' : 'Account Label'}
            </label>
            <input 
              type="text" 
              required 
              placeholder={locale === 'ar' ? 'مثال: أكونت الشركة 2، جيميل شخصي' : 'e.g., Secondary Google Account'}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-200 block mb-1">
              {locale === 'ar' ? 'مفتاح الـ API (Gemini API Key)' : 'Gemini API Key'}
            </label>
            <input 
              type="password" 
              required 
              placeholder="AIzaSy..."
              value={newKey}
              onChange={e => {
                setNewKey(e.target.value);
                setTestResult(null);
              }}
              className="input-field font-mono text-xs w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-200 block mb-1">
              {locale === 'ar' ? 'درجة الأولوية (Priority)' : 'Priority Order'}
            </label>
            <input 
              type="number" 
              min={1} 
              max={99}
              value={newPriority}
              onChange={e => setNewPriority(parseInt(e.target.value) || 1)}
              className="input-field w-28 text-center"
            />
            <p className="text-[11px] text-ink-400 mt-1">
              {locale === 'ar' ? 'رقم 1 هو الأعلى أولوية، يليه رقم 2 كبديل عند انتهاء الكوتة، ثم 3 وهكذا.' : '1 is highest priority, 2 is first fallback, 3 is second fallback, etc.'}
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              testResult.success ? 'bg-success-500/15 border border-success-500/30 text-success-300' : 'bg-danger-500/15 border border-danger-500/30 text-danger-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-success-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-ink-800">
            <button 
              type="button" 
              onClick={handleTestCandidateKey}
              disabled={testingKey || !newKey.trim()}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
              <span>{locale === 'ar' ? 'اختبار المفتاح قبل الحفظ' : 'Test Key'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="btn-ghost text-xs"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="submit" 
                disabled={savingKey || !newKey.trim() || !newLabel.trim()}
                className="btn-primary text-xs"
              >
                {savingKey ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ المفتاح' : 'Save Key')}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ERROR DETAILS MODAL */}
      <Modal
        open={!!selectedError}
        onClose={() => setSelectedError(null)}
        title={locale === 'ar' ? 'تفاصيل الخطأ وتشخيصه الكامل' : 'Error Details & Diagnostics'}
        description={locale === 'ar' ? 'التفاصيل الزمنية، الموديل المتأثر، والمطاعم التي تعرضت للخطأ.' : 'Timestamps, affected model, and affected restaurants.'}
        icon={<AlertCircle className="w-5 h-5 text-danger-400" />}
        size="lg"
      >
        {selectedError && (
          <div className="space-y-4 pt-1">
            {/* Meta Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center p-3 rounded-xl bg-ink-900/60 border border-ink-800 text-xs">
              <div>
                <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'إجمالي التكرار' : 'Total Count'}</span>
                <span className="font-bold text-danger-400 text-sm tabular-nums">{num(selectedError.count)}</span>
              </div>
              <div>
                <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'الموديل المتأثر' : 'Model'}</span>
                <span className="font-mono text-ink-200 text-xs">{selectedError.model || 'gemini'}</span>
              </div>
              <div>
                <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'أول ظهور' : 'First Seen'}</span>
                <span className="text-ink-200 text-xs">{selectedError.first_seen_at ? dateTime(selectedError.first_seen_at) : '—'}</span>
              </div>
              <div>
                <span className="text-ink-400 text-[10px] block">{locale === 'ar' ? 'آخر ظهور' : 'Last Seen'}</span>
                <span className="text-ink-200 text-xs font-semibold">{selectedError.last_seen_at ? dateTime(selectedError.last_seen_at) : '—'}</span>
              </div>
            </div>

            {/* Category & Diagnosis Advice */}
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-brand-300">{selectedError.category || (locale === 'ar' ? 'تشخيص النظام' : 'System Diagnosis')}</span>
              </div>
              <p className="text-ink-300 leading-relaxed">
                {selectedError.category?.includes('Rate Limit')
                  ? (locale === 'ar' ? 'تم الوصول لحد معدل الطلبات المجاني لـ Gemini. تقوم مصفوفة الـ Multi-Key الآن بالتحويل التلقائي للمفتاح التالي في الحساب الآخر فوراً لتجنب توقف المستخدمين.' : 'Google Free Tier RPM limit hit. Multi-account key failover automatically routes requests to the next key.')
                  : selectedError.category?.includes('Model Deprecated')
                  ? (locale === 'ar' ? 'الموديل القديم تم إيقافه رسمياً من جوجل. تم تحديث كود الاستخراج إلى الموديلات الأحدث gemini-2.5-flash و gemini-3.8-flash لتفادي تكرار هذا الخطأ.' : 'Legacy model was retired by Google. Candidate models have been updated to gemini-2.5-flash and gemini-3.8-flash.')
                  : selectedError.category?.includes('Invalid')
                  ? (locale === 'ar' ? 'المفتاح غير مفعّل أو تم حذفه من Google Cloud Console. يرجى مراجعة قسم مصفوفة المفاتيح بالأعلى والتحقق من صحة المفتاح.' : 'API Key is invalid or not registered. Check the Key Pool section above.')
                  : (locale === 'ar' ? 'خطأ في الاتصال بالشبكة أو مهلة انتظار مزود الـ OCR/Gemini. تم ضبط مهلة المعالجة تلقائياً لتفادي الانقطاع.' : 'Network or upstream provider timeout. Timeouts have been calibrated automatically.')}
              </p>
            </div>

            {/* Full Error Message Box with Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink-300">{locale === 'ar' ? 'نص رسالة الخطأ بالكامل' : 'Full Error Message'}</label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedError.raw_error || selectedError.error);
                    setCopiedError(true);
                    setTimeout(() => setCopiedError(false), 2000);
                  }}
                  className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-ink-400 hover:text-ink-100"
                >
                  {copiedError ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedError ? (locale === 'ar' ? 'تم النسخ' : 'Copied') : (locale === 'ar' ? 'نسخ الخطأ' : 'Copy')}</span>
                </button>
              </div>
              <pre className="p-3 bg-ink-950 rounded-xl border border-ink-800 text-xs font-mono text-danger-300 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed" dir="ltr">
                {selectedError.raw_error || selectedError.error}
              </pre>
            </div>

            {/* Recent Affected Scans */}
            {selectedError.recent_occurrences && selectedError.recent_occurrences.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-300 mb-2">{locale === 'ar' ? 'آخر العمليات والمطاعم المتأثرة' : 'Recent Affected Scans & Restaurants'}</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedError.recent_occurrences.map((occ, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-ink-900/50 border border-ink-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-200">{occ.restaurant_name}</span>
                        <span className="font-mono text-[10px] text-ink-500">{occ.scan_id.slice(0, 10)}...</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-400">
                        <span>{durationSec(occ.duration_ms)}</span>
                        <span>•</span>
                        <span>{occ.created_at ? dateTime(occ.created_at) : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-ink-800">
              <button onClick={() => setSelectedError(null)} className="btn-secondary text-xs">
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
