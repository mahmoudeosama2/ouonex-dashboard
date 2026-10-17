import { Wallet, ArrowUpRight, X, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface Props {
  open: boolean;
  pendingCount: number;
  onReview: () => void;
  onClose: () => void;
}

export function PendingPaymentAlertModal({ open, pendingCount, onReview, onClose }: Props) {
  const { locale, isRTL } = useLocale();

  if (!open || pendingCount <= 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg card p-6 shadow-pop border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-ink-900 to-ink-950 animate-scale-in space-y-5"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 text-ink-400 hover:text-ink-200 p-1.5 rounded-lg hover:bg-ink-800/60 transition-colors"
          title={locale === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Glowing Animated Badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {locale === 'ar' ? 'يتطلب إجراء فوري' : 'Action Required'}
              </span>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {pendingCount} {locale === 'ar' ? 'طلبات متأخرة' : 'Pending'}
              </span>
            </div>
            <h3 className="text-base font-bold text-ink-50">
              {locale === 'ar'
                ? 'تنبيه: طلبات دفع بانتظار الاعتماد اليدوي!'
                : 'Pending Payments Awaiting Manual Approval!'}
            </h3>
          </div>
        </div>

        {/* Alert Details Card */}
        <div className="p-4 rounded-xl bg-ink-950/70 border border-ink-800 space-y-2.5">
          <p className="text-xs text-ink-200 leading-relaxed">
            {locale === 'ar' ? (
              <>
                يوجد حالياً <strong className="text-amber-400 font-mono text-sm">{pendingCount}</strong> طلبات دفع لم يتم اعتمادها تلقائياً بالذكاء الاصطناعي، وهي متأخرة وتتطلب مراجعتك لإيصالات وفودافون كاش أو انستاباي واعتمادها يدوياً لتفعيل الحسابات للعملاء فوراً.
              </>
            ) : (
              <>
                There are currently <strong className="text-amber-400 font-mono text-sm">{pendingCount}</strong> payment transfers that were not auto-approved and require your manual review and approval.
              </>
            )}
          </p>

          <div className="flex items-center gap-2 text-2xs text-ink-400 pt-1 border-t border-ink-800/80">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {locale === 'ar'
                ? 'الطلبات المعتمدة تلقائياً لا تظهر هنا وتُفعل مباشرة، هذه فقط الطلبات المعلقة يدوياً.'
                : 'Automatically approved requests are already activated; these are pending manual check.'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto text-xs py-2 px-4"
          >
            {locale === 'ar' ? 'تذكيري لاحقاً / إغلاق' : 'Remind Me Later'}
          </button>

          <button
            type="button"
            onClick={onReview}
            className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-ink-950 font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <span>{locale === 'ar' ? 'مراجعة واعتماد الطلبات الآن' : 'Review & Approve Payments Now'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
