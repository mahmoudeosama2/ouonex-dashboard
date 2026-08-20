import { useId } from 'react';

// ── Color system ─────────────────────────────────────────
export const CHART_COLORS = {
  brand: '#06b6d4',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  pink: '#ec4899',
  ink: '#525c75',
};

// ── LineChart ────────────────────────────────────────────
interface LinePoint { date: string; value: number; }
interface LineChartProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  fill?: boolean;
  format?: (n: number) => string;
}

export function LineChart({ data, height = 200, color = CHART_COLORS.brand, fill = true, format }: LineChartProps) {
  const id = useId();
  const w = 800;
  const h = height;
  const pad = { l: 8, r: 8, t: 12, b: 24 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = Math.min(...data.map(d => d.value)) * 0.9;
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * iw,
    y: pad.t + ih - ((d.value - min) / range) * ih,
    ...d,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${path} L${pts[pts.length - 1]?.x},${pad.t + ih} L${pts[0]?.x},${pad.t + ih} Z`;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => pad.t + ih - f * ih);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line key={i} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#3a4152" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      ))}
      {fill && <path d={areaPath} fill={`url(#grad-${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize="10" fill="#8590a8">
              {new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          )}
          <circle cx={p.x} cy={p.y} r="3" fill={color} className="opacity-0 hover:opacity-100 transition-opacity">
            <title>{format ? format(p.value) : p.value}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ── BarChart ──────────────────────────────────────────────
interface BarItem { label: string; value: number; color?: string; }
export function BarChart({ data, height = 200, format }: { data: BarItem[]; height?: number; format?: (n: number) => string }) {
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  return (
    <div className="flex items-end gap-2 h-full" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="w-full flex-1 flex items-end relative">
            <div
              className="w-full rounded-t-md transition-all duration-500 group-hover:brightness-125 relative"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? CHART_COLORS.brand, minHeight: '4px' }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xs font-semibold text-ink-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {format ? format(d.value) : d.value}
              </span>
            </div>
          </div>
          <span className="text-2xs text-ink-400 truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── DonutChart ───────────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string; }
export function DonutChart({ data, size = 160, thickness = 22 }: { data: DonutSlice[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-ink-100 font-bold" fontSize="20">
          {total.toLocaleString('en-US')}
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-ink-300">{d.label}</span>
            <span className="text-xs font-semibold text-ink-100 ml-auto">{d.value.toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────
export function Sparkline({ data, color = CHART_COLORS.brand, height = 36 }: { data: number[]; color?: string; height?: number }) {
  const w = 100;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
