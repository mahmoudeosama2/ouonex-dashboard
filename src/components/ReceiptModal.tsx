import { useState } from 'react';
import { X, Receipt, Loader2, ImageIcon } from 'lucide-react';

interface Props {
  open: boolean;
  receiptUrl: string | null;
  onClose: () => void;
}

export function ReceiptModal({ open, receiptUrl, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-970/90 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-lg card shadow-pop animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-ink-100">Payment Receipt</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 min-h-[300px] flex items-center justify-center bg-ink-950">
          {!loaded && !failed && (
            <div className="flex flex-col items-center gap-2 text-ink-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs">Loading receipt...</p>
            </div>
          )}
          {failed && (
            <div className="flex flex-col items-center gap-2 text-ink-400">
              <div className="w-12 h-12 rounded-full bg-ink-800 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-ink-200">Receipt image unavailable</p>
              <p className="text-xs text-ink-500">Reference: {receiptUrl ?? 'N/A'}</p>
            </div>
          )}
          {receiptUrl && !failed && (
            <img
              src={receiptUrl}
              alt="Payment receipt"
              className={`max-w-full max-h-[400px] rounded-lg object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              onLoad={() => setLoaded(true)}
              onError={() => { setFailed(true); setLoaded(false); }}
            />
          )}
          {!receiptUrl && (
            <div className="flex flex-col items-center gap-2 text-ink-400">
              <div className="w-12 h-12 rounded-full bg-ink-800 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-ink-200">No receipt attached</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
