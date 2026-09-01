import { useEffect, useState, useCallback } from 'react';
import {
  MailOpen, Mail, Clock, Send, Loader2, Mailbox,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { SupportMessage, SupportMessageStatus } from '@/lib/types';
import { DataTable, type Column } from '@/components/DataTable';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { CardSkeleton } from '@/components/Skeleton';
import { ErrorState, EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/Layout';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';
import { dateTime, timeAgo } from '@/lib/format';

const STATUS_STYLES: Record<SupportMessageStatus, string> = {
  unread: 'bg-warning-500/15 text-warning-400 border border-warning-500/30',
  read: 'bg-ink-500/15 text-ink-300 border border-ink-600/40',
  replied: 'bg-success-500/15 text-success-400 border border-success-500/30',
};

export function SupportInbox() {
  const toast = useToast();
  const { t } = useLocale();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.support.list();
      setMessages(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRowClick = async (msg: SupportMessage) => {
    setSelected(msg);
    setDrawerOpen(true);
    if (msg.status === 'unread') {
      const updated = await api.support.markRead(msg.id);
      if (updated) {
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        setSelected(updated);
      }
    }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const updated = await api.support.reply(selected.id, replyText);
      if (updated) {
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        setSelected(updated);
        toast.success(t('support.reply_sent'), `${selected.name} · ${selected.email}`);
      }
      setReplyOpen(false);
      setReplyText('');
    } catch {
      toast.error('Reply failed', 'Could not send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  if (error) return <ErrorState message="Failed to load support messages." onRetry={load} />;

  const columns: Column<SupportMessage>[] = [
    {
      key: 'name', header: t('support.name'), sortValue: r => r.name,
      render: r => (
        <div className="flex items-center gap-2.5">
          {r.status === 'unread' && <span className="w-2 h-2 rounded-full bg-warning-400 shrink-0" />}
          <div className="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-semibold text-ink-200 shrink-0">
            {r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <span className="font-medium text-ink-100">{r.name}</span>
        </div>
      ),
    },
    { key: 'email', header: t('support.email'), sortValue: r => r.email, render: r => <span className="text-xs text-ink-400">{r.email}</span> },
    { key: 'project', header: t('support.project'), sortValue: r => r.project_type, render: r => <span className="text-xs text-ink-300">{r.project_type}</span> },
    { key: 'message', header: t('support.message'), render: r => <span className="text-xs text-ink-400 max-w-[280px] truncate block" title={r.message}>{r.message}</span> },
    {
      key: 'status', header: t('support.status'), sortValue: r => r.status,
      render: r => (
        <span className={`badge ${STATUS_STYLES[r.status]}`}>
          {r.status === 'unread' && <span className="w-1.5 h-1.5 rounded-full bg-warning-400" />}
          {r.status === 'replied' && <Send className="w-3 h-3" />}
          {t(`support.${r.status}`)}
        </span>
      ),
    },
    { key: 'created', header: t('support.received'), sortValue: r => r.created_at, render: r => <span className="text-xs text-ink-400">{timeAgo(r.created_at)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title={t('title.support')}
        description={t('support.description')}
        icon={<MailOpen className="w-5 h-5" />}
        actions={
          unreadCount > 0 ? (
            <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-400" />
              {unreadCount} unread
            </span>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : messages.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Mailbox className="w-5 h-5" />} title={t('support.no_messages')} message={t('support.no_messages_desc')} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={messages}
          loading={loading}
          onRowClick={handleRowClick}
          emptyTitle={t('support.no_messages')}
          emptyMessage={t('support.no_messages_desc')}
        />
      )}

      {/* Detail drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected?.name ?? ''}
        subtitle={selected?.email}
        footer={
          selected && selected.status !== 'replied' ? (
            <button onClick={() => { setReplyOpen(true); }} className="btn-primary w-full">
              <Send className="w-4 h-4" /> {t('support.reply')}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className={`badge ${STATUS_STYLES[selected.status]}`}>
                {selected.status === 'unread' && <span className="w-1.5 h-1.5 rounded-full bg-warning-400" />}
                {selected.status === 'replied' && <Send className="w-3 h-3" />}
                {t(`support.${selected.status}`)}
              </span>
              <span className="text-2xs text-ink-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {dateTime(selected.created_at)}
              </span>
            </div>

            <div>
              <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wide mb-1">{t('support.project')}</p>
              <p className="text-sm text-ink-100">{selected.project_type}</p>
            </div>

            <div>
              <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wide mb-1">{t('support.message')}</p>
              <div className="rounded-xl2 border border-ink-800 bg-ink-950/50 p-4">
                <p className="text-sm text-ink-200 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
            </div>

            {selected.reply && (
              <div>
                <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Your Reply</p>
                <div className="rounded-xl2 border border-success-500/20 bg-success-500/5 p-4">
                  <p className="text-sm text-ink-200 leading-relaxed whitespace-pre-wrap">{selected.reply}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reply modal */}
      <Modal
        open={replyOpen}
        onClose={() => { if (!sending) { setReplyOpen(false); setReplyText(''); } }}
        title={`Reply to ${selected?.name ?? ''}`}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
            <p className="text-xs text-ink-400 leading-relaxed line-clamp-3">{selected?.message}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">{t('support.reply')}</label>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={t('support.reply_placeholder')}
              className="input w-full min-h-[120px] resize-y"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setReplyOpen(false); setReplyText(''); }} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button onClick={handleReply} disabled={sending || !replyText.trim()} className="btn-primary">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('support.send_reply')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
