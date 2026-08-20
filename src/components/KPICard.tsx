import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { type KPIDelta } from '@/lib/types';

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

interface Props {
  label: string;
  value: number;
  format?: 'num' | 'egp' | 'compactEGP' | 'compactNum';
  delta?: KPIDelta;
  icon?: React.ReactNode;
  accent?: 'default' | 'warning' | 'danger' | 'success';
  highlight?: boolean;
}

const FMT: Record<string, (n: number) => string> = {
  num: (n) => Math.round(n).toLocaleString('en-US'),
  egp: (n) => `EGP ${Math.round(n).toLocaleString('en-US')}`,
  compactEGP: (n) => n >= 1_000_000 ? `EGP ${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `EGP ${(n / 1_000).toFixed(1)}K` : `EGP ${Math.round(n)}`,
  compactNum: (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : Math.round(n).toLocaleString('en-US'),
};

export function KPICard({ label, value, format = 'num', delta, icon, accent = 'default', highlight = false }: Props) {
  const animated = useCountUp(value);
  const fmt = FMT[format] ?? FMT.num;

  const accentRing = highlight
    ? 'ring-2 ring-warning-500/40 shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]'
    : accent === 'danger' ? 'ring-1 ring-danger-500/20'
    : accent === 'success' ? 'ring-1 ring-success-500/20'
    : '';

  return (
    <div className={`card card-hover p-5 relative overflow-hidden ${accentRing}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</p>
        {icon && <div className="text-ink-400">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-ink-50 tabular-nums tracking-tight">{fmt(animated)}</p>
      {delta && (
        <div className="flex items-center gap-1.5 mt-2">
          {delta.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-success-400" />}
          {delta.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-danger-400" />}
          {delta.direction === 'flat' && <Minus className="w-3.5 h-3.5 text-ink-400" />}
          <span className={`text-xs font-medium ${delta.direction === 'up' ? 'text-success-400' : delta.direction === 'down' ? 'text-danger-400' : 'text-ink-400'}`}>
            {delta.value > 0 && delta.direction !== 'flat' ? `${delta.value > 0 ? '+' : ''}${delta.value}${typeof delta.value === 'number' && delta.value < 100 ? '%' : ''}` : delta.label}
          </span>
          <span className="text-xs text-ink-500">{delta.label}</span>
        </div>
      )}
    </div>
  );
}
