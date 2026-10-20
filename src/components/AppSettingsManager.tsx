import { useState, useEffect, useRef } from 'react';
import {
  Settings, Save, Loader2, CheckCircle2, AlertTriangle, Tag,
  Smartphone, ExternalLink, Zap, ToggleLeft, ToggleRight,
  ShieldAlert, RefreshCw, Layers, Check, Globe, CreditCard, ChevronRight,
  Bell, Send, History, Radio, Phone, Link2, Wallet
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';

export interface AppSettingsManagerProps {
  appId: 'dawaty' | 'digital_menu' | 'cv_maker' | 'qr_me';
  appNameAr: string;
  appNameEn: string;
  icon: React.ReactNode;
  descriptionAr?: string;
  onNavigateGlobalSettings?: () => void;
}

export function AppSettingsManager({
  appId,
  appNameAr,
  appNameEn,
  icon,
  descriptionAr,
  onNavigateGlobalSettings,
}: AppSettingsManagerProps) {
  const { t, locale, isRTL } = useLocale();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  // Full settings state
  const [settings, setSettings] = useState<Record<string, any>>({});

  // Prefix mapping
  const prefix = appId === 'dawaty' ? 'dawety' : appId === 'digital_menu' ? 'menu' : appId;

  // Load settings on mount
  useEffect(() => {
    setLoading(true);
    api.settings.get().then((res: any) => {
      const data = res || {};
      setSettings(data);
      setLoading(false);
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 350);
    }).catch(() => {
      setLoading(false);
    });
  }, [appId]);

  // Notification broadcasting states (Bilingual Arabic & English)
  const [notifTitleAr, setNotifTitleAr] = useState('');
  const [notifBodyAr, setNotifBodyAr] = useState('');
  const [notifTitleEn, setNotifTitleEn] = useState('');
  const [notifBodyEn, setNotifBodyEn] = useState('');
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [notifTarget, setNotifTarget] = useState<'all' | 'subscribers' | 'free'>('all');
  const [notifDeepLink, setNotifDeepLink] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifHistory, setNotifHistory] = useState<any[]>([]);

  // Load notification history
  const loadNotificationHistory = () => {
    api.notifications.history(appId)
      .then(res => {
        setNotifHistory(res?.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotificationHistory();
  }, [appId]);

  const handleSendNotification = async () => {
    const hasAr = notifTitleAr.trim() || notifBodyAr.trim();
    const hasEn = notifTitleEn.trim() || notifBodyEn.trim();

    if (!hasAr && !hasEn) {
      toast.error(
        locale === 'ar' ? 'العنوان والنص مطلوبان' : 'Title and body required',
        locale === 'ar' ? 'يرجى كتابة عنوان ورسالة الإشعار بالعربية أو الإنجليزية على الأقل.' : 'Please enter notification title and message in at least Arabic or English.'
      );
      return;
    }

    setSendingNotif(true);
    try {
      const titleArFinal = notifTitleAr.trim() || notifTitleEn.trim();
      const bodyArFinal = notifBodyAr.trim() || notifBodyEn.trim();
      const titleEnFinal = notifTitleEn.trim() || notifTitleAr.trim();
      const bodyEnFinal = notifBodyEn.trim() || notifBodyAr.trim();

      const res = await api.notifications.send({
        appId,
        title: titleArFinal,
        body: bodyArFinal,
        title_ar: titleArFinal,
        body_ar: bodyArFinal,
        title_en: titleEnFinal,
        body_en: bodyEnFinal,
        target: notifTarget,
        deep_link: notifDeepLink.trim() || undefined,
      });

      if (res?.fcm_dispatched) {
        toast.success(
          locale === 'ar' ? 'تم البث الفوري عبر Google FCM! 🚀⚡' : 'Pushed Instantly via Google FCM! 🚀⚡',
          locale === 'ar' ? `وصل الإشعار فورياً لشريط إشعارات هواتف مستخدمي ${appNameAr} في أقل من ثانية واحدة.` : `Bilingual broadcast dispatched instantly via FCM to ${appNameEn} users in < 1s.`
        );
      } else {
        toast.success(
          locale === 'ar' ? 'تم نشر الإشعار بنجاح 📢' : 'Notification Broadcasted 📢',
          locale === 'ar' ? `تم حفظ الإشعار كإعلان للتطبيق. للبث الفوري المباشر لشاشات الهواتف (< 1 ثانية)، يرجى إدخال FCM Server Key في الأسفل.` : `Notification saved. To enable instant lockscreen push (< 1s), configure FCM Server Key below.`
        );
      }

      if (res?.data) {
        setNotifHistory(prev => [res.data, ...prev]);
      } else {
        loadNotificationHistory();
      }

      setNotifTitleAr('');
      setNotifBodyAr('');
      setNotifTitleEn('');
      setNotifBodyEn('');
      setNotifDeepLink('');
    } catch {
      toast.error(
        locale === 'ar' ? 'فشل إرسال الإشعار' : 'Failed to send notification',
        locale === 'ar' ? 'يرجى التحقق من الاتصال والمحاولة مرة أخرى.' : 'Please check connection and try again.'
      );
    } finally {
      setSendingNotif(false);
    }
  };

  // Save settings payload helper
  const savePayload = async (data: Record<string, any>, showToast = false) => {
    setAutoSaveStatus('saving');
    setSaving(true);
    try {
      await api.settings.save(data);
      setAutoSaveStatus('saved');
      if (showToast) {
        toast.success(
          locale === 'ar' ? 'تم حفظ وتطبيق الإعدادات' : 'Settings Saved',
          locale === 'ar' ? `تم تحديث إعدادات تطبيق ${appNameAr} بنجاح.` : `${appNameEn} settings updated successfully.`
        );
      }
      setTimeout(() => {
        setAutoSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
      }, 2500);
    } catch {
      setAutoSaveStatus('error');
      toast.error(
        locale === 'ar' ? 'فشل الحفظ' : 'Save Failed',
        locale === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.' : 'Could not save settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Field change with debounce
  const updateField = (key: string, val: any, extraKeys?: Record<string, any>) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val, ...(extraKeys || {}) };

      // CV maker link synchronization
      if (key === 'cv_maker_app_store_url') next.cv_app_store_url = val;
      if (key === 'cv_maker_play_store_url') next.cv_play_store_url = val;

      // Dawaty link synchronization
      if (key === 'dawaty_app_store_url') next.dawety_app_store_url = val;
      if (key === 'dawaty_play_store_url') next.dawety_play_store_url = val;

      // Payment per-app synchronization
      if (key === 'dawety_vodafone_cash_number' || key === 'dawaty_vodafone_cash_number') {
        next.dawety_vodafone_cash_number = val;
        next.dawaty_vodafone_cash_number = val;
      }
      if (key === 'dawety_vodafone_cash_link' || key === 'dawaty_vodafone_cash_link') {
        next.dawety_vodafone_cash_link = val;
        next.dawaty_vodafone_cash_link = val;
      }
      if (key === 'dawety_vodafone_cash_enabled' || key === 'dawaty_vodafone_cash_enabled') {
        next.dawety_vodafone_cash_enabled = val;
        next.dawaty_vodafone_cash_enabled = val;
      }
      if (key === 'dawety_instapay_address' || key === 'dawaty_instapay_address') {
        next.dawety_instapay_address = val;
        next.dawaty_instapay_address = val;
      }
      if (key === 'dawety_instapay_link' || key === 'dawaty_instapay_link') {
        next.dawety_instapay_link = val;
        next.dawaty_instapay_link = val;
      }
      if (key === 'dawety_instapay_enabled' || key === 'dawaty_instapay_enabled') {
        next.dawety_instapay_enabled = val;
        next.dawaty_instapay_enabled = val;
      }

      if (key === 'cv_maker_vodafone_cash_number' || key === 'cv_vodafone_cash_number') {
        next.cv_maker_vodafone_cash_number = val;
        next.cv_vodafone_cash_number = val;
      }
      if (key === 'cv_maker_vodafone_cash_link' || key === 'cv_vodafone_cash_link') {
        next.cv_maker_vodafone_cash_link = val;
        next.cv_vodafone_cash_link = val;
      }
      if (key === 'cv_maker_vodafone_cash_enabled' || key === 'cv_vodafone_cash_enabled') {
        next.cv_maker_vodafone_cash_enabled = val;
        next.cv_vodafone_cash_enabled = val;
      }
      if (key === 'cv_maker_instapay_address' || key === 'cv_instapay_address') {
        next.cv_maker_instapay_address = val;
        next.cv_instapay_address = val;
      }
      if (key === 'cv_maker_instapay_link' || key === 'cv_instapay_link') {
        next.cv_maker_instapay_link = val;
        next.cv_instapay_link = val;
      }
      if (key === 'cv_maker_instapay_enabled' || key === 'cv_instapay_enabled') {
        next.cv_maker_instapay_enabled = val;
        next.cv_instapay_enabled = val;
      }

      if (isLoadedRef.current) {
        setAutoSaveStatus('saving');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          savePayload(next, false);
        }, 800);
      }
      return next;
    });
  };

  // Immediate toggle
  const handleToggle = (key: string, explicitVal?: boolean, extraKeys?: Record<string, any>) => {
    setSettings(prev => {
      const nextVal = explicitVal !== undefined ? explicitVal : !prev[key];
      const next = { ...prev, [key]: nextVal, ...(extraKeys || {}) };
      savePayload(next, true);
      return next;
    });
  };

  // Manual save button
  const handleManualSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await savePayload(settings, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          <span className="text-xs text-ink-400">
            {locale === 'ar' ? `جاري تحميل إعدادات ${appNameAr}...` : `Loading ${appNameEn} settings...`}
          </span>
        </div>
      </div>
    );
  }

  // ── Specific app values ──
  const isGlobalFreeMode = !!settings.global_emergency_free_mode;

  // App free mode logic
  let isAppFreeMode = false;
  if (appId === 'cv_maker') {
    isAppFreeMode = !!(settings.cv_free_mode ?? settings.cv_maker_free_mode ?? !settings.cv_maker_payment_enabled);
  } else if (appId === 'dawaty') {
    isAppFreeMode = !!settings.dawaty_free_mode;
  } else if (appId === 'digital_menu') {
    isAppFreeMode = !!settings.menu_free_mode;
  } else if (appId === 'qr_me') {
    isAppFreeMode = !!(settings.qr_me_free_mode ?? !settings.qr_me_payment_enabled);
  }

  const effectiveFreeMode = isGlobalFreeMode || isAppFreeMode;

  // Payment Gateway Keys per app
  const vcKey = `${prefix}_vodafone_cash_number`;
  const vcLinkKey = `${prefix}_vodafone_cash_link`;
  const vcEnabledKey = `${prefix}_vodafone_cash_enabled`;
  const ipAddrKey = `${prefix}_instapay_address`;
  const ipLinkKey = `${prefix}_instapay_link`;
  const ipEnabledKey = `${prefix}_instapay_enabled`;

  const appVcNumber = settings[vcKey] ?? (appId === 'dawaty' ? settings.dawaty_vodafone_cash_number : '') ?? settings.vodafone_cash_number ?? '01019603225';
  const appVcLink = settings[vcLinkKey] ?? (appId === 'dawaty' ? settings.dawaty_vodafone_cash_link : '') ?? settings.vodafone_cash_link ?? 'http://vf.eg/vfcash?id=mt&qrId=LANXrg';
  const isVcEnabled = settings[vcEnabledKey] !== undefined ? !!settings[vcEnabledKey] : (appId === 'dawaty' && settings.dawaty_vodafone_cash_enabled !== undefined ? !!settings.dawaty_vodafone_cash_enabled : true);

  const appIpAddress = settings[ipAddrKey] ?? (appId === 'dawaty' ? settings.dawaty_instapay_address : '') ?? settings.instapay_address ?? 'ouonex@instapay';
  const appIpLink = settings[ipLinkKey] ?? (appId === 'dawaty' ? settings.dawaty_instapay_link : '') ?? settings.instapay_link ?? 'https://ipn.eg/S/mahmoudeosama/instapay/7gXQWO';
  const isIpEnabled = settings[ipEnabledKey] !== undefined ? !!settings[ipEnabledKey] : (appId === 'dawaty' && settings.dawaty_instapay_enabled !== undefined ? !!settings.dawaty_instapay_enabled : true);

  const togglePaymentMethod = (methodKey: string) => {
    const currentVal = settings[methodKey] !== undefined ? !!settings[methodKey] : true;
    const nextVal = !currentVal;
    let extra: Record<string, any> = {};
    if (appId === 'dawaty') {
      if (methodKey.includes('vodafone_cash')) {
        extra.dawety_vodafone_cash_enabled = nextVal;
        extra.dawaty_vodafone_cash_enabled = nextVal;
      } else if (methodKey.includes('instapay')) {
        extra.dawety_instapay_enabled = nextVal;
        extra.dawaty_instapay_enabled = nextVal;
      }
    } else if (appId === 'cv_maker') {
      if (methodKey.includes('vodafone_cash')) {
        extra.cv_maker_vodafone_cash_enabled = nextVal;
        extra.cv_vodafone_cash_enabled = nextVal;
      } else if (methodKey.includes('instapay')) {
        extra.cv_maker_instapay_enabled = nextVal;
        extra.cv_instapay_enabled = nextVal;
      }
    }
    handleToggle(methodKey, nextVal, extra);
  };

  // Version Control Keys
  const latestKey = `${prefix}_latest_version`;
  const minKey = `${prefix}_min_version`;
  const forceKey = `${prefix}_force_update`;
  const titleArKey = `${prefix}_update_title_ar`;
  const msgArKey = `${prefix}_update_message_ar`;
  const playKey = prefix === 'cv_maker' ? 'cv_maker_play_store_url' : prefix === 'dawety' ? 'dawaty_play_store_url' : `${prefix}_play_store_url`;
  const iosKey = prefix === 'cv_maker' ? 'cv_maker_app_store_url' : prefix === 'dawety' ? 'dawaty_app_store_url' : `${prefix}_app_store_url`;

  const latestVersion = settings[latestKey] || '1.0.0';
  const minVersion = settings[minKey] || '1.0.0';
  const isForceUpdate = !!settings[forceKey];
  const updateTitleAr = settings[titleArKey] || 'تحديث جديد متوفر!';
  const updateMsgAr = settings[msgArKey] || 'يرجى التحديث للحصول على أفضل تجربة.';
  const playStoreUrl = settings[playKey] || '';
  const appStoreUrl = settings[iosKey] || '';

  const hasUpdatePending = latestVersion !== minVersion;

  // Toggle app free mode handler
  const toggleAppFreeMode = () => {
    const nextVal = !isAppFreeMode;
    let extra: Record<string, any> = {};

    if (appId === 'cv_maker') {
      extra = {
        cv_free_mode: nextVal,
        cv_maker_free_mode: nextVal,
        cv_maker_payment_enabled: !nextVal,
      };
      handleToggle('cv_free_mode', nextVal, extra);
    } else if (appId === 'dawaty') {
      handleToggle('dawaty_free_mode', nextVal);
    } else if (appId === 'digital_menu') {
      handleToggle('menu_free_mode', nextVal);
    } else if (appId === 'qr_me') {
      extra = {
        qr_me_free_mode: nextVal,
        qr_me_payment_enabled: !nextVal,
      };
      handleToggle('qr_me_free_mode', nextVal, extra);
    }
  };

  // Quick Action: Stop all update popups
  const handleStopUpdates = () => {
    const next = {
      ...settings,
      [minKey]: latestVersion,
      [forceKey]: false,
    };
    setSettings(next);
    savePayload(next, true);
  };

  // Quick Action: Enforce force update now
  const handleEnforceForceUpdate = () => {
    const next = {
      ...settings,
      [minKey]: latestVersion,
      [forceKey]: true,
    };
    setSettings(next);
    savePayload(next, true);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* ── Top Header Card with Auto-Save Badge ── */}
      <div className="p-4 rounded-xl bg-ink-900/80 border border-ink-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            {icon || <Settings className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink-50">
                {locale === 'ar' ? `إعدادات ${appNameAr}` : `${appNameEn} Settings`}
              </h2>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-ink-800 text-ink-300 border border-ink-700">
                {appId}
              </span>
            </div>
            <p className="text-xs text-ink-400 mt-0.5">
              {descriptionAr || (locale === 'ar' ? 'التحكم في بوابات الدفع، التحديثات الإجبارية، وروابط المتاجر الخاصة بالتطبيق.' : 'Manage paywalls, forced updates, and store links.')}
            </p>
          </div>
        </div>

        {/* Live Auto-Save Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-success-400 bg-success-500/10 px-3 py-1 rounded-full border border-success-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'تم الحفظ تلقائياً ✓' : 'Auto-saved ✓'}</span>
            </span>
          )}
          {autoSaveStatus === 'idle' && (
            <span className="text-2xs text-ink-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-brand-400" />
              <span>{locale === 'ar' ? 'متزامن تلقائياً' : 'Auto-synced'}</span>
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? t('common.saving') : t('common.save')}</span>
          </button>
        </div>
      </div>

      {/* Global Emergency Free Mode Warning if Active */}
      {isGlobalFreeMode && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {locale === 'ar' ? '⚠️ وضع الطوارئ الشامل مفعّل على مستوى المنصة' : '⚠️ Global Emergency Free Mode is Active'}
            </p>
            <p className="text-rose-300/80">
              {locale === 'ar'
                ? 'تم تفعيل زر الطوارئ العام في الإعدادات الرئيسية، مما يجعل جميع التطبيقات مجانية بنسبة 100% بغض النظر عن إعدادات هذا التطبيق الفردية.'
                : 'Emergency kill-switch is ON globally. All apps are forced into 100% free mode.'}
            </p>
          </div>
        </div>
      )}

      {/* ── SECTION 1: PAYWALL & PRICING (الدفع والتسعير والوضع المجاني) ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-ink-100">
                {locale === 'ar' ? 'التحكم في الدفع والتسعير (Paywall & Pricing)' : 'Paywall & Pricing Control'}
              </h3>
              <p className="text-2xs text-ink-400 mt-0.5">
                {locale === 'ar' ? 'التبديل بين الوضع المجاني والمدفوع وتحديد أسعار باقات التطبيق.' : 'Toggle between Free and Paid modes and configure pricing.'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
            effectiveFreeMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {effectiveFreeMode
              ? (locale === 'ar' ? 'الوضع الحالي: مجاني 100%' : 'Current: 100% Free')
              : (locale === 'ar' ? 'الوضع الحالي: مدفوع' : 'Current: Paid Mode')}
          </span>
        </div>

        {/* Free Mode Switch Card */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isAppFreeMode
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-ink-950/40 border-ink-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-ink-100">
                {locale === 'ar' ? 'الوضع المجاني للتطبيق (Store Review / Free Mode)' : 'App Free Mode'}
              </h4>
              <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                isAppFreeMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-ink-800 text-ink-400'
              }`}>
                {isAppFreeMode ? (locale === 'ar' ? 'مفعّل (مجاني)' : 'Enabled') : (locale === 'ar' ? 'معطّل (مدفوع)' : 'Disabled')}
              </span>
            </div>
            <p className="text-2xs text-ink-400 mt-1 max-w-xl">
              {locale === 'ar'
                ? 'عند التفعيل، يستطيع جميع المستخدمين استخدام كافة ميزات التطبيق مجاناً دون المطالبة بأي دفع أو اشتراك (مهم جداً أثناء مراجعات Apple و Google Play).'
                : 'When enabled, all users can use the app for free with no paywall prompt (essential for Store Reviews).'}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAppFreeMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              isAppFreeMode
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                : 'bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700'
            }`}
          >
            {isAppFreeMode ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-ink-400" />}
            <span>{isAppFreeMode ? (locale === 'ar' ? 'التحويل إلى مدفوع' : 'Switch to Paid') : (locale === 'ar' ? 'التحويل إلى مجاني' : 'Switch to Free')}</span>
          </button>
        </div>

        {/* Pricing Inputs based on app */}
        <div className="space-y-4 pt-1">
          {appId === 'dawaty' && (
            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1.5">
                {locale === 'ar' ? 'سعر حجز الدعوة الواحدة (بالجنيه المصري)' : 'Single Invitation Price (EGP)'}
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={0}
                  value={settings.dawaty_invitation_price ?? 150}
                  onChange={e => updateField('dawaty_invitation_price', Number(e.target.value))}
                  className="input w-full pl-3 pr-12 text-sm font-semibold"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                  {locale === 'ar' ? 'ج.م' : 'EGP'}
                </span>
              </div>
              <p className="text-2xs text-ink-500 mt-1">
                {locale === 'ar' ? 'السعر الذي يظهر للمستخدم في شاشة الدفع لتأكيد حجز الدعوة الإلكترونية.' : 'The price shown to users on checkout.'}
              </p>
            </div>
          )}

          {appId === 'digital_menu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  {locale === 'ar' ? 'سعر الاشتراك الشهري للمطعم (ج.م / شهر)' : 'Monthly Restaurant Price (EGP/mo)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={settings.menu_price_monthly ?? 100}
                    onChange={e => updateField('menu_price_monthly', Number(e.target.value))}
                    className="input w-full pl-3 pr-12 text-sm font-semibold"
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  {locale === 'ar' ? 'سعر الاشتراك السنوي للمطعم (ج.م / سنة)' : 'Yearly Restaurant Price (EGP/yr)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={settings.menu_price_yearly ?? 1000}
                    onChange={e => updateField('menu_price_yearly', Number(e.target.value))}
                    className="input w-full pl-3 pr-12 text-sm font-semibold"
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {appId === 'cv_maker' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  {locale === 'ar' ? 'سعر تصدير السيرة الذاتية PDF الواحدة' : 'Single PDF Export Price'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={settings.cv_price_single ?? settings.cv_maker_pdf_price ?? 25}
                    onChange={e => {
                      const val = Number(e.target.value);
                      updateField('cv_price_single', val, { cv_maker_pdf_price: val });
                    }}
                    className="input w-full pl-3 pr-12 text-sm font-semibold"
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  {locale === 'ar' ? 'سعر اشتراك القوالب غير المحدود' : 'Unlimited Subscription Price'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={settings.cv_price_subscription ?? 120}
                    onChange={e => updateField('cv_price_subscription', Number(e.target.value))}
                    className="input w-full pl-3 pr-12 text-sm font-semibold"
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                    {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {appId === 'qr_me' && (
            <div>
              <label className="block text-xs font-medium text-ink-300 mb-1.5">
                {locale === 'ar' ? 'سعر قالب الباركود VIP والتحميل عالي الدقة' : 'VIP QR Template Price (EGP)'}
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={0}
                  value={settings.qr_me_vip_price ?? 15}
                  onChange={e => updateField('qr_me_vip_price', Number(e.target.value))}
                  className="input w-full pl-3 pr-12 text-sm font-semibold"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400 ${isRTL ? 'left-3' : 'right-3'}`}>
                  {locale === 'ar' ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Per-App Payment Gateways Card */}
        <div className="p-4 rounded-xl bg-ink-950/60 border border-ink-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-800/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink-100 flex items-center gap-2">
                  <span>{locale === 'ar' ? `بوابات وحسابات الدفع المخصصة لتطبيق (${appNameAr})` : `${appNameEn} Dedicated Payment Gateways`}</span>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/20">
                    {locale === 'ar' ? 'مستقلة لهذا التطبيق' : 'App Specific'}
                  </span>
                </h4>
                <p className="text-2xs text-ink-400 mt-0.5">
                  {locale === 'ar'
                    ? 'يمكنك تحديد أرقام تحويل وروابط دفع خاصة بهذا التطبيق فقط أو تفعيل/إيقاف أي وسيلة دون التأثير على باقي التطبيقات.'
                    : 'Configure dedicated transfer numbers, payment links, and toggle methods specifically for this app.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vodafone Cash Box */}
            <div className={`p-3.5 rounded-xl border transition-all ${isVcEnabled ? 'bg-ink-900/70 border-rose-500/30' : 'bg-ink-950/40 border-ink-800 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-ink-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink-100 block">
                      {locale === 'ar' ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}
                    </span>
                    <span className="text-3xs text-ink-400">
                      {locale === 'ar' ? 'محافظ إلكترونية والتحويل الفوري' : 'Mobile Wallets'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePaymentMethod(vcEnabledKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold transition-all ${
                    isVcEnabled
                      ? 'bg-success-500/20 text-success-300 border border-success-500/30 hover:bg-success-500/30'
                      : 'bg-ink-800 text-ink-400 border border-ink-700 hover:bg-ink-700'
                  }`}
                >
                  {isVcEnabled ? (
                    <>
                      <ToggleRight className="w-3.5 h-3.5 text-success-400" />
                      <span>{locale === 'ar' ? 'مفعلة' : 'Active'}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5 text-ink-400" />
                      <span>{locale === 'ar' ? 'معطلة' : 'Disabled'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-2xs font-medium text-ink-300 mb-1">
                    {locale === 'ar' ? 'رقم محفظة فودافون كاش لهذا التطبيق' : 'Dedicated Wallet Number'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={appVcNumber}
                      onChange={e => updateField(vcKey, e.target.value)}
                      placeholder="01019603225"
                      className="input w-full pl-8 pr-3 text-xs font-mono font-bold"
                      disabled={!isVcEnabled}
                    />
                    <Phone className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-medium text-ink-300 mb-1">
                    {locale === 'ar' ? 'رابط الدفع المباشر عبر فودافون كاش (Direct Vodafone Cash Link)' : 'Direct Vodafone Cash Link'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      dir="ltr"
                      value={appVcLink}
                      onChange={e => updateField(vcLinkKey, e.target.value)}
                      placeholder="http://vf.eg/vfcash?id=..."
                      className="input w-full pl-8 pr-3 text-xs font-mono"
                      disabled={!isVcEnabled}
                    />
                    <Link2 className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-3xs text-ink-500 mt-0.5">
                    {locale === 'ar' ? 'يفتح تطبيق فودافون كاش أو رابط الدفع المباشر للمستخدم بضغطة واحدة.' : 'Deep-links users directly into Vodafone Cash payment.'}
                  </p>
                </div>
              </div>
            </div>

            {/* InstaPay Box */}
            <div className={`p-3.5 rounded-xl border transition-all ${isIpEnabled ? 'bg-ink-900/70 border-violet-500/30' : 'bg-ink-950/40 border-ink-800 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-ink-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink-100 block">
                      {locale === 'ar' ? 'انستاباي (InstaPay IPN)' : 'InstaPay'}
                    </span>
                    <span className="text-3xs text-ink-400">
                      {locale === 'ar' ? 'الشبكة القومية للمدفوعات اللحظية' : 'Instant Payment Network'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePaymentMethod(ipEnabledKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold transition-all ${
                    isIpEnabled
                      ? 'bg-success-500/20 text-success-300 border border-success-500/30 hover:bg-success-500/30'
                      : 'bg-ink-800 text-ink-400 border border-ink-700 hover:bg-ink-700'
                  }`}
                >
                  {isIpEnabled ? (
                    <>
                      <ToggleRight className="w-3.5 h-3.5 text-success-400" />
                      <span>{locale === 'ar' ? 'مفعلة' : 'Active'}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5 text-ink-400" />
                      <span>{locale === 'ar' ? 'معطلة' : 'Disabled'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-2xs font-medium text-ink-300 mb-1">
                    {locale === 'ar' ? 'عنوان أو رقم حساب انستاباي (IPA / Mobile)' : 'InstaPay Address / IPA'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={appIpAddress}
                    onChange={e => updateField(ipAddrKey, e.target.value)}
                    placeholder="username@instapay"
                    className="input w-full px-3 text-xs font-mono font-bold"
                    disabled={!isIpEnabled}
                  />
                </div>

                <div>
                  <label className="block text-2xs font-medium text-ink-300 mb-1">
                    {locale === 'ar' ? 'رابط الدفع المباشر عبر انستاباي (Direct Payment Link)' : 'Direct InstaPay Link'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      dir="ltr"
                      value={appIpLink}
                      onChange={e => updateField(ipLinkKey, e.target.value)}
                      placeholder="https://ipn.eg/..."
                      className="input w-full pl-8 pr-3 text-xs font-mono"
                      disabled={!isIpEnabled}
                    />
                    <Link2 className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-3xs text-ink-500 mt-0.5">
                    {locale === 'ar' ? 'يفتح تطبيق انستاباي للمستخدم مباشرة لإتمام التحويل بضغطة واحدة.' : 'Deep-links users directly into the InstaPay app.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: VERSION CONTROL & FORCE UPDATE (التحكم في التحديثات والإصدارات) ── */}
      <div className="card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-ink-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-brand-400" />
            <div>
              <h3 className="text-sm font-bold text-ink-100">
                {locale === 'ar' ? 'التحكم في الإصدارات والتحديث الإجباري (App Version Control)' : 'App Version Control'}
              </h3>
              <p className="text-2xs text-ink-400 mt-0.5">
                {locale === 'ar'
                  ? 'إدارة التحديث الإجباري، إيقاف إشعار التحديث، وتحديد أقل إصدار مسموح به.'
                  : 'Manage force updates, stop updates, and set minimum required versions.'}
              </p>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2">
            {isForceUpdate ? (
              <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-danger-500/20 text-danger-300 border border-danger-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {locale === 'ar' ? 'تحديث إجباري نشط 🔴' : 'Forced Update Active'}
              </span>
            ) : hasUpdatePending ? (
              <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-warning-500/20 text-warning-300 border border-warning-500/30 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {locale === 'ar' ? 'تحديث اختياري متوفر' : 'Optional Update Available'}
              </span>
            ) : (
              <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-success-500/15 text-success-400 border border-success-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {locale === 'ar' ? 'التطبيق مستقر (لا يوجد إشعار تحديث)' : 'Up to Date'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons for Update Control */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-ink-950/40 border border-ink-800">
          <span className="text-2xs font-semibold text-ink-400">
            {locale === 'ar' ? 'إجراءات سريعة:' : 'Quick Actions:'}
          </span>
          <button
            type="button"
            onClick={handleStopUpdates}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700 transition-colors flex items-center gap-1.5"
            title="مساواة أقل إصدار بأحدث إصدار وإلغاء الإجبار لإيقاف أي إزعاج للمستخدمين"
          >
            <Check className="w-3.5 h-3.5 text-success-400" />
            <span>{locale === 'ar' ? 'إيقاف / كتم إشعار التحديث للجميع' : 'Stop Update Prompt'}</span>
          </button>
          <button
            type="button"
            onClick={handleEnforceForceUpdate}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-danger-950/40 hover:bg-danger-900/40 text-danger-300 border border-danger-500/30 transition-colors flex items-center gap-1.5"
            title="تفعيل التحديث الإجباري فوراً لمنع تشغيل الإصدارات القديمة"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-danger-400" />
            <span>{locale === 'ar' ? 'فرض التحديث الإجباري الفوري' : 'Enforce Force Update'}</span>
          </button>
        </div>

        {/* Versions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-2xs font-medium text-ink-400 mb-1">
              {locale === 'ar' ? 'أحدث إصدار مرفوع على المتجر (Latest Version)' : 'Latest Version (Store)'}
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
              <input
                type="text"
                placeholder="1.0.0"
                value={latestVersion}
                onChange={e => updateField(latestKey, e.target.value)}
                className="input w-full pl-9 text-xs font-mono"
              />
            </div>
            <p className="text-3xs text-ink-500 mt-1">
              {locale === 'ar' ? 'رقم الإصدار الأحدث المتوفر للتنزيل.' : 'Highest version published.'}
            </p>
          </div>

          <div>
            <label className="block text-2xs font-medium text-ink-400 mb-1">
              {locale === 'ar' ? 'أقل إصدار مسموح بتشغيله (Min Supported Version)' : 'Min Supported Version'}
            </label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
              <input
                type="text"
                placeholder="1.0.0"
                value={minVersion}
                onChange={e => updateField(minKey, e.target.value)}
                className="input w-full pl-9 text-xs font-mono"
              />
            </div>
            <p className="text-3xs text-ink-500 mt-1">
              {locale === 'ar' ? 'أي مستخدم يمتلك إصداراً أقل من هذا الرقم سيُطلب منه التحديث.' : 'Users below this will be asked to update.'}
            </p>
          </div>
        </div>

        {/* Force Update Toggle Switch */}
        <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
          isForceUpdate ? 'bg-danger-950/30 border-danger-500/40' : 'bg-ink-950/40 border-ink-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-ink-100">
                {locale === 'ar' ? 'تفعيل التحديث الإجباري (Force Update)' : 'Force Update'}
              </h4>
              <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                isForceUpdate ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30' : 'bg-ink-800 text-ink-400'
              }`}>
                {isForceUpdate ? (locale === 'ar' ? 'إجباري (ممنوع التخطي)' : 'Mandatory') : (locale === 'ar' ? 'اختياري (يمكن التخطي)' : 'Optional')}
              </span>
            </div>
            <p className="text-2xs text-ink-400 mt-1">
              {isForceUpdate
                ? (locale === 'ar' ? '🔴 لا يستطيع المستخدم الدخول أو استخدام التطبيق حتى ينتهي من تحديثه.' : 'Users cannot dismiss the update screen.')
                : (locale === 'ar' ? 'المستخدم يستطيع إغلاق شاشة التحديث ومتابعة استخدام التطبيق بشكل طبيعي.' : 'Users can dismiss the dialog and continue using the app.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleToggle(forceKey)}
            className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 ${
              isForceUpdate ? 'bg-danger-600' : 'bg-ink-700'
            }`}
          >
            <span className={`absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white transition-transform ${
              isForceUpdate ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Update Notice Message in Arabic */}
        <div className="space-y-3">
          <div>
            <label className="block text-2xs font-medium text-ink-300 mb-1">
              {locale === 'ar' ? 'عنوان رسالة التحديث في الموبايل' : 'Update Dialog Title (Arabic)'}
            </label>
            <input
              type="text"
              value={updateTitleAr}
              onChange={e => updateField(titleArKey, e.target.value)}
              placeholder="تحديث جديد متوفر!"
              className="input w-full text-xs"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-ink-300 mb-1">
              {locale === 'ar' ? 'نص وتفاصيل رسالة التحديث (عربي)' : 'Update Dialog Message (Arabic)'}
            </label>
            <textarea
              value={updateMsgAr}
              onChange={e => updateField(msgArKey, e.target.value)}
              placeholder="يرجى التحديث للحصول على أفضل تجربة والميزات الجديدة."
              className="input w-full text-xs resize-none"
              rows={2}
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: STORE LINKS (روابط التطبيق على Google Play و App Store) ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-ink-800 pb-3">
          <Smartphone className="w-4 h-4 text-brand-400" />
          <div>
            <h3 className="text-sm font-bold text-ink-100">
              {locale === 'ar' ? 'روابط المتاجر (Store Links & Downloads)' : 'Store Download Links'}
            </h3>
            <p className="text-2xs text-ink-400 mt-0.5">
              {locale === 'ar'
                ? 'الروابط التي يتم توجيه المستخدم إليها عند الضغط على زر "تحديث الآن" أو التحميل.'
                : 'Target URLs when users tap "Update Now" or download buttons.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Play */}
          <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-2xs font-bold text-ink-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Play Store URL</span>
              </label>
              {playStoreUrl && (
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xs text-brand-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{locale === 'ar' ? 'فتح الرابط' : 'Open'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              placeholder="https://play.google.com/store/apps/details?id=..."
              value={playStoreUrl}
              onChange={e => updateField(playKey, e.target.value)}
              className="input w-full text-xs font-mono"
            />
          </div>

          {/* App Store */}
          <div className="p-3.5 rounded-xl bg-ink-950/40 border border-ink-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-2xs font-bold text-ink-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Apple App Store URL</span>
              </label>
              {appStoreUrl && (
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xs text-brand-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{locale === 'ar' ? 'فتح الرابط' : 'Open'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              placeholder="https://apps.apple.com/app/..."
              value={appStoreUrl}
              onChange={e => updateField(iosKey, e.target.value)}
              className="input w-full text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 4: INSTANT PUSH NOTIFICATIONS BROADCAST (إرسال الإشعارات الفورية للمستخدمين) ── */}
      <div className="card p-5 space-y-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/15 via-ink-900 to-ink-950 shadow-soft">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                <span>{locale === 'ar' ? `إرسال إشعار فوري لمستخدمي ${appNameAr}` : `Broadcast Push Notification to ${appNameEn}`}</span>
                <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FCM Push & In-App
                </span>
              </h3>
              <p className="text-2xs text-ink-400 mt-0.5">
                {locale === 'ar'
                  ? 'إرسال تنبيه وتحديث فوري يظهر على شاشات هواتف المستخدمين كإشعار Push من التطبيق مباشرة وعبر مركز التنبيهات.'
                  : 'Broadcast instant push alerts that reach mobile users directly on their lockscreens and inside the app.'}
              </p>
            </div>
        </div>

        {/* Quick Pre-fill Template Pills */}
        <div>
          <label className="block text-2xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
            {locale === 'ar' ? 'قوالب إشعارات سريعة جاهزة بضغطة واحدة:' : 'Quick Pre-fill Templates:'}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                label: '🚀 تحديث جديد',
                title: 'تحديث جديد متوفر الآن! 🚀',
                body: `قم بتحديث تطبيق ${appNameAr} الآن للاستمتاع بأحدث الميزات الحصرية وسرعة الأداء الفائقة.`,
              },
              {
                label: '🎉 عرض ترويجي وخصم',
                title: 'عرض حصري لفترة محدودة! 🎁',
                body: `استمتع بخصم خاص وحصري على باقات الاشتراك في ${appNameAr}. افتح التطبيق الآن للاستفادة من العرض!`,
              },
              {
                label: '💡 نصيحة احترافية',
                title: 'نصيحة مهمة لزيادة نجاحك 💡',
                body: `اكتشف كيف يمكنك مضاعفة نتائجك ومشاركاتك بخطوات بسيطة وفعالة عبر ${appNameAr}.`,
              },
              {
                label: '⚠️ تنبيه صيانة مجدولة',
                title: 'تنبيه صيانة وتحسينات أمنية ⚠️',
                body: 'نقوم حالياً ببعض التحسينات الدورية السريعة لضمان أفضل استقرار وسرعة فائقة لخدمتك.',
              },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNotifTitleAr(tmpl.title);
                  setNotifBodyAr(tmpl.body);
                }}
                className="text-2xs px-2.5 py-1 rounded-lg bg-ink-800/80 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-ink-700/60 text-ink-300 transition-all font-medium"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Notification Form (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Arabic Card */}
            <div className="p-3.5 rounded-xl bg-ink-900/70 border border-ink-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-ink-800">
                <span className="flex items-center gap-2 text-xs font-bold text-ink-200">
                  <span className="text-sm">🇸🇦</span>
                  <span>{locale === 'ar' ? 'النسخة العربية (للمستخدمين العرب)' : 'Arabic Version (For Arabic Users)'}</span>
                </span>
                <span className="text-3xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  RTL Target
                </span>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'عنوان الإشعار (عربي)' : 'Arabic Title'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: عرض خاص ومميز ينتظرك اليوم! 🎉"
                  value={notifTitleAr}
                  onChange={e => setNotifTitleAr(e.target.value)}
                  className="input w-full text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'نص ورسالة الإشعار (عربي)' : 'Arabic Body'} <span className="text-rose-400">*</span>
                </label>
                <textarea
                  dir="rtl"
                  placeholder="اكتب الرسالة التي ستصل للعملاء على شاشة هاتفهم باللغة العربية..."
                  value={notifBodyAr}
                  onChange={e => setNotifBodyAr(e.target.value)}
                  className="input w-full text-xs resize-none h-16"
                />
              </div>
            </div>

            {/* English Card */}
            <div className="p-3.5 rounded-xl bg-ink-900/70 border border-ink-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-ink-800">
                <span className="flex items-center gap-2 text-xs font-bold text-ink-200">
                  <span className="text-sm">🇬🇧</span>
                  <span>{locale === 'ar' ? 'النسخة الإنجليزية (للمستخدمين الأجانب)' : 'English Version (For English Users)'}</span>
                </span>
                <span className="text-3xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium">
                  LTR Target
                </span>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'عنوان الإشعار (إنجليزي)' : 'English Title'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="e.g. Special offer just for you! 🎉"
                  value={notifTitleEn}
                  onChange={e => setNotifTitleEn(e.target.value)}
                  className="input w-full text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-300 mb-1">
                  {locale === 'ar' ? 'نص ورسالة الإشعار (إنجليزي)' : 'English Body'}
                </label>
                <textarea
                  dir="ltr"
                  placeholder="Enter the English notification message that will appear on lockscreens..."
                  value={notifBodyEn}
                  onChange={e => setNotifBodyEn(e.target.value)}
                  className="input w-full text-xs resize-none h-16"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-medium text-ink-300 mb-1">
                  {locale === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
                </label>
                <select
                  value={notifTarget}
                  onChange={e => setNotifTarget(e.target.value as any)}
                  className="input w-full text-xs cursor-pointer"
                >
                  <option value="all">{locale === 'ar' ? '📢 كافة مستخدمي التطبيق (الجميع)' : 'All App Users (Broadcast)'}</option>
                  <option value="subscribers">{locale === 'ar' ? '💎 المشتركين النشطين فقط' : 'Active Subscribers Only'}</option>
                  <option value="free">{locale === 'ar' ? '🎁 المستخدمين المجانيين فقط' : 'Free Tier Users Only'}</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-medium text-ink-300 mb-1">
                  {locale === 'ar' ? 'رابط مباشر عند النقر (اختياري)' : 'Deep Link URL (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="app://offers أو https://..."
                  value={notifDeepLink}
                  onChange={e => setNotifDeepLink(e.target.value)}
                  className="input w-full text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendNotification}
              disabled={sendingNotif || (!notifTitleAr.trim() && !notifTitleEn.trim())}
              className="btn-primary w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-ink-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {sendingNotif ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === 'ar' ? 'جاري بث الإشعار ثنائي اللغة...' : 'Broadcasting bilingual notification...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{locale === 'ar' ? `إرسال الإشعار ثنائي اللغة فوراً لمستخدمي ${appNameAr}` : `Broadcast Bilingual Notification to ${appNameEn}`}</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Mobile Lockscreen Preview (2 cols) */}
          <div className="lg:col-span-2 flex flex-col justify-between p-4 rounded-2xl bg-ink-950/70 border border-ink-800 shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-ink-800/80 mb-3">
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold text-3xs">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'معاينة شاشة الهاتف' : 'Phone Lockscreen Preview'}</span>
                </span>
                
                {/* Preview Language Toggle */}
                <div className="flex items-center bg-ink-900 rounded-lg p-0.5 border border-ink-800 text-3xs">
                  <button
                    type="button"
                    onClick={() => setPreviewLang('ar')}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      previewLang === 'ar' ? 'bg-amber-500 text-ink-950 font-bold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    🇸🇦 العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('en')}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      previewLang === 'en' ? 'bg-amber-500 text-ink-950 font-bold' : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Realistic Mobile Push Banner */}
              <div className="p-3.5 rounded-xl bg-ink-900/90 border border-amber-500/30 shadow-xl backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 text-3xs">
                      {icon || <Bell className="w-3 h-3" />}
                    </div>
                    <span className="text-2xs font-bold text-ink-200 tracking-tight">
                      {previewLang === 'ar' ? (appNameAr || appNameEn) : (appNameEn || appNameAr)}
                    </span>
                  </div>
                  <span className="text-3xs text-ink-500 font-mono">
                    {previewLang === 'ar' ? 'الآن' : 'now'}
                  </span>
                </div>

                <div className={`space-y-0.5 ${previewLang === 'ar' ? 'text-right' : 'text-left'}`} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {previewLang === 'ar'
                      ? (notifTitleAr.trim() || notifTitleEn.trim() || 'عنوان الإشعار بالعربية يظهر هنا')
                      : (notifTitleEn.trim() || notifTitleAr.trim() || 'Notification Title in English')}
                  </p>
                  <p className="text-2xs text-ink-300 line-clamp-2 leading-relaxed">
                    {previewLang === 'ar'
                      ? (notifBodyAr.trim() || notifBodyEn.trim() || 'نص الإشعار بالعربية سيصل للمستخدمين الذين لغة تطبيقهم عربية...')
                      : (notifBodyEn.trim() || notifBodyAr.trim() || 'Notification body will be delivered to users whose app is in English...')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-3xs text-ink-500 text-center mt-4">
              {locale === 'ar'
                ? 'يتم توجيه النص العربي تلقائياً للأجهزة العربية، والنص الإنجليزي للأجهزة الإنجليزية.'
                : 'Arabic users receive Arabic copy; English users receive English copy automatically.'}
            </p>
          </div>
        </div>

        {/* Recent Notification Dispatch History */}
        {notifHistory.length > 0 && (
          <div className="pt-4 border-t border-ink-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-ink-400" />
                <span>{locale === 'ar' ? 'سجل الإشعارات المرسلة مؤخراً للتطبيق:' : 'Recent Dispatched Notifications:'}</span>
              </h4>
              <span className="text-3xs font-mono text-ink-500">
                {notifHistory.length} {locale === 'ar' ? 'إشعار مرسل' : 'sent'}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifHistory.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-lg bg-ink-950/60 border border-ink-800/80 flex items-center justify-between text-xs hover:border-ink-700 transition-all"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                    <p className="font-bold text-ink-100 truncate">{item.title}</p>
                    <p className="text-2xs text-ink-400 truncate">{item.body}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-3xs">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{locale === 'ar' ? 'تم الإرسال' : 'Delivered'}</span>
                    </span>
                    <span className="text-ink-500 font-mono">
                      {item.sent_at ? new Date(item.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-ink-800">
        <div className="flex items-center gap-2">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-brand-400 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{locale === 'ar' ? 'جاري الحفظ الفوري والتطبيق على السيرفر...' : 'Saving to server...'}</span>
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-success-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === 'ar' ? 'جميع الإعدادات محدثة ومتزامنة بنجاح ✓' : 'All settings synced ✓'}</span>
            </span>
          )}
        </div>
        <button
          onClick={handleManualSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? t('common.saving') : (locale === 'ar' ? 'حفظ كافة إعدادات التطبيق' : 'Save App Settings')}</span>
        </button>
      </div>
    </div>
  </div>
  );
}
