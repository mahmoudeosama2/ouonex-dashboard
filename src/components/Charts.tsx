import { useId, useState, useRef } from 'react';

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
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-500" style={{ height }}>
        No data available
      </div>
    );
  }

  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const w = 800;
  const h = height;
  const pad = { l: 12, r: 12, t: 14, b: 24 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const rawMax = Math.max(...data.map(d => d.value));
  const rawMin = Math.min(...data.map(d => d.value));
  const max = rawMax === 0 ? 100 : rawMax * 1.1;
  const min = rawMax === 0 ? 0 : Math.min(0, rawMin * 0.9);
  const range = max - min || 1;

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * iw,
    y: pad.t + ih - ((d.value - min) / range) * ih,
    ...d,
  }));

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L${pts[pts.length - 1]?.x.toFixed(1)},${pad.t + ih} L${pts[0]?.x.toFixed(1)},${pad.t + ih} Z`;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => pad.t + ih - f * ih);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;

    // Fractional progress from 0 to 1 along chart content
    const progress = Math.max(0, Math.min(1, (relX - (pad.l / w) * rect.width) / ((iw / w) * rect.width)));
    const index = Math.round(progress * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));

    setHoveredIdx(clampedIndex);
  };

  const handlePointerLeave = () => {
    setHoveredIdx(null);
  };

  const activePoint = hoveredIdx !== null ? pts[hoveredIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none cursor-crosshair group"
      style={{ height }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full block"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={pad.l}
            y1={y}
            x2={w - pad.r}
            y2={y}
            stroke="#3a4152"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.35"
          />
        ))}

        {/* Gradient area fill */}
        {fill && <path d={areaPath} fill={`url(#grad-${id})`} />}

        {/* Primary curve path */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis date labels */}
        {pts.map((p, i) => (
          <g key={i}>
            {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
              <text
                x={p.x}
                y={h - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#8590a8"
                className="font-mono"
              >
                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            )}
          </g>
        ))}

        {/* Active hovered point indicators */}
        {activePoint && (
          <g className="transition-all duration-75">
            {/* Vertical crosshair line */}
            <line
              x1={activePoint.x}
              y1={pad.t}
              x2={activePoint.x}
              y2={pad.t + ih}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.75"
            />
            {/* Outer halo */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="8"
              fill={color}
              fillOpacity="0.25"
            />
            {/* Inner core circle */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#ffffff"
              stroke={color}
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>

      {/* Floating Interactive Tooltip anchored to active hovered data point */}
      {activePoint && hoveredIdx !== null && (
        <div
          className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out"
          style={{
            left: `${(activePoint.x / w) * 100}%`,
            top: `${(activePoint.y / h) * 100}%`,
            transform: `translate(${
              hoveredIdx > data.length * 0.72 ? '-100%' : hoveredIdx < data.length * 0.28 ? '0%' : '-50%'
            }, ${activePoint.y < h * 0.38 ? '16px' : '-115%'})`,
          }}
        >
          <div className="bg-ink-950/95 border border-ink-700/80 backdrop-blur-md rounded-xl px-3 py-2 shadow-2xl min-w-[120px] text-center">
            <div className="text-2xs text-ink-400 font-medium whitespace-nowrap mb-0.5">
              {new Date(activePoint.date).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center justify-center gap-1.5 font-bold text-ink-50 font-mono text-sm">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="tabular-nums">
                {format ? format(activePoint.value) : activePoint.value.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BarChart ──────────────────────────────────────────────
interface BarItem { label: string; value: number; color?: string; }
export function BarChart({
  data,
  height = 200,
  format,
}: {
  data: BarItem[];
  height?: number;
  format?: (n: number) => string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-500" style={{ height }}>
        No data available
      </div>
    );
  }

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const max = Math.max(...data.map(d => d.value)) * 1.15 || 1;

  return (
    <div className="flex items-end gap-2 h-full relative" style={{ minHeight: height }}>
      {data.map((d, i) => {
        const isHovered = hoveredIdx === i;
        const hasHover = hoveredIdx !== null;
        const percent = ((d.value / total) * 100).toFixed(1);

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 relative group cursor-pointer"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Interactive Tooltip on Hover */}
            {isHovered && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                <div className="bg-ink-950/95 border border-ink-700/80 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-2xl text-center whitespace-nowrap min-w-[90px]">
                  <div className="text-2xs text-ink-400 font-medium">{d.label}</div>
                  <div className="text-xs font-bold text-ink-50 font-mono">
                    {format ? format(d.value) : d.value.toLocaleString()}
                  </div>
                  <div className="text-3xs text-ink-400 font-mono mt-0.5">
                    {percent}%
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex-1 flex items-end relative">
              <div
                className={`w-full rounded-t-md transition-all duration-300 relative ${
                  isHovered
                    ? 'brightness-125 shadow-lg scale-y-[1.02]'
                    : hasHover
                    ? 'opacity-60'
                    : ''
                }`}
                style={{
                  height: `${Math.max(4, (d.value / max) * 100)}%`,
                  backgroundColor: d.color ?? CHART_COLORS.brand,
                  minHeight: '4px',
                }}
              />
            </div>
            <span
              className={`text-2xs truncate max-w-full transition-colors ${
                isHovered ? 'text-ink-100 font-semibold' : 'text-ink-400'
              }`}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── DonutChart ───────────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string; }
export function DonutChart({
  data,
  size = 160,
  thickness = 22,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const hoveredSlice = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const isHovered = hoveredIdx === i;
              const len = (d.value / total) * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
              offset += len;
              return el;
            })}
          </g>
        </svg>

        {/* Center label showing dynamic slice detail on hover, or total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
          {hoveredSlice ? (
            <>
              <span className="text-2xs text-ink-400 truncate max-w-[80px] font-medium">{hoveredSlice.label}</span>
              <span className="text-base font-bold text-ink-100 font-mono">
                {hoveredSlice.value.toLocaleString('en-US')}
              </span>
              <span className="text-3xs text-ink-400 font-mono">
                {((hoveredSlice.value / total) * 100).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-bold text-ink-100 font-mono">
                {total.toLocaleString('en-US')}
              </span>
              <span className="text-3xs text-ink-400 uppercase tracking-wider">Total</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {data.map((d, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 p-1 rounded-md cursor-pointer transition-colors ${
                isHovered ? 'bg-ink-800/60' : 'hover:bg-ink-900/40'
              }`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
              <span className={`text-xs ${isHovered ? 'text-ink-100 font-medium' : 'text-ink-300'}`}>
                {d.label}
              </span>
              <span className="text-xs font-semibold text-ink-100 ml-auto font-mono">
                {d.value.toLocaleString('en-US')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────
export function Sparkline({
  data,
  color = CHART_COLORS.brand,
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-500" style={{ height }}>
        -
      </div>
    );
  }
  const w = 100;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
