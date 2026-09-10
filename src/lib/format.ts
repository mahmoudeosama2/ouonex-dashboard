const EGP = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
});

const EGP_precise = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number_fmt = new Intl.NumberFormat('en-US');

export function egp(n: number, precise = false): string {
  return precise ? EGP_precise.format(n) : EGP.format(n);
}

export function compactEGP(n: number): string {
  if (n >= 1_000_000) return `EGP ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `EGP ${(n / 1_000).toFixed(1)}K`;
  return EGP.format(n);
}

export function num(n: number): string {
  return number_fmt.format(n);
}

export function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return number_fmt.format(n);
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function date(iso: string): string {
  return new Date(iso).toLocaleDateString('en-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Cairo',
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Cairo',
  });
}

export function timeAgo(iso: string, locale?: string): string {
  const isAr = locale ? locale === 'ar' : (typeof window !== 'undefined' && localStorage.getItem('ouonex-dashboard-locale') === 'ar');
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return isAr ? 'الآن (just now)' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return isAr ? `منذ ${m} دقيقة (${m}m ago)` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isAr ? `منذ ${h} ساعة (${h}h ago)` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return isAr ? `منذ ${d} يوم (${d}d ago)` : `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return isAr ? `منذ ${mo} شهر (${mo}mo ago)` : `${mo}mo ago`;
  return isAr ? `منذ ${Math.floor(mo / 12)} سنة (${Math.floor(mo / 12)}y ago)` : `${Math.floor(mo / 12)}y ago`;
}

export function formatHealthName(h: { name: string; product?: string; name_ar?: string }, locale?: string): string {
  const isAr = locale ? locale === 'ar' : (typeof window !== 'undefined' && localStorage.getItem('ouonex-dashboard-locale') === 'ar');
  if (isAr) {
    if (h.name_ar) return `${h.name_ar} · ${h.name}`;
    if (h.product === 'digital_menu' || h.name.toLowerCase().includes('digital menu')) {
      return 'واجهة المنيو الرقمي (Digital Menu API)';
    }
    if (h.product === 'dawaty' || h.name.toLowerCase().includes('dawaty')) {
      return 'واجهة تطبيق دعوتي (Dawaty API)';
    }
    if (h.product === 'sms_gateway' || h.name.toLowerCase().includes('sms gateway')) {
      return 'هاتف بوابة الرسائل (SMS Gateway)';
    }
  }
  return h.name;
}

export function formatProductLabel(product: string, productAr?: string, locale?: string): string {
  const isAr = locale ? locale === 'ar' : (typeof window !== 'undefined' && localStorage.getItem('ouonex-dashboard-locale') === 'ar');
  if (isAr) {
    if (productAr) return `${productAr} (${product})`;
    switch (product) {
      case 'digital_menu':
        return 'المنيو الرقمي (digital_menu)';
      case 'dawaty':
        return 'دعوتي (dawaty)';
      case 'cv_maker':
        return 'منشئ السيرة الذاتية (cv_maker)';
      case 'qr_me':
        return 'باركود QR الذكي (qr_me)';
      case 'sms_gateway':
        return 'بوابة الرسائل (sms_gateway)';
      default:
        return product;
    }
  }
  return product;
}

export function relativeDays(iso: string, locale?: string): string {
  const isAr = locale ? locale === 'ar' : (typeof window !== 'undefined' && localStorage.getItem('ouonex-dashboard-locale') === 'ar');
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
  if (isAr) {
    if (diff === 0) return 'اليوم (today)';
    if (diff === 1) return 'غداً (tomorrow)';
    if (diff === -1) return 'أمس (yesterday)';
    if (diff > 0) return `خلال ${diff} يوم (in ${diff} days)`;
    return `منذ ${Math.abs(diff)} يوم (${Math.abs(diff)} days ago)`;
  }
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}
