import { useEffect, useState, useCallback } from 'react';
import {
  LifeBuoy, Mail, Phone, Calendar, CheckCircle2, Clock, AlertTriangle,
  Trash2, X, Eye, ExternalLink, MessageSquare, Image, RefreshCw, Filter, Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { date, timeAgo } from '@/lib/format';
import { useLocale } from '@/context/LocaleContext';

interface SupportTicket {
  id: number;
  user_id?: number | null;
  app: 'dawaty' | 'digital_menu';
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  screenshot_path?: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

interface DeletionRequest {
  id: number;
  app: 'dawaty' | 'digital_menu';
  email: string;
  phone?: string;
  store_name?: string;
  reason?: string;
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
}

export function SupportPage() {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'tickets' | 'deletions'>('tickets');
  const [overview, setOverview] = useState({ pending_deletions: 0, open_tickets: 0, total_tickets: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketStatus, setTicketStatus] = useState('all');
  const [ticketApp, setTicketApp] = useState('all');

  // Deletions state
  const [deletions, setDeletions] = useState<DeletionRequest[]>([]);
  const [deletionStatus, setDeletionStatus] = useState('all');
  const [deletionApp, setDeletionApp] = useState('all');

  // Screenshot modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const ovRes = await api.support.overview();
      setOverview(ovRes.data);

      if (activeTab === 'tickets') {
        const tRes = await api.support.tickets({
          status: ticketStatus === 'all' ? undefined : ticketStatus,
          app: ticketApp === 'all' ? undefined : ticketApp,
        });
        setTickets(tRes.data || []);
      } else {
        const dRes = await api.support.deletionRequests({
          status: deletionStatus === 'all' ? undefined : deletionStatus,
          app: deletionApp === 'all' ? undefined : deletionApp,
        });
        setDeletions(dRes.data || []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab, ticketStatus, ticketApp, deletionStatus, deletionApp]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateTicketStatus = async (id: number, status: 'open' | 'in_progress' | 'resolved') => {
    try {
      await api.support.updateTicket(id, status);
      setTickets(prev => prev.map(tItem => tItem.id === id ? { ...tItem, status } : tItem));
      if (status === 'resolved') {
        setOverview(prev => ({ ...prev, open_tickets: Math.max(0, prev.open_tickets - 1) }));
      }
    } catch {
      alert(locale === 'ar' ? 'فشل تحديث حالة التذكرة.' : 'Failed to update ticket status.');
    }
  };

  const handleExecuteDeletion = async (id: number, email: string) => {
    if (!window.confirm(locale === 'ar' ? `هل أنت متأكد من حذف الحساب "${email}" نهائياً؟` : `Are you sure you want to permanently execute deletion for "${email}"? This will delete all associated records.`)) {
      return;
    }
    try {
      await api.support.executeDeletion(id);
      setDeletions(prev => prev.map(d => d.id === id ? { ...d, status: 'completed' } : d));
      setOverview(prev => ({ ...prev, pending_deletions: Math.max(0, prev.pending_deletions - 1) }));
      alert(locale === 'ar' ? `تم حذف حساب ${email} بنجاح.` : `Account for ${email} has been deleted successfully.`);
    } catch {
      alert(locale === 'ar' ? 'فشل تنفيذ حذف الحساب.' : 'Failed to execute account deletion.');
    }
  };

  const handleDismissDeletion = async (id: number) => {
    try {
      await api.support.dismissDeletion(id);
      setDeletions(prev => prev.map(d => d.id === id ? { ...d, status: 'dismissed' } : d));
      setOverview(prev => ({ ...prev, pending_deletions: Math.max(0, prev.pending_deletions - 1) }));
    } catch {
      alert(locale === 'ar' ? 'فشل رفض الطلب.' : 'Failed to dismiss request.');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('support.title')}
        description={t('support.description')}
        icon={<LifeBuoy className="w-5 h-5 text-brand-400" />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard
          label={t('support.kpi_deletions')}
          value={overview.pending_deletions}
          format="num"
          icon={<Trash2 className="w-4 h-4" />}
          accent={overview.pending_deletions > 0 ? 'danger' : 'neutral'}
        />
        <KPICard
          label={t('support.kpi_open')}
          value={overview.open_tickets}
          format="num"
          icon={<MessageSquare className="w-4 h-4" />}
          accent={overview.open_tickets > 0 ? 'warning' : 'success'}
        />
        <KPICard
          label={t('support.kpi_total')}
          value={overview.total_tickets}
          format="num"
          icon={<LifeBuoy className="w-4 h-4" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-ink-800 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'tickets'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('support.tab_tickets')}</span>
            {overview.open_tickets > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {overview.open_tickets}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deletions')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'deletions'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('support.tab_deletions')}</span>
            {overview.pending_deletions > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-3xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {overview.pending_deletions}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition"
          title={locale === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <ErrorState message={locale === 'ar' ? 'فشل تحميل سجلات الدعم والطلبات.' : 'Failed to load support records.'} onRetry={loadData} />
      ) : activeTab === 'tickets' ? (
        /* TAB 1: SUPPORT TICKETS */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-ink-900 border border-ink-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-ink-400 font-medium">{t('finance.th_product')}:</span>
              <select
                value={ticketApp}
                onChange={e => setTicketApp(e.target.value)}
                className="input py-1 px-2.5 bg-ink-950 text-xs"
              >
                <option value="all">{t('common.all')}</option>
                <option value="dawaty">Dawaty</option>
                <option value="digital_menu">Digital Menu</option>
              </select>

              <span className="text-ink-400 font-medium ml-2">{t('common.status')}:</span>
              <select
                value={ticketStatus}
                onChange={e => setTicketStatus(e.target.value)}
                className="input py-1 px-2.5 bg-ink-950 text-xs"
              >
                <option value="all">{t('common.all')}</option>
                <option value="open">{locale === 'ar' ? 'مفتوحة' : 'Open'}</option>
                <option value="in_progress">{locale === 'ar' ? 'قيد المتابعة' : 'In Progress'}</option>
                <option value="resolved">{locale === 'ar' ? 'تم الحل' : 'Resolved'}</option>
              </select>
            </div>

            <span className="text-ink-500 text-2xs">
              {locale === 'ar' ? `تم العثور على ${tickets.length} تذكرة` : `${tickets.length} tickets found`}
            </span>
          </div>

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={<MessageSquare className="w-6 h-6 text-brand-400" />}
                title="No support tickets"
                message="No tickets have been submitted matching your filter."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="card p-5 border border-ink-800/80 hover:border-ink-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-ink-800/60">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-2xs font-bold uppercase ${
                        t.app === 'dawaty'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {t.app === 'dawaty' ? '💌 Dawaty' : '🍽️ Digital Menu'}
                      </span>
                      <h4 className="font-semibold text-sm text-ink-100">{t.subject || (locale === 'ar' ? 'طلب دعم' : 'Support Request')}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-bold ${
                        t.status === 'open'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : t.status === 'in_progress'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {t.status === 'open' ? (locale === 'ar' ? 'مفتوحة' : 'Open') : t.status === 'in_progress' ? (locale === 'ar' ? 'قيد المتابعة' : 'In Progress') : (locale === 'ar' ? 'تم الحل' : 'Resolved')}
                      </span>
                      <span className="text-2xs text-ink-500">{timeAgo(t.created_at)}</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400">
                    <span className="font-medium text-ink-200">{locale === 'ar' ? `من: ${t.name}` : `From: ${t.name}`}</span>
                    {t.email && (
                      <a href={`mailto:${t.email}`} className="flex items-center gap-1 text-brand-400 hover:underline">
                        <Mail className="w-3 h-3" /> {t.email}
                      </a>
                    )}
                    {t.phone && (
                      <span className="flex items-center gap-1 text-ink-300">
                        <Phone className="w-3 h-3" /> {t.phone}
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <div className="p-3.5 rounded-xl bg-ink-950/60 border border-ink-800 text-xs text-ink-200 leading-relaxed whitespace-pre-wrap">
                    {t.message}
                  </div>

                  {/* Screenshot Preview */}
                  {t.screenshot_path && (
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        onClick={() => setPreviewImage(t.screenshot_path!)}
                        className="group flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-ink-950 border border-ink-800 hover:border-brand-500/50 transition"
                      >
                        <img
                          src={t.screenshot_path}
                          alt="Thumbnail"
                          className="w-10 h-10 rounded object-cover border border-ink-700 group-hover:scale-105 transition"
                        />
                        <div className="text-left">
                          <p className="text-2xs font-semibold text-brand-400 flex items-center gap-1">
                            <Image className="w-3 h-3" /> {locale === 'ar' ? 'عرض لقطة الشاشة المرفقة' : 'View Attached Screenshot'}
                          </p>
                          <p className="text-3xs text-ink-500">{locale === 'ar' ? 'انقر للتكبير' : 'Click to enlarge'}</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between border-t border-ink-800/40 text-xs">
                    <span className="text-2xs text-ink-500">{locale === 'ar' ? `تذكرة رقم #${t.id} · ${date(t.created_at)}` : `Ticket #${t.id} · ${date(t.created_at)}`}</span>

                    <div className="flex items-center gap-2">
                      {t.status !== 'resolved' ? (
                        <button
                          onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-2xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition"
                        >
                          <Check className="w-3 h-3" /> {locale === 'ar' ? 'تحديد كمحلولة' : 'Mark as Resolved'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateTicketStatus(t.id, 'open')}
                          className="px-3 py-1.5 rounded-lg text-2xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-300 transition"
                        >
                          {locale === 'ar' ? 'إعادة فتح التذكرة' : 'Reopen Ticket'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: DELETION REQUESTS & FEEDBACK */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-ink-900 border border-ink-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-ink-400 font-medium">{locale === 'ar' ? 'تصفية التطبيق:' : 'Filter App:'}</span>
              <select
                value={deletionApp}
                onChange={e => setDeletionApp(e.target.value)}
                className="input py-1 px-2.5 bg-ink-950 text-xs"
              >
                <option value="all">{t('common.all')}</option>
                <option value="dawaty">Dawaty</option>
                <option value="digital_menu">Digital Menu</option>
              </select>

              <span className="text-ink-400 font-medium ml-2">{t('common.status')}:</span>
              <select
                value={deletionStatus}
                onChange={e => setDeletionStatus(e.target.value)}
                className="input py-1 px-2.5 bg-ink-950 text-xs"
              >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{locale === 'ar' ? 'قيد المراجعة' : 'Pending Review'}</option>
                <option value="completed">{locale === 'ar' ? 'تم الحذف' : 'Completed'}</option>
                <option value="dismissed">{locale === 'ar' ? 'مؤرشف' : 'Dismissed'}</option>
              </select>
            </div>

            <span className="text-ink-500 text-2xs">
              {locale === 'ar' ? `تم العثور على ${deletions.length} طلب` : `${deletions.length} requests found`}
            </span>
          </div>

          {/* Deletion Requests List */}
          {deletions.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={<Trash2 className="w-6 h-6 text-rose-400" />}
                title={locale === 'ar' ? 'لا توجد طلبات حذف' : 'No deletion requests'}
                message={locale === 'ar' ? 'لم يتم العثور على طلبات حذف تطابق معايير التصفية.' : 'No account deletion requests found matching your filter.'}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map(d => (
                <div key={d.id} className="card p-5 border border-ink-800/80 hover:border-ink-700 transition space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-ink-800/60">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-2xs font-bold uppercase ${
                        d.app === 'dawaty'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {d.app === 'dawaty' ? '💌 Dawaty' : '🍽️ Digital Menu'}
                      </span>
                      <span className="font-semibold text-sm text-ink-100">{d.email}</span>
                      {d.store_name && <span className="text-xs text-ink-400 font-mono">({d.store_name})</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-bold ${
                        d.status === 'pending'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : d.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-ink-800 text-ink-400 border border-ink-700'
                      }`}>
                        {d.status === 'pending'
                          ? (locale === 'ar' ? 'قيد المراجعة' : 'Pending Review')
                          : d.status === 'completed'
                          ? (locale === 'ar' ? 'تم الحذف بنجاح' : 'Deleted & Completed')
                          : (locale === 'ar' ? 'مؤرشف' : 'Dismissed')}
                      </span>
                      <span className="text-2xs text-ink-500">{timeAgo(d.created_at)}</span>
                    </div>
                  </div>

                  {/* Requester Contact */}
                  <div className="flex items-center gap-4 text-xs text-ink-400">
                    <span>{locale === 'ar' ? 'البريد الإلكتروني المسجل:' : 'Registered Email:'} <strong className="text-ink-200">{d.email}</strong></span>
                    {d.phone && <span>{locale === 'ar' ? 'الهاتف:' : 'Phone:'} <strong className="text-ink-200">{d.phone}</strong></span>}
                  </div>

                  {/* Feedback / Reason Box */}
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                    <span className="font-bold text-amber-400 block text-2xs uppercase tracking-wider">
                      💡 {locale === 'ar' ? 'سبب طلب الحذف وملاحظات المستخدم:' : 'Reason for Deletion & User Feedback:'}
                    </span>
                    <p className="text-ink-200 leading-relaxed italic">
                      {d.reason ? `"${d.reason}"` : <span className="text-ink-500 not-italic">{locale === 'ar' ? 'لم يقدم المستخدم ملاحظات.' : 'No feedback provided by the user.'}</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-ink-800/40 text-xs">
                    <span className="text-2xs text-ink-500">{locale === 'ar' ? `طلب رقم #${d.id} · ${date(d.created_at)}` : `Request #${d.id} · ${date(d.created_at)}`}</span>

                    <div className="flex items-center gap-2">
                      {d.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleDismissDeletion(d.id)}
                            className="px-3 py-1.5 rounded-lg text-2xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-300 transition"
                          >
                            {locale === 'ar' ? 'أرشفة' : 'Dismiss'}
                          </button>

                          <button
                            onClick={() => handleExecuteDeletion(d.id, d.email)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-2xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {locale === 'ar' ? 'تنفيذ الحذف الآن' : 'Delete Account Now'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-ink-950 border border-ink-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800 bg-ink-900">
              <span className="text-xs font-semibold text-ink-100 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-brand-400" /> Attached Screenshot Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-ink-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-ink-400 hover:text-white rounded-lg hover:bg-ink-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center flex-1 bg-black/40">
              <img
                src={previewImage}
                alt="Enlarged Screenshot"
                className="max-h-[75vh] w-auto object-contain rounded-lg border border-ink-800 shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
