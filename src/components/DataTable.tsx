import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  page?: number;
  perPage?: number;
  total?: number;
  onPageChange?: (p: number) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns, rows, loading, emptyTitle = 'No results', emptyMessage = 'Try adjusting your filters or search.',
  onRowClick, rowActions, page = 1, perPage = 10, total = 0, onPageChange,
  sortKey, sortDir, onSort,
}: Props<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const effectiveSort = sortKey ? { key: sortKey, dir: sortDir ?? 'asc' } : localSort;
  const sorted = effectiveSort ? [...rows].sort((a, b) => {
    const col = columns.find(c => c.key === effectiveSort!.key);
    if (!col?.sortValue) return 0;
    const av = col.sortValue(a);
    const bv = col.sortValue(b);
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return effectiveSort!.dir === 'asc' ? cmp : -cmp;
  }) : rows;

  const handleSort = (key: string) => {
    if (onSort) { onSort(key); return; }
    setLocalSort(prev => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  };

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900/50">
              {columns.map(c => (
                <th
                  key={c.key}
                  className={`text-left px-4 py-3 text-2xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap ${c.width ?? ''}`}
                >
                  {c.sortValue ? (
                    <button onClick={() => handleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink-200 transition-colors">
                      {c.header}
                      {effectiveSort?.key === c.key ? (
                        effectiveSort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : c.header}
                </th>
              ))}
              {rowActions && <th className="w-px" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-0">
                  <TableSkeleton rows={6} cols={columns.length} />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-0">
                  <EmptyState icon={<Inbox className="w-5 h-5" />} title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-ink-800/60 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-ink-800/40' : ''} ${i === sorted.length - 1 ? 'border-b-0' : ''}`}
                >
                  {columns.map(c => (
                    <td key={c.key} className={`px-4 py-3 text-ink-200 ${c.className ?? ''}`}>
                      {c.render(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > perPage && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-800">
          <p className="text-xs text-ink-400">
            Showing <span className="text-ink-200 font-medium">{(page - 1) * perPage + 1}-{Math.min(page * perPage, total)}</span> of <span className="text-ink-200 font-medium">{total.toLocaleString('en-US')}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-ink-300 px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
