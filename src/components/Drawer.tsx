import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'lg' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const w = width === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-ink-970/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${w} bg-ink-900 border-l border-ink-800 shadow-pop flex flex-col animate-slide-in-right`}>
        <div className="flex items-start justify-between p-5 border-b border-ink-800">
          <div>
            <h3 className="text-base font-semibold text-ink-100">{title}</h3>
            {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mt-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="p-5 border-t border-ink-800">{footer}</div>}
      </div>
    </div>
  );
}
