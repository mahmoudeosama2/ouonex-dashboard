import type { ReactNode } from 'react';

interface SelectFilter {
  type: 'select';
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}
interface SearchFilter {
  type: 'search';
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}
interface CustomFilter {
  type: 'custom';
  node: ReactNode;
}

export type FilterItem = SelectFilter | SearchFilter | CustomFilter;

export function FilterBar({ filters }: { filters: FilterItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-4">
      {filters.map((f, i) => {
        if (f.type === 'search') {
          return (
            <div key={i} className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
              <input
                type="text"
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                className="input w-full pl-9"
              />
            </div>
          );
        }
        if (f.type === 'select') {
          return (
            <div key={i} className="relative">
              <select
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                className="input appearance-none pr-8 cursor-pointer"
              >
                {f.options.map(o => <option key={o.value} value={o.value}>{f.label}: {o.label}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          );
        }
        return <div key={i}>{f.node}</div>;
      })}
    </div>
  );
}
