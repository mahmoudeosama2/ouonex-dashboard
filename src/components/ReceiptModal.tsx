import { useState, useEffect } from 'react';
import { X, Receipt, Loader2, ImageIcon, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  open: boolean;
  receiptUrl: string | null;
  onClose: () => void;
}

export function ReceiptModal({ open, receiptUrl, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (open) {
      setLoaded(false);
      setFailed(false);
      setZoom(1);
      setRotation(0);
      setFullscreen(false);
    }
  }, [open, receiptUrl]);

  if (!open) return null;

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const rotate = () => setRotation(r => (r + 90) % 360);

  const containerClass = fullscreen
    ? 'fixed inset-0 z-[96] bg-ink-970 flex flex-col'
    : 'relative w-full max-w-lg card shadow-pop animate-scale-in overflow-hidden';

  return (
    <div className={fullscreen ? '' : 'fixed inset-0 z-[95] flex items-center justify-center p-4'} onClick={fullscreen ? undefined : onClose}>
      {!fullscreen && <div className="absolute inset-0 bg-ink-970/90 backdrop-blur-sm animate-fade-in" />}
      <div
        className={containerClass}
        onClick={e => { if (!fullscreen) e.stopPropagation(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-800 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-ink-100">Payment Receipt</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFullscreen(f => !f)} className="btn-ghost p-1.5" title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className={`flex items-center justify-center bg-ink-950 ${fullscreen ? 'flex-1 overflow-auto' : 'p-4 min-h-[300px]'}`}>
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
              className={`max-w-full max-h-[400px] rounded-lg object-contain transition-all duration-200 ${loaded ? 'opacity-100' : 'opacity-0 absolute'} ${fullscreen ? 'max-h-[80vh]' : ''}`}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
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

        {/* Controls */}
        {loaded && !failed && (
          <div className="flex items-center justify-center gap-2 p-3 border-t border-ink-800 shrink-0">
            <button onClick={zoomOut} disabled={zoom <= 0.5} className="btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-ink-400 tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} disabled={zoom >= 3} className="btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-ink-800 mx-1" />
            <button onClick={rotate} className="btn-ghost p-2" title="Rotate 90°">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
