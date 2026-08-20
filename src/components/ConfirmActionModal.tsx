import { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { StatusBadge } from './Badge';
import { egp } from '@/lib/format';
import type { Payment } from '@/lib/types';

interface Props {
  open: boolean;
  payment: Payment | null;
  action: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ConfirmActionModal({ open, payment, action, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  const isReject = action === 'reject';
  const valid = !isReject || reason.trim().length >= 3;

  if (!payment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReject ? 'Reject payment' : 'Approve payment'}
      description={isReject ? 'A reason is required for audit purposes.' : 'Confirm this payment has been received.'}
      icon={
        isReject ? (
          <div className="w-9 h-9 rounded-full bg-danger-500/10 flex items-center justify-center"><X className="w-4.5 h-4.5 text-danger-400" /></div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-success-500/10 flex items-center justify-center"><Check className="w-4.5 h-4.5 text-success-400" /></div>
        )
      }
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onConfirm(isReject ? reason.trim() : undefined)}
            disabled={!valid}
            className={isReject ? 'btn-danger' : 'btn-success'}
          >
            {isReject ? 'Reject payment' : 'Approve payment'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-lg bg-ink-950 border border-ink-800 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">Reference</span>
            <span className="text-sm font-mono text-ink-100">{payment.reference_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">From</span>
            <span className="text-sm text-ink-100">{payment.user_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">Amount</span>
            <span className="text-sm font-semibold text-ink-100">{egp(payment.submitted_amount)}</span>
          </div>
          {payment.expected_amount !== payment.submitted_amount && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">Expected</span>
              <span className="text-sm text-warning-400 font-medium">{egp(payment.expected_amount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">Method</span>
            <span className="text-sm text-ink-100">{payment.method}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">Current status</span>
            <StatusBadge status={payment.status} />
          </div>
        </div>
        {isReject && (
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">Reason for rejection</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Reference number not found in payment system"
              rows={3}
              className="input w-full resize-none"
            />
            {reason.length > 0 && reason.length < 3 && (
              <p className="text-xs text-danger-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Reason must be at least 3 characters
              </p>
            )}
          </div>
        )}
        {isReject && (
          <div className="flex items-start gap-2 rounded-lg bg-danger-500/5 border border-danger-500/20 p-3">
            <AlertTriangle className="w-4 h-4 text-danger-400 mt-0.5 shrink-0" />
            <p className="text-xs text-ink-300">The user will be notified that their payment was rejected. This action is logged in the audit trail.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
