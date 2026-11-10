import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { type KPIDelta } from '@/lib/types';

/**
 * Ultra-smooth physics-based rolling number hook.
 * Decelerates smoothly using a quintic curve (1 - (1-p)^4).
 * Animates seamlessly between changes without jarring 0-flashes.
 */
function useSmoothNumber(target: number, duration = 800): number {
  const [val, setVal] = useState(target);
  const prevRef = useRef(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease-out for organic, non-linear deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * eased;
      setVal(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
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
  onClick?: () => void;
  actionHint?: string;
}

const FMT: Record<string, (n: number) => string> = {
  num: (n) => Math.round(n).toLocaleString('en-US'),
  egp: (n) => `EGP ${Math.round(n).toLocaleString('en-US')}`,
  compactEGP: (n) =>
    n >= 1_000_000
      ? `EGP ${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `EGP ${(n / 1_000).toFixed(1)}K`
      : `EGP ${Math.round(n)}`,
  compactNum: (n) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : Math.round(n).toLocaleString('en-US'),
};

export function KPICard({
  label,
  value,
  format = 'num',
  delta,
  icon,
  accent = 'default',
  highlight = false,
  onClick,
  actionHint,
}: Props) {
  const animated = useSmoothNumber(value);
  const fmt = FMT[format] ?? FMT.num;

  // 6-Layer Expensive Card Design: Depth, Rim Light, Concentric Geometries & Ambient Glow
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`card card-hover p-6 rounded-2xl relative overflow-hidden group select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isClickable ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${
        highlight
          ? 'ring-1 ring-warning-500/60 bg-gradient-to-b from-warning-500/[0.08] via-ink-900/90 to-ink-950/95 shadow-[0_0_28px_-4px_rgba(245,158,11,0.22),inset_0_1px_0_0_rgba(251,191,36,0.30)]'
          : accent === 'danger'
          ? 'ring-1 ring-danger-500/30 bg-gradient-to-b from-danger-500/[0.05] via-ink-900/90 to-ink-950/95'
          : accent === 'success'
          ? 'ring-1 ring-success-500/30 bg-gradient-to-b from-success-500/[0.05] via-ink-900/90 to-ink-950/95'
          : accent === 'warning'
          ? 'ring-1 ring-warning-500/30 bg-gradient-to-b from-warning-500/[0.05] via-ink-900/90 to-ink-950/95'
          : 'bg-gradient-to-b from-ink-900/90 to-ink-950/95'
      }`}
    >
      {/* Ambient Top Light Beam */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Header Row: Label & Concentric Icon Slot */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs font-semibold text-ink-300 uppercase tracking-wider line-clamp-1">
          {label}
        </p>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 ${
              highlight
                ? 'bg-warning-500/20 text-warning-400 ring-1 ring-warning-500/30'
                : accent === 'success'
                ? 'bg-success-500/15 text-success-400'
                : accent === 'warning'
                ? 'bg-warning-500/15 text-warning-400'
                : accent === 'danger'
                ? 'bg-danger-500/15 text-danger-400'
                : 'bg-ink-800/60 text-ink-400 group-hover:text-ink-100 group-hover:bg-ink-800'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric: Prominent, high contrast (87% white) & tabular nums */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-3xl font-extrabold text-ink-50 tabular-nums tracking-tight">
          {fmt(animated)}
        </p>

        {highlight && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning-500" />
          </span>
        )}
      </div>

      {/* Footer / Delta & Context */}
      {(delta || actionHint) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-ink-800/40 text-xs">
          {delta ? (
            <div className="flex items-center gap-1.5 font-medium">
              {delta.direction === 'up' && (
                <span className="inline-flex items-center gap-0.5 text-success-400 bg-success-500/10 px-1.5 py-0.5 rounded-md font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {delta.value > 0
                    ? `+${delta.value}${
                        typeof delta.value === 'number' && delta.value < 100 ? '%' : ''
                      }`
                    : delta.label}
                </span>
              )}
              {delta.direction === 'down' && (
                <span className="inline-flex items-center gap-0.5 text-danger-400 bg-danger-500/10 px-1.5 py-0.5 rounded-md font-semibold">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {delta.value > 0
                    ? `-${delta.value}${
                        typeof delta.value === 'number' && delta.value < 100 ? '%' : ''
                      }`
                    : delta.label}
                </span>
              )}
              {delta.direction === 'flat' && (
                <span className="inline-flex items-center gap-0.5 text-ink-400 bg-ink-800/40 px-1.5 py-0.5 rounded-md">
                  <Minus className="w-3.5 h-3.5" />
                  {delta.label}
                </span>
              )}
              <span className="text-ink-400 text-2xs truncate">{delta.label}</span>
            </div>
          ) : (
            <div />
          )}

          {actionHint && (
            <span className="text-2xs text-brand-400 font-medium group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform duration-200">
              {actionHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
