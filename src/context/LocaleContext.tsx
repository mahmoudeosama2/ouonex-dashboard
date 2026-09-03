import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'ar';

const STORAGE_KEY = 'ouonex-dashboard-locale';

const DICT: Record<string, { en: string; ar: string }> = {
  // Nav
  'nav.overview': { en: 'Overview', ar: 'نظرة عامة' },
  'nav.dawaty': { en: 'Dawaty', ar: 'دعوتي' },
  'nav.digital_menu': { en: 'Digital Menu', ar: 'المنيو الرقمي' },
  'nav.finance': { en: 'Finance', ar: 'المالية' },
  'nav.ai_usage': { en: 'AI Usage', ar: 'استخدام الذكاء الاصطناعي' },
  'nav.users': { en: 'Users', ar: 'المستخدمون' },
  'nav.website': { en: 'Website CMS', ar: 'إدارة الموقع' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },
  'nav.support': { en: 'Support Inbox', ar: 'صندوق الدعم' },

  // Page titles
  'title.overview': { en: 'Overview', ar: 'نظرة عامة' },
  'title.finance': { en: 'Finance', ar: 'المالية' },
  'title.dawaty': { en: 'Dawaty', ar: 'دعوتي' },
  'title.digital_menu': { en: 'Digital Menu', ar: 'المنيو الرقمي' },
  'title.ai_usage': { en: 'AI Usage', ar: 'استخدام الذكاء الاصطناعي' },
  'title.users': { en: 'Users', ar: 'المستخدمون' },
  'title.settings': { en: 'Settings', ar: 'الإعدادات' },
  'title.website': { en: 'Website CMS', ar: 'إدارة الموقع' },
  'title.support': { en: 'Support Inbox', ar: 'صندوق الدعم' },

  // Common
  'common.search': { en: 'Search users, payments, restaurants...', ar: 'ابحث عن المستخدمين والمدفوعات والمطاعم...' },
  'common.save': { en: 'Save Changes', ar: 'حفظ التغييرات' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.all_systems_operational': { en: 'All systems operational', ar: 'جميع الأنظمة تعمل' },
  'common.sign_out': { en: 'Sign out', ar: 'تسجيل الخروج' },
  'common.switch_role': { en: 'Switch role (demo)', ar: 'تبديل الدور (تجريبي)' },
  'common.export_csv': { en: 'Export CSV', ar: 'تصدير CSV' },

  // Finance
  'finance.description': { en: 'Review and confirm pending payments across all products', ar: 'مراجعة وتأكيد المدفوعات المعلقة عبر جميع المنتجات' },
  'finance.total_revenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  'finance.pending_review': { en: 'Pending Review', ar: 'بانتظار المراجعة' },
  'finance.pending_amount': { en: 'Pending Amount', ar: 'المبلغ المعلق' },
  'finance.rejected': { en: 'Rejected', ar: 'مرفوض' },
  'finance.all_transactions': { en: 'All Transactions', ar: 'جميع المعاملات' },
  'finance.all_caught_up': { en: 'All caught up', ar: 'كل شيء مكتمل' },
  'finance.no_payments_waiting': { en: 'No payments are waiting for review.', ar: 'لا توجد مدفوعات بانتظار المراجعة.' },
  'finance.csv_success': { en: 'CSV Exported successfully', ar: 'تم تصدير CSV بنجاح' },

  // Users
  'users.description': { en: 'Global search across Dawaty and Digital Menu', ar: 'بحث شامل عبر دعوتي والمنيو الرقمي' },
  'users.csv_success': { en: 'CSV Exported successfully', ar: 'تم تصدير CSV بنجاح' },

  // Support
  'support.description': { en: 'Contact messages from the main website', ar: 'رسائل التواصل من الموقع الرئيسي' },
  'support.unread': { en: 'Unread', ar: 'غير مقروء' },
  'support.read': { en: 'Read', ar: 'مقروء' },
  'support.replied': { en: 'Replied', ar: 'تم الرد' },
  'support.reply': { en: 'Reply', ar: 'رد' },
  'support.send_reply': { en: 'Send Reply', ar: 'إرسال الرد' },
  'support.mark_read': { en: 'Mark as Read', ar: 'وضع علامة مقروء' },
  'support.reply_sent': { en: 'Reply sent', ar: 'تم إرسال الرد' },
  'support.no_messages': { en: 'No messages', ar: 'لا توجد رسائل' },
  'support.no_messages_desc': { en: 'The inbox is empty.', ar: 'صندوق الوارد فارغ.' },
  'support.name': { en: 'Name', ar: 'الاسم' },
  'support.email': { en: 'Email', ar: 'البريد الإلكتروني' },
  'support.project': { en: 'Project', ar: 'المشروع' },
  'support.message': { en: 'Message', ar: 'الرسالة' },
  'support.status': { en: 'Status', ar: 'الحالة' },
  'support.received': { en: 'Received', ar: 'تاريخ الاستلام' },
  'support.reply_placeholder': { en: 'Type your reply...', ar: 'اكتب ردك...' },
};

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') return stored;
    }
    return 'en';
  });

  useEffect(() => {
    const html = document.documentElement;
    if (locale === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en');
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  };

  const toggle = () => setLocale(locale === 'en' ? 'ar' : 'en');

  const t = (key: string): string => {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[locale];
  };

  const v: LocaleCtx = { locale, setLocale, toggle, t, isRTL: locale === 'ar' };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLocale must be inside LocaleProvider');
  return c;
}

export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number): string => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
