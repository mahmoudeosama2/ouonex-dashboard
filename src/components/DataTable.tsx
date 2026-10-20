import { useState, useMemo, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Inbox, Search, X } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { useLocale } from '@/context/LocaleContext';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: string;
  align?: 'start' | 'center' | 'end';
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
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  searchable?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  headerAction?: ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns, rows, loading, emptyTitle = 'No results', emptyMessage = 'Try adjusting your filters or search.',
  onRowClick, rowActions, page = 1, perPage = 10, total = 0, onPageChange,
  sortKey, sortDir, onSort,
  selectedIds, onSelectRow, onSelectAll,
  searchable = true, searchQuery, onSearch, searchPlaceholder, headerAction,
}: Props<T>) {
  const { locale } = useLocale();
  const [internalSearch, setInternalSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const [localSort, setLocalSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  // Client-side instant filter across all columns and object properties
  const filteredRows = useMemo(() => {
    const q = activeSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(row => {
      // 1. Check direct properties of row
      for (const val of Object.values(row)) {
        if (val === null || val === undefined) continue;
        if (typeof val === 'string' || typeof val === 'number') {
          if (String(val).toLowerCase().includes(q)) return true;
        } else if (typeof val === 'object') {
          for (const subVal of Object.values(val as Record<string, unknown>)) {
            if (subVal !== null && subVal !== undefined && String(subVal).toLowerCase().includes(q)) {
              return true;
            }
          }
        }
      }

      // 2. Check column sortValue if defined
      for (const col of columns) {
        if (col.sortValue) {
          try {
            const sv = col.sortValue(row);
            if (sv !== undefined && sv !== null && String(sv).toLowerCase().includes(q)) {
              return true;
            }
          } catch (_) {}
        }
      }

      return false;
    });
  }, [rows, activeSearch, columns]);

  const effectiveSort = sortKey ? { key: sortKey, dir: sortDir ?? 'asc' } : localSort;
  const sorted = effectiveSort ? [...filteredRows].sort((a, b) => {
    const col = columns.find(c => c.key === effectiveSort!.key);
    if (!col?.sortValue) return 0;
    const av = col.sortValue(a);
    const bv = col.sortValue(b);
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return effectiveSort!.dir === 'asc' ? cmp : -cmp;
  }) : filteredRows;

  const handleSort = (key: string) => {
    if (onSort) { onSort(key); return; }
    setLocalSort(prev => {
      if (prev?.key === key) return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      return { key, dir: 'asc' };
    });
  };

  const effectiveTotal = activeSearch.trim() ? filteredRows.length : total;
  const totalPages = Math.ceil(effectiveTotal / perPage) || 1;

  return (
    <div className="card overflow-hidden">
      {searchable && (
        <div className="p-3.5 border-b border-ink-800/80 bg-ink-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500`} />
            <input
              type="text"
              value={activeSearch}
              onChange={e => {
                const val = e.target.value;
                setInternalSearch(val);
                onSearch?.(val);
              }}
              placeholder={searchPlaceholder || (locale === 'ar' ? 'بحث سريع في بيانات الجدول...' : 'Search in table...')}
              className={`input w-full ${locale === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-1.5 text-xs bg-ink-950/60 border-ink-800 focus:border-brand-500`}
            />
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setInternalSearch('');
                  onSearch?.('');
                }}
                className={`absolute ${locale === 'ar' ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-ink-800 text-ink-400 hover:text-ink-200 transition-colors`}
                title={locale === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {activeSearch.trim() && (
              <span className="text-2xs font-medium px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {locale === 'ar' ? `${filteredRows.length} من أصل ${rows.length} نتيجة` : `${filteredRows.length} of ${rows.length} matches`}
              </span>
            )}
            {headerAction}
          </div>
        </div>
      )}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900/50">
              {selectedIds && onSelectAll && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={onSelectAll}
                    className="rounded border-ink-700 bg-ink-950 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map(c => {
                const isCenter = c.align === 'center' || c.className?.includes('text-center');
                const isEnd = c.align === 'end' || c.className?.includes('text-right') || c.className?.includes('text-end');
                const alignClass = isCenter ? 'text-center' : isEnd ? 'text-end' : 'text-start';

                return (
                  <th
                    key={c.key}
                    className={`${alignClass} px-4 py-3 text-2xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap ${c.width ?? ''}`}
                  >
                    {c.sortValue ? (
                      <button
                        onClick={() => handleSort(c.key)}
                        className={`inline-flex items-center gap-1.5 hover:text-ink-200 transition-colors ${
                          isCenter ? 'justify-center mx-auto' : isEnd ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>{c.header}</span>
                        {effectiveSort?.key === c.key ? (
                          effectiveSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-400" /> : <ChevronDown className="w-3 h-3 text-brand-400" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className="w-px" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0) + (selectedIds ? 1 : 0)} className="p-0">
                  <TableSkeleton rows={6} cols={columns.length + (selectedIds ? 1 : 0)} />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0) + (selectedIds ? 1 : 0)} className="p-0">
                  <EmptyState
                    icon={<Inbox className="w-5 h-5" />}
                    title={activeSearch ? (locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No matching results') : emptyTitle}
                    message={activeSearch ? (locale === 'ar' ? `لا توجد بيانات تطابق: "${activeSearch}"` : `No records match "${activeSearch}"`) : emptyMessage}
                    action={activeSearch ? (
                      <button
                        onClick={() => { setInternalSearch(''); onSearch?.(''); }}
                        className="btn-ghost text-xs text-brand-400 hover:text-brand-300 mt-2"
                      >
                        {locale === 'ar' ? 'إعادة تعيين البحث' : 'Reset search'}
                      </button>
                    ) : undefined}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => {
                const isSelected = selectedIds?.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-ink-800/60 transition-colors ${
                      isSelected ? 'bg-brand-600/10' : ''
                    } ${onRowClick ? 'cursor-pointer hover:bg-ink-800/40' : ''} ${i === sorted.length - 1 ? 'border-b-0' : ''}`}
                  >
                    {selectedIds && onSelectRow && (
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(row.id)}
                          className="rounded border-ink-700 bg-ink-950 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map(c => {
                      const isCenter = c.align === 'center' || c.className?.includes('text-center');
                      const isEnd = c.align === 'end' || c.className?.includes('text-right') || c.className?.includes('text-end');
                      const alignClass = isCenter ? 'text-center' : isEnd ? 'text-end' : 'text-start';

                      return (
                        <td key={c.key} className={`px-4 py-3 text-ink-200 ${alignClass} ${c.className ?? ''}`}>
                          {c.render(row)}
                        </td>
                      );
                    })}
                    {rowActions && (
                      <td className="px-4 py-3 text-end" onClick={e => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
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
