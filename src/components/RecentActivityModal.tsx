import { useState, useMemo } from 'react';
import {
  X, Activity, Search, Filter, Calendar, UserPlus, CreditCard,
  Sparkles, Heart, UtensilsCrossed, FileText, QrCode, ArrowRight, ExternalLink
} from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { timeAgo, date } from '@/lib/format';
import type { ActivityItem, Product, PageKey } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  onNavigate?: (page: PageKey) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  signup: <UserPlus className="w-4 h-4 text-emerald-400" />,
  payment_approved: <CreditCard className="w-4 h-4 text-emerald-400" />,
  payment_submitted: <CreditCard className="w-4 h-4 text-warning-400" />,
  payment_rejected: <CreditCard className="w-4 h-4 text-danger-400" />,
  ai_scan: <Sparkles className="w-4 h-4 text-purple-400" />,
  invitation_published: <Heart className="w-4 h-4 text-rose-400" />,
};

const PRODUCT_BADGES: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  dawaty: { labelAr: 'دعوتي', labelEn: 'Dawaty', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  digital_menu: { labelAr: 'المنيو الرقمي', labelEn: 'Digital Menu', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  cv_maker: { labelAr: 'صانع السيرة الذاتية', labelEn: 'CV Maker', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  qr_me: { labelAr: 'باركود QR', labelEn: 'QR Me', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
};

export function RecentActivityModal({ open, onClose, activities, onNavigate }: Props) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<'all' | Product>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = !search ||
        a.message.toLowerCase().includes(search.toLowerCase()) ||
        a.actor.toLowerCase().includes(search.toLowerCase());
      
      const matchProduct = selectedProduct === 'all' || a.product === selectedProduct;
      
      const matchType = selectedType === 'all' ||
        (selectedType === 'registration' && (a.type === 'signup' || a.message.toLowerCase().includes('user') || a.message.toLowerCase().includes('register'))) ||
        (selectedType === 'payment' && a.type.startsWith('payment')) ||
        (selectedType === 'ai' && a.type === 'ai_scan') ||
        (selectedType === 'invitation' && (a.type === 'invitation_published' || a.product === 'dawaty'));

      return matchSearch && matchProduct && matchType;
    });
  }, [activities, search, selectedProduct, selectedType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-970/80 backdrop-blur-md animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col bg-gradient-to-b from-ink-900 via-ink-950 to-ink-970 border border-ink-800 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden rounded-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ink-800/80 bg-ink-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow-soft">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-50">
                {locale === 'ar' ? 'سجل أحدث النشاطات والعمليات' : 'Recent Activities & System Log'}
              </h3>
              <p className="text-2xs text-ink-400 mt-0.5">
                {locale === 'ar' ? `عرض ${filtered.length} من إجمالي ${activities.length} نشاط` : `Showing ${filtered.length} of ${activities.length} total events`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 active:scale-90 flex items-center justify-center transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-ink-800/80 space-y-3 bg-ink-950/90 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={locale === 'ar' ? 'بحث في النشاطات أو أسماء المستخدمين...' : 'Search activity logs or user names...'}
              className="input pl-10 w-full text-xs min-h-[42px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-400 text-2xs mr-1 font-medium">{locale === 'ar' ? 'المنتج:' : 'Product:'}</span>
            {(['all', 'dawaty', 'digital_menu', 'cv_maker', 'qr_me'] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedProduct(p)}
                className={`min-h-[32px] px-3 py-1 rounded-lg text-2xs font-semibold active:scale-95 transition-all duration-150 ${
                  selectedProduct === p
                    ? 'bg-brand-600 text-white shadow-soft border border-brand-400/30'
                    : 'bg-ink-900 text-ink-300 hover:text-white border border-ink-800 hover:border-ink-700'
                }`}
              >
                {p === 'all'
                  ? (locale === 'ar' ? 'الكل' : 'All')
                  : locale === 'ar' ? PRODUCT_BADGES[p]?.labelAr : PRODUCT_BADGES[p]?.labelEn}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-400 text-2xs mr-1 font-medium">{locale === 'ar' ? 'النوع:' : 'Type:'}</span>
            {[
              { key: 'all', ar: 'كافة الأنشطة', en: 'All Events' },
              { key: 'registration', ar: 'تسجيل مستخدمين', en: 'Registrations' },
              { key: 'payment', ar: 'المدفوعات', en: 'Payments' },
              { key: 'ai', ar: 'ذكاء اصطناعي', en: 'AI Scans' },
              { key: 'invitation', ar: 'دعوات وقوائم', en: 'Invitations' },
            ].map(tItem => (
              <button
                key={tItem.key}
                onClick={() => setSelectedType(tItem.key)}
                className={`min-h-[32px] px-3 py-1 rounded-lg text-2xs font-semibold active:scale-95 transition-all duration-150 ${
                  selectedType === tItem.key
                    ? 'bg-ink-700 text-white border border-ink-600'
                    : 'bg-ink-900/60 text-ink-400 hover:text-ink-200 border border-ink-800/60'
                }`}
              >
                {locale === 'ar' ? tItem.ar : tItem.en}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-ink-800/40">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-500 text-xs">
              {locale === 'ar' ? 'لا توجد أنشطة مطابقة للبحث أو التصفية.' : 'No activities match the current filters.'}
            </div>
          ) : (
            filtered.map((a, idx) => {
              const pBadge = PRODUCT_BADGES[a.product] || {
                labelAr: a.product,
                labelEn: a.product,
                color: 'bg-ink-800 text-ink-300 border-ink-700',
              };

              return (
                <div
                  key={a.id}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="pt-2.5 first:pt-0 flex items-start gap-3 p-2 rounded-xl hover:bg-ink-850/60 transition-all duration-200 group"
                >
                  <div className="mt-1 w-8 h-8 rounded-lg bg-ink-900 border border-ink-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {TYPE_ICONS[a.type] || <Activity className="w-4 h-4 text-brand-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink-100 truncate group-hover:text-white transition-colors">{a.message}</p>
                      <span className={`text-3xs px-2 py-0.5 rounded-full border shrink-0 font-medium ${pBadge.color}`}>
                        {locale === 'ar' ? pBadge.labelAr : pBadge.labelEn}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-2xs text-ink-400">
                        {locale === 'ar' ? 'المستخدم / المنفذ:' : 'Actor:'} <strong className="text-ink-300">{a.actor}</strong>
                      </span>
                      <span className="text-3xs text-ink-500 tabular-nums">
                        {timeAgo(a.at, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Destination Shortcut */}
                  {onNavigate && (
                    <button
                      onClick={() => {
                        onClose();
                        if (a.type.startsWith('payment')) onNavigate('finance');
                        else if (a.product === 'dawaty') onNavigate('dawaty');
                        else if (a.product === 'digital_menu') onNavigate('digital_menu');
                        else if (a.product === 'cv_maker') onNavigate('cv_maker');
                        else if (a.product === 'qr_me') onNavigate('qr_me');
                        else onNavigate('users');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 active:scale-90 transition-all shrink-0"
                      title={locale === 'ar' ? 'الانتقال للشاشة المعنية' : 'Go to screen'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ink-800/80 bg-ink-900/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary min-h-[44px] px-6 text-xs font-bold rounded-xl"
          >
            {locale === 'ar' ? 'إغلاق السجل' : 'Close Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
