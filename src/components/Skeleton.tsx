export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-8 rounded-lg flex-1 ${c === 0 ? 'max-w-[180px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 rounded-2xl relative overflow-hidden bg-ink-950/40 border border-ink-800/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3.5 w-24 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-36 rounded-xl mb-3" />
      <Skeleton className="h-3.5 w-24 rounded-lg" />
    </div>
  );
}
