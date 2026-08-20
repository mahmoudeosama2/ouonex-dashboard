import type { PaymentStatus, InvitationStatus, RestaurantStatus, Order } from '@/lib/types';

const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  pending_review: { label: 'Pending Review', cls: 'bg-warning-500/15 text-warning-400 border border-warning-500/30', dot: 'bg-warning-400' },
  paid: { label: 'Paid', cls: 'bg-success-500/15 text-success-400 border border-success-500/30', dot: 'bg-success-400' },
  rejected: { label: 'Rejected', cls: 'bg-danger-500/15 text-danger-400 border border-danger-500/30', dot: 'bg-danger-400' },
  draft: { label: 'Draft', cls: 'bg-ink-500/15 text-ink-300 border border-ink-600/40', dot: 'bg-ink-400' },
  published: { label: 'Published', cls: 'bg-accent-500/15 text-accent-400 border border-accent-500/30', dot: 'bg-accent-400' },
  expired: { label: 'Expired', cls: 'bg-ink-500/10 text-ink-400 border border-ink-700/40 line-through', dot: 'bg-ink-500' },
  active: { label: 'Active', cls: 'bg-success-500/15 text-success-400 border border-success-500/30', dot: 'bg-success-400' },
  suspended: { label: 'Suspended', cls: 'bg-danger-500/15 text-danger-400 border border-danger-500/30', dot: 'bg-danger-400' },
  trial: { label: 'Trial', cls: 'bg-warning-500/15 text-warning-400 border border-warning-500/30', dot: 'bg-warning-400' },
  pending: { label: 'Pending', cls: 'bg-warning-500/15 text-warning-400 border border-warning-500/30', dot: 'bg-warning-400' },
  preparing: { label: 'Preparing', cls: 'bg-accent-500/15 text-accent-400 border border-accent-500/30', dot: 'bg-accent-400' },
  ready: { label: 'Ready', cls: 'bg-brand-500/15 text-brand-400 border border-brand-500/30', dot: 'bg-brand-400' },
  completed: { label: 'Completed', cls: 'bg-success-500/15 text-success-400 border border-success-500/30', dot: 'bg-success-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-ink-500/15 text-ink-400 border border-ink-600/40', dot: 'bg-ink-500' },
  success: { label: 'Success', cls: 'bg-success-500/15 text-success-400 border border-success-500/30', dot: 'bg-success-400' },
  failed: { label: 'Failed', cls: 'bg-danger-500/15 text-danger-400 border border-danger-500/30', dot: 'bg-danger-400' },
};

type Status = PaymentStatus | InvitationStatus | RestaurantStatus | Order['status'] | 'success' | 'failed';

export function StatusBadge({ status }: { status: Status }) {
  const s = MAP[status] ?? MAP.draft;
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: 'free' | 'pro' | 'enterprise' }) {
  const cls = plan === 'enterprise' ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
    : plan === 'pro' ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
    : 'bg-ink-500/15 text-ink-300 border border-ink-600/40';
  return <span className={`badge ${cls}`}>{plan}</span>;
}

export function ProductBadge({ product }: { product: 'dawaty' | 'digital_menu' }) {
  if (product === 'dawaty') {
    return <span className="badge bg-pink-500/10 text-pink-300 border border-pink-500/30">Dawaty</span>;
  }
  return <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/30">Digital Menu</span>;
}
