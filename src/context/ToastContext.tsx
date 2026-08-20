import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; title: string; message?: string; }

interface ToastCtx {
  toast: (t: { type: ToastType; title: string; message?: string }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const STYLES: Record<ToastType, string> = {
  success: 'border-success-600/40 bg-success-950/80',
  error: 'border-danger-600/40 bg-danger-950/80',
  info: 'border-accent-600/40 bg-accent-950/80',
  warning: 'border-warning-600/40 bg-warning-950/80',
};
const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-success-400',
  error: 'text-danger-400',
  info: 'text-accent-400',
  warning: 'text-warning-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((t: { type: ToastType; title: string; message?: string }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const v: ToastCtx = {
    toast,
    success: (title, message) => toast({ type: 'success', title, message }),
    error: (title, message) => toast({ type: 'error', title, message }),
    info: (title, message) => toast({ type: 'info', title, message }),
    warning: (title, message) => toast({ type: 'warning', title, message }),
  };

  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-xl2 border ${STYLES[t.type]} backdrop-blur-md shadow-pop p-3.5 animate-slide-up`}>
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_COLOR[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-100">{t.title}</p>
                {t.message && <p className="text-xs text-ink-300 mt-0.5">{t.message}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be inside ToastProvider');
  return c;
}
