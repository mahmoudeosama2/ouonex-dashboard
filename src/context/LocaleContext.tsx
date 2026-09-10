import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'ar';

const STORAGE_KEY = 'ouonex-dashboard-locale';

const DICT: Record<string, { en: string; ar: string }> = {
  // ── Navigation ──
  'nav.overview': { en: 'Overview', ar: 'نظرة عامة' },
  'nav.analytics': { en: 'Live Analytics', ar: 'التحليلات الحية' },
  'nav.dawaty': { en: 'Dawaty', ar: 'دعوتي' },
  'nav.digital_menu': { en: 'Digital Menu', ar: 'المنيو الرقمي' },
  'nav.cv_maker': { en: 'CV Maker Studio', ar: 'صانع السيرة الذاتية' },
  'nav.qr_me': { en: 'QR Me Barcode', ar: 'باركود QR الذكي' },
  'nav.finance': { en: 'Finance', ar: 'المالية والمدفوعات' },
  'nav.ai_usage': { en: 'AI Usage', ar: 'استهلاك الذكاء الاصطناعي' },
  'nav.users': { en: 'Users Directory', ar: 'دليل المستخدمين' },
  'nav.support': { en: 'Support & Requests', ar: 'الدعم والطلبات' },
  'nav.website': { en: 'Website CMS', ar: 'إدارة الموقع' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },

  // ── Topbar & Common ──
  'topbar.search': { en: 'Search users, payments, restaurants...', ar: 'ابحث عن مستخدمين، مدفوعات، مطاعم...' },
  'topbar.all_operational': { en: 'All systems operational', ar: 'جميع الأنظمة تعمل بكفاءة' },
  'topbar.connected': { en: 'v1.0 · Live Connected', ar: 'الإصدار 1.0 · متصل مباشر' },
  'topbar.switch_role': { en: 'Switch role (demo)', ar: 'تبديل الدور (تجريبي)' },
  'topbar.sign_out': { en: 'Sign out', ar: 'تسجيل الخروج' },
  'common.save': { en: 'Save Changes', ar: 'حفظ التغييرات' },
  'common.saving': { en: 'Saving...', ar: 'جاري الحفظ...' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ar: 'حذف' },
  'common.edit': { en: 'Edit', ar: 'تعديل' },
  'common.filter': { en: 'Filter', ar: 'تصفية' },
  'common.search': { en: 'Search...', ar: 'بحث...' },
  'common.all': { en: 'All', ar: 'الكل' },
  'common.status': { en: 'Status', ar: 'الحالة' },
  'common.actions': { en: 'Actions', ar: 'الإجراءات' },
  'common.date': { en: 'Date', ar: 'التاريخ' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.no_data': { en: 'No data available', ar: 'لا توجد بيانات متاحة' },
  'common.export_csv': { en: 'Export CSV', ar: 'تصدير CSV' },
  'common.view': { en: 'View', ar: 'عرض' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.clear_filter': { en: 'Clear filter', ar: 'إلغاء التصفية' },
  'common.language': { en: 'Language', ar: 'اللغة' },
  'common.arabic': { en: 'العربية', ar: 'العربية' },
  'common.english': { en: 'English', ar: 'English' },

  // ── Overview Page ──
  'overview.title': { en: 'Overview', ar: 'نظرة عامة' },
  'overview.description': { en: 'Cross-product analytics for Dawaty, Digital Menu, and Mobile Apps', ar: 'تحليلات شاملة لمنتجات ونكس وتطبيقات الهاتف' },
  'overview.period_30': { en: '30 days', ar: '30 يوماً' },
  'overview.period_90': { en: '90 days', ar: '90 يوماً' },
  'overview.total_users': { en: 'Total Users', ar: 'إجمالي المستخدمين' },
  'overview.active_users': { en: 'Active Users', ar: 'المستخدمون النشطون' },
  'overview.total_revenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  'overview.pending_payments': { en: 'Pending Payments', ar: 'مدفوعات معلقة' },
  'overview.pending_amount': { en: 'Pending Amount', ar: 'المبلغ المعلق' },
  'overview.active_invitations': { en: 'Active Invitations', ar: 'دعوات نشطة' },
  'overview.active_restaurants': { en: 'Active Restaurants', ar: 'مطاعم نشطة' },
  'overview.revenue_per_active': { en: 'Revenue / Active', ar: 'متوسط إيراد النشط' },
  'overview.revenue_trend': { en: 'Revenue Trend', ar: 'اتجاه الإيرادات' },
  'overview.revenue_sub': { en: 'Approved payments only · last {period} days', ar: 'المدفوعات المعتمدة فقط · آخر {period} يوماً' },
  'overview.user_growth': { en: 'User Growth', ar: 'نمو المستخدمين' },
  'overview.user_growth_sub': { en: 'Total users over time', ar: 'إجمالي المستخدمين عبر الوقت' },
  'overview.product_comparison': { en: 'Product Comparison', ar: 'مقارنة المنتجات' },
  'overview.users': { en: 'Users', ar: 'المستخدمون' },
  'overview.revenue': { en: 'Revenue', ar: 'الإيرادات' },
  'overview.revenue_share': { en: 'Revenue share', ar: 'حصة الإيرادات' },
  'overview.recent_activity': { en: 'Recent Activity', ar: 'أحدث النشاطات' },
  'overview.view_all': { en: 'View all', ar: 'عرض الكل' },
  'overview.backend_health': { en: 'Backend Health', ar: 'حالة الخوادم والأنظمة' },
  'overview.health_updated': { en: 'Last updated {sec}s ago · auto-refreshes every 30s', ar: 'آخر تحديث منذ {sec}ث · تحديث تلقائي كل 30ث' },
  'overview.online': { en: 'Online', ar: 'متصل' },
  'overview.offline': { en: 'Offline', ar: 'غير متصل' },

  // ── Live Analytics Page ──
  'analytics.title': { en: 'Live Analytics & User Behavior', ar: 'التحليلات الحية وسلوك المستخدمين' },
  'analytics.description': { en: 'Real-time monitoring, conversion funnels, and peak traffic across Dawaty & Digital Menu', ar: 'متابعة لحظية ومسارات التحويل وحركة الزيارات عبر تطبيقات المنصة' },
  'analytics.live_sync': { en: 'Live Platform Database Sync', ar: 'مزامنة حية من قواعد البيانات' },
  'analytics.all_platforms': { en: 'All Platforms', ar: 'جميع المنصات' },
  'analytics.hours_24': { en: '24 Hours', ar: '24 ساعة' },
  'analytics.days_7': { en: '7 Days', ar: '7 أيام' },
  'analytics.days_30': { en: '30 Days', ar: '30 يوماً' },
  'analytics.refresh_tooltip': { en: 'Refresh analytics data', ar: 'تحديث بيانات التحليلات' },
  'analytics.live_pulse': { en: 'Live Pulse', ar: 'النبض الحي' },
  'analytics.users_active_now': { en: 'users active now', ar: 'مستخدم نشط الآن' },
  'analytics.browsing_realtime': { en: 'Browsing invitations and menus in real-time', ar: 'يتصفحون الدعوات وقوائم الطعام في الوقت الفعلي' },
  'analytics.total_traffic': { en: 'Total Traffic / Views', ar: 'إجمالي الزيارات والمشاهدات' },
  'analytics.traffic_growth': { en: '+14.2% vs previous period', ar: '+14.2% مقارنة بالفترة السابقة' },
  'analytics.confirmed_actions': { en: 'Confirmed Actions', ar: 'الإجراءات المؤكدة' },
  'analytics.confirmed_actions_sub': { en: 'RSVPs submitted & restaurant orders', ar: 'تأكيدات الحضور والطلبات المكتملة' },
  'analytics.conversion_rate': { en: 'Conversion Rate', ar: 'معدل التحويل' },
  'analytics.avg_duration': { en: 'Avg Duration', ar: 'متوسط مدة الجلسة' },
  'analytics.daily_trend': { en: 'Daily Engagement Trend', ar: 'حركة التفاعل اليومي' },
  'analytics.daily_trend_sub': { en: 'Traffic volume across active wedding cards & restaurant menus', ar: 'حجم الزيارات لبطاقات الدعوة وقوائم المطاعم النشطة' },
  'analytics.db_source_note': { en: 'Directly extracted from live platform databases (100% Real Database Analytics)', ar: 'مستخرجة مباشرة من قواعد بيانات المنصة الفعلية (بيانات حقيقية 100%)' },
  'analytics.bounce_rate': { en: 'Bounce rate', ar: 'معدل الارتداد' },
  'analytics.peak_hours': { en: 'Peak Activity Hours', ar: 'أوقات ذروة التفاعل' },
  'analytics.peak_hours_sub': { en: '24-Hour customer activity heatmap', ar: 'خريطة التفاعل خلال 24 ساعة' },
  'analytics.peak_period': { en: '🔥 7:00 PM – 11:00 PM (Evening Peak)', ar: '🔥 7:00 م – 11:00 م (ذروة المساء)' },
  'analytics.peak_forecast_note': { en: 'Helps restaurants forecast kitchen demand and wedding hosts track guest RSVP peaks.', ar: 'تساعد المطاعم في تقدير طلبات المطبخ وتساعد أصحاب الدعوات على تتبع أوقات تأكيد الحضور.' },
  'analytics.funnel_title': { en: 'Unified Conversion Funnel', ar: 'مسار التحويل الموحد' },
  'analytics.funnel_sub': { en: 'From first view to final completed action', ar: 'من المشاهدة الأولى وحتى إتمام الإجراء' },
  'analytics.dropoff': { en: 'Drop-off', ar: 'نسبة التراجع' },
  'analytics.leaderboard_title': { en: 'Top Performers Leaderboard', ar: 'الأعلى تفاعلاً وإقبالاً' },
  'analytics.leaderboard_sub': { en: 'Most engaged wedding templates & popular dishes', ar: 'قوالب الزفاف الأكثر تفاعلاً وأطباق الطعام الأكثر طلباً' },
  'analytics.popular_templates': { en: 'Most Popular Wedding Templates', ar: 'قوالب الزفاف الأكثر طلباً' },
  'analytics.views': { en: 'views', ar: 'مشاهدة' },
  'analytics.rsvp': { en: 'RSVP', ar: 'تأكيد حضور' },
  'analytics.popular_dishes': { en: 'Most Viewed Menu Dishes', ar: 'أطباق المنيو الأكثر مشاهدة' },
  'analytics.devices_stat': { en: 'Devices: 58% Android • 36% iOS • 6% Web', ar: 'الأجهزة: 58% أندرويد • 36% آيفون • 6% ويب' },
  'analytics.auto_synced': { en: 'Auto-synced', ar: 'مزامنة تلقائية' },

  // ── CV Maker Page ──
  'cv.title': { en: 'CV Maker — Professional Resume Studio', ar: 'صانع السيرة الذاتية — استوديو النماذج المهنية' },
  'cv.description': { en: 'Monitor resume downloads, template sales demand, and manage the dynamic PDF paywall.', ar: 'متابعة تحميلات السير الذاتية، ومبيعات وإقبال القوالب، وإدارة جدار الدفع.' },
  'cv.free_mode_title': { en: 'Free Mode Active (Google/Apple Review Safe)', ar: 'الوضع المجاني مفعّل (آمن لمراجعة المتاجر)' },
  'cv.paid_mode_title': { en: 'VIP PDF Paywall Active', ar: 'جدار دفع ملفات الـ PDF مفعّل' },
  'cv.free_badge': { en: '100% FREE', ar: '100% مجاني' },
  'cv.price_per_pdf': { en: '{price} EGP / PDF', ar: '{price} ج.م / ملف PDF' },
  'cv.free_desc': { en: 'Payment dialog is hidden in the app. Users can download water-mark free PDFs immediately.', ar: 'نافذة الدفع مخفية داخل التطبيق. يمكن للمستخدمين تحميل الملفات مباشرة بدون علامات مائية.' },
  'cv.paid_desc': { en: 'Users must confirm payment via InstaPay / Vodafone Cash to unlock vector PDF downloads.', ar: 'يُطلب من المستخدمين تأكيد الدفع عبر إنستاباي أو فودافون كاش لتحميل ملف الـ PDF.' },
  'cv.switch_to_paid': { en: 'Switch to Paid Mode', ar: 'التحويل للوضع المدفوع' },
  'cv.switch_to_free': { en: 'Switch to Free Mode', ar: 'التحويل للوضع المجاني' },
  'cv.kpi_total_resumes': { en: 'Total Resumes Created', ar: 'إجمالي السير الذاتية المنشأة' },
  'cv.kpi_pdf_exports': { en: 'PDF Resumes Exported', ar: 'ملفات السير الذاتية المحملة' },
  'cv.kpi_paid_unlocks': { en: 'VIP Paid Unlocks', ar: 'عمليات الشراء والفتح المدفوع' },
  'cv.kpi_active_seekers': { en: 'Active Job Seekers', ar: 'الباحثون عن عمل النشطون' },
  'cv.tab_template_sales': { en: 'Template Sales & Demand', ar: 'مبيعات وإقبال القوالب' },
  'cv.tab_analytics': { en: 'Overview & Categories', ar: 'نظرة عامة والتصنيفات' },
  'cv.tab_gallery': { en: 'Template Gallery', ar: 'معرض القوالب' },
  'cv.tab_paywall': { en: 'Paywall Controls', ar: 'إعدادات جدار الدفع' },
  'cv.tab_recent': { en: 'Recent Resumes', ar: 'السير الذاتية المنشأة حديثاً' },
  'cv.sales_title': { en: 'Template Purchase & Demand Analysis', ar: 'تحليل مبيعات وإقبال القوالب' },
  'cv.sales_desc': { en: 'Real-time breakdown of which templates are most bought and most demanded by users.', ar: 'تفصيل مباشر لأكثر القوالب شراءً وطلباً من قبل المستخدمين.' },
  'cv.total_templates_card': { en: 'Total Templates', ar: 'إجمالي القوالب المتاحة' },
  'cv.total_templates_sub': { en: 'Ready for users in mobile app', ar: 'جاهزة للاستخدام في تطبيق الهاتف' },
  'cv.total_purchases_card': { en: 'Total Purchases', ar: 'إجمالي عمليات الشراء' },
  'cv.total_purchases_sub': { en: 'VIP & paid template unlocks', ar: 'عمليات شراء وفتح القوالب المميزة' },
  'cv.top_seller_card': { en: 'Top Best Seller', ar: 'القالب الأكثر مبيعاً' },
  'cv.most_created_card': { en: 'Most Created', ar: 'الأكثر استخداماً' },
  'cv.search_placeholder': { en: 'Search template name...', ar: 'ابحث باسم القالب...' },
  'cv.sort_purchases': { en: 'Purchases', ar: 'الأكثر شراءً' },
  'cv.sort_creations': { en: 'Creations', ar: 'الأكثر استخداماً' },
  'cv.sort_exports': { en: 'Exports', ar: 'الأكثر تحميلاً' },
  'cv.th_rank_template': { en: 'Rank & Template', ar: 'الترتيب والقالب' },
  'cv.th_buyers_purchases': { en: 'Buyers / Purchases', ar: 'المشترون وعمليات الشراء' },
  'cv.th_demand_share': { en: 'Demand Share', ar: 'نسبة الإقبال من المبيعات' },
  'cv.th_creations': { en: 'Resumes Created', ar: 'مرات الاستخدام' },
  'cv.th_downloads': { en: 'PDF Exports', ar: 'التحميلات' },
  'cv.th_demand_status': { en: 'Demand Status', ar: 'حالة الإقبال' },
  'cv.btn_view_resumes': { en: 'View Resumes', ar: 'عرض السير الذاتية' },
  'cv.status_high_demand': { en: '🔥 High Demand', ar: '🔥 إقبال مرتفع جداً' },
  'cv.status_active_demand': { en: '⚡ Active Demand', ar: '⚡ إقبال نشط' },
  'cv.status_free_tier': { en: 'Free Tier Usage', ar: 'استخدام مجاني فقط' },
  'cv.status_no_purchases': { en: 'No purchases yet', ar: 'لم يُشترَ بعد' },
  'cv.best_seller_badge': { en: '#1 Best Seller', ar: '#1 الأكثر مبيعاً' },
  'cv.recent_title': { en: 'Recent Candidate Resumes', ar: 'أحدث السير الذاتية' },
  'cv.candidate': { en: 'Candidate', ar: 'المتقدم' },
  'cv.target_job': { en: 'Target Job Title', ar: 'المسمى الوظيفي' },
  'cv.chosen_template': { en: 'Chosen Template', ar: 'القالب المختار' },
  'cv.downloads': { en: 'Downloads', ar: 'التحميلات' },
  'cv.tier': { en: 'Tier', ar: 'الباقة' },
  'cv.generated': { en: 'Generated', ar: 'تاريخ الإنشاء' },
  'cv.vip_paid': { en: 'VIP Paid', ar: 'مدفوع VIP' },
  'cv.free_tier': { en: 'Free Tier', ar: 'مجاني' },
  'cv.no_resumes_yet': { en: 'No Resumes Generated Yet', ar: 'لم يتم إنشاء سير ذاتية بعد' },
  'cv.no_resumes_desc': { en: 'When users create resumes in the CV Maker app, they will appear here in real time.', ar: 'عند قيام المستخدمين بإنشاء سير ذاتية في التطبيق، ستظهر هنا مباشرة.' },

  // ── QR Me Page ──
  'qr.title': { en: 'QR Me — Custom Barcode & QR Suite', ar: 'باركود QR الذكي — استوديو وتتبع الأكواد' },
  'qr.description': { en: 'Monitor QR generator metrics, user exports, and manage the dynamic in-app paywall.', ar: 'متابعة إحصائيات منشئ الـ QR والمسح، وإدارة جدار الدفع.' },
  'qr.kpi_total_qrs': { en: 'Total QRs Created', ar: 'إجمالي أكواد QR المنشأة' },
  'qr.kpi_total_scans': { en: 'Total Scans Tracked', ar: 'إجمالي عمليات المسح' },
  'qr.kpi_scans_today': { en: 'Scans Today', ar: 'عمليات المسح اليوم' },
  'qr.kpi_active_users': { en: 'Active App Users', ar: 'المستخدمون النشطون' },
  'qr.tab_stats': { en: 'Analytics & Categories', ar: 'التحليلات والتصنيفات' },
  'qr.tab_paywall': { en: 'Dynamic Paywall Settings', ar: 'إعدادات جدار الدفع' },
  'qr.tab_recent': { en: 'Recent QR Generations', ar: 'أحدث الأكواد المنشأة' },
  'qr.popular_formats': { en: 'Popular QR Code Formats', ar: 'أنواع الأكواد الأكثر شيوعاً' },
  'qr.customization_usage': { en: 'Customization & Pro Features Usage', ar: 'استخدام الميزات المتقدمة والتخصيص' },
  'qr.custom_colors': { en: 'Custom Colors / Styles', ar: 'ألوان وتنسيقات مخصصة' },
  'qr.business_cards': { en: 'Profile / Business Cards', ar: 'بطاقات أعمال وبروفايلات' },
  'qr.paid_unlocks': { en: 'VIP Paid Unlocks', ar: 'الترقيات المدفوعة' },
  'qr.th_type': { en: 'Type', ar: 'النوع' },
  'qr.th_title': { en: 'Title / Name', ar: 'العنوان / الاسم' },
  'qr.th_slug': { en: 'Identifier / Slug', ar: 'المعرف / الرابط' },
  'qr.th_scans': { en: 'Scans', ar: 'مرات المسح' },
  'qr.th_created': { en: 'Created', ar: 'تاريخ الإنشاء' },
  'qr.no_qrs_yet': { en: 'No QR Codes Generated Yet', ar: 'لا توجد أكواد QR منشأة بعد' },
  'qr.no_qrs_desc': { en: 'When users create QR codes in the app, they will appear here in real time.', ar: 'عند إنشاء أكواد QR في التطبيق، ستظهر في هذا الجدول مباشرة.' },

  // ── Dawaty Page ──
  'dawaty.title': { en: 'Dawaty', ar: 'دعوتي' },
  'dawaty.description': { en: 'Wedding invitations, RSVP responses, and guest tracking', ar: 'دعوات المناسبات وتأكيدات الحضور وتتبع الضيوف' },
  'dawaty.kpi_total': { en: 'Total Invitations', ar: 'إجمالي الدعوات' },
  'dawaty.kpi_published': { en: 'Published', ar: 'المنشورة' },
  'dawaty.kpi_visits': { en: 'Total Visits', ar: 'إجمالي الزيارات' },
  'dawaty.kpi_rsvp': { en: 'RSVPs (attending)', ar: 'تأكيدات الحضور (نعم)' },
  'dawaty.funnel_title': { en: 'Invitation Funnel', ar: 'مسار تفاعل الدعوات' },
  'dawaty.funnel_created': { en: 'Created', ar: 'تم الإنشاء' },
  'dawaty.funnel_published': { en: 'Published', ar: 'تم النشر' },
  'dawaty.funnel_viewed': { en: 'Viewed', ar: 'تم العرض' },
  'dawaty.funnel_rsvp': { en: 'RSVP Submitted', ar: 'تم تأكيد الحضور' },
  'dawaty.export_excel': { en: 'Export to Excel (CSV)', ar: 'تصدير إلى Excel (CSV)' },
  'dawaty.selected_count': { en: '{count} selected', ar: 'تم تحديد {count}' },
  'dawaty.clear_selection': { en: 'Clear', ar: 'إلغاء' },
  'dawaty.delete_selected': { en: 'Delete Selected ({count})', ar: 'حذف المحدد ({count})' },
  'dawaty.th_couple': { en: 'Couple', ar: 'العروسين' },
  'dawaty.th_live_url': { en: 'Live URL', ar: 'الرابط المباشر' },
  'dawaty.th_status': { en: 'Status', ar: 'الحالة' },
  'dawaty.th_template': { en: 'Template', ar: 'القالب' },
  'dawaty.th_owner': { en: 'Owner', ar: 'المالك' },
  'dawaty.th_visits': { en: 'Visits', ar: 'الزيارات' },
  'dawaty.th_rsvp': { en: 'RSVP', ar: 'الحضور' },
  'dawaty.th_created': { en: 'Created', ar: 'تاريخ الإنشاء' },
  'dawaty.empty_title': { en: 'No invitations found', ar: 'لا توجد دعوات' },
  'dawaty.empty_desc': { en: 'Try adjusting your status filter.', ar: 'جرب تغيير تصفية الحالة.' },
  'dawaty.filter_all': { en: 'All', ar: 'الكل' },
  'dawaty.filter_draft': { en: 'Draft', ar: 'مسودة' },
  'dawaty.filter_published': { en: 'Published', ar: 'منشور' },
  'dawaty.filter_expired': { en: 'Expired', ar: 'منتهي' },

  // ── Digital Menu Page ──
  'menu.title': { en: 'Digital Menu', ar: 'المنيو الرقمي' },
  'menu.description': { en: 'Restaurant menus, AI scan, and orders', ar: 'قوائم المطاعم الرقمية، مسح المنيو بالذكاء الاصطناعي، والطلبات' },
  'menu.tab_restaurants': { en: 'Restaurants', ar: 'المطاعم' },
  'menu.tab_ai': { en: 'AI Scan', ar: 'مسح الذكاء الاصطناعي' },
  'menu.tab_orders': { en: 'Orders', ar: 'الطلبات' },
  'menu.kpi_total_restaurants': { en: 'Total Restaurants', ar: 'إجمالي المطاعم' },
  'menu.kpi_active_menus': { en: 'Active Menus', ar: 'قوائم الطعام النشطة' },
  'menu.kpi_ai_scans': { en: 'AI Scans', ar: 'عمليات المسح بالذكاء الاصطناعي' },
  'menu.kpi_ai_cost': { en: 'AI Scan Cost', ar: 'تكلفة الذكاء الاصطناعي' },
  'menu.th_restaurant': { en: 'Restaurant', ar: 'المطعم' },
  'menu.th_slug': { en: 'Slug / URL', ar: 'الرابط' },
  'menu.th_plan': { en: 'Plan', ar: 'الباقة' },
  'menu.th_status': { en: 'Status', ar: 'الحالة' },
  'menu.th_categories': { en: 'Categories', ar: 'الأقسام' },
  'menu.th_items': { en: 'Dishes', ar: 'الأطباق' },
  'menu.th_orders': { en: 'Orders', ar: 'الطلبات' },
  'menu.th_created': { en: 'Created', ar: 'تاريخ الإنشاء' },
  'menu.empty_title': { en: 'No restaurants found', ar: 'لا توجد مطاعم' },

  // ── Finance Page ──
  'finance.title': { en: 'Finance', ar: 'المالية والمدفوعات' },
  'finance.description': { en: 'Review and confirm pending payments across all products', ar: 'مراجعة وتأكيد المدفوعات المعلقة عبر جميع المنتجات' },
  'finance.tab_pending': { en: 'Pending Review', ar: 'بانتظار المراجعة' },
  'finance.tab_all': { en: 'All Transactions', ar: 'جميع المعاملات' },
  'finance.tab_rejected': { en: 'Rejected', ar: 'المرفوضة' },
  'finance.kpi_total_revenue': { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  'finance.kpi_pending_review': { en: 'Pending Review', ar: 'معاملات قيد المراجعة' },
  'finance.kpi_pending_amount': { en: 'Pending Amount', ar: 'المبلغ المعلق' },
  'finance.kpi_rejected': { en: 'Rejected', ar: 'المرفوضة' },
  'finance.chart_rev_over_time': { en: 'Revenue Over Time', ar: 'الإيرادات عبر الوقت' },
  'finance.chart_rev_over_time_sub': { en: 'Approved payments · last 30 days', ar: 'المدفوعات المعتمدة · آخر 30 يوماً' },
  'finance.chart_rev_by_product': { en: 'Revenue by Product', ar: 'الإيرادات حسب المنتج' },
  'finance.chart_rev_by_product_sub': { en: 'Total approved', ar: 'إجمالي المعتمد' },
  'finance.th_reference': { en: 'Reference', ar: 'الرقم المرجعي' },
  'finance.th_user_restaurant': { en: 'User / Restaurant', ar: 'المستخدم / المطعم' },
  'finance.th_product': { en: 'Product', ar: 'المنتج' },
  'finance.th_amount': { en: 'Amount', ar: 'المبلغ' },
  'finance.th_status': { en: 'Status', ar: 'الحالة' },
  'finance.th_submitted': { en: 'Submitted', ar: 'تاريخ الإرسال' },
  'finance.btn_approve': { en: 'Approve', ar: 'اعتماد' },
  'finance.btn_reject': { en: 'Reject', ar: 'رفض' },
  'finance.btn_view_receipt': { en: 'View receipt', ar: 'عرض الإيصال' },
  'finance.all_caught_up': { en: 'All caught up', ar: 'لا توجد مدفوعات معلقة' },
  'finance.no_pending_msg': { en: 'No payments are waiting for review.', ar: 'لا توجد دفعات بانتظار المراجعة حالياً.' },
  'finance.filter_product': { en: 'Product', ar: 'المنتج' },
  'finance.filter_status': { en: 'Status', ar: 'الحالة' },
  'finance.filter_all': { en: 'All', ar: 'الكل' },
  'finance.filter_pending': { en: 'Pending Review', ar: 'قيد المراجعة' },
  'finance.filter_paid': { en: 'Paid', ar: 'مدفوع' },
  'finance.filter_rejected': { en: 'Rejected', ar: 'مرفوض' },
  'finance.mismatch_warning': { en: 'Amount mismatch detected — submitted {sub} but expected {exp}. Please verify before approving.', ar: 'تم رصد اختلاف في المبلغ — المبلغ المرسل {sub} بينما المتوقع {exp}. يرجى التحقق قبل الاعتماد.' },

  // ── AI Usage Page ──
  'ai.title': { en: 'AI Usage', ar: 'استهلاك الذكاء الاصطناعي' },
  'ai.description': { en: 'Cross-product AI scan analytics', ar: 'تحليلات مسح القوائم بالذكاء الاصطناعي' },
  'ai.kpi_total_scans': { en: 'Total Scans', ar: 'إجمالي عمليات المسح' },
  'ai.kpi_success_rate': { en: 'Success Rate', ar: 'نسبة النجاح' },
  'ai.kpi_failed': { en: 'Failed', ar: 'العمليات الفاشلة' },
  'ai.kpi_total_cost': { en: 'Total Cost', ar: 'إجمالي التكلفة' },
  'ai.th_scan_id': { en: 'Scan ID', ar: 'معرف العملية' },
  'ai.th_restaurant': { en: 'Restaurant', ar: 'المطعم' },
  'ai.th_status': { en: 'Status', ar: 'الحالة' },
  'ai.th_cost': { en: 'Cost', ar: 'التكلفة' },
  'ai.th_duration': { en: 'Duration', ar: 'المدة' },
  'ai.th_error': { en: 'Error', ar: 'الخطأ' },
  'ai.th_date': { en: 'Date', ar: 'التاريخ' },

  // ── Users Page ──
  'users.title': { en: 'Users Directory', ar: 'دليل المستخدمين' },
  'users.description': { en: 'Search and inspect registered users across all products', ar: 'البحث عن المستخدمين المسجلين واستعراض بياناتهم' },
  'users.search_placeholder': { en: 'Search users by name, email, or phone...', ar: 'ابحث باسم المستخدم أو البريد أو الهاتف...' },
  'users.export_csv': { en: 'Export to CSV', ar: 'تصدير CSV' },
  'users.th_name': { en: 'User', ar: 'المستخدم' },
  'users.th_products': { en: 'Products', ar: 'المنتجات المستخدمة' },
  'users.th_payments': { en: 'Payments', ar: 'المدفوعات' },
  'users.th_joined': { en: 'Joined', ar: 'تاريخ التسجيل' },
  'users.empty_title': { en: 'No users found', ar: 'لم يتم العثور على مستخدمين' },
  'users.empty_desc': { en: 'Try adjusting your search query.', ar: 'جرب تغيير كلمة البحث.' },

  // ── Support Page ──
  'support.title': { en: 'Support & Requests', ar: 'الدعم الفني والطلبات' },
  'support.description': { en: 'Manage customer inquiries, bug reports, and account deletion requests', ar: 'إدارة استفسارات العملاء وبلاغات المشكلات وطلبات حذف الحسابات' },
  'support.tab_tickets': { en: 'Support Tickets', ar: 'تذاكر الدعم' },
  'support.tab_deletions': { en: 'Account Deletion Requests', ar: 'طلبات حذف الحسابات' },
  'support.kpi_open': { en: 'Open Tickets', ar: 'تذاكر مفتوحة' },
  'support.kpi_deletions': { en: 'Pending Deletions', ar: 'طلبات حذف معلقة' },
  'support.kpi_total': { en: 'Total Tickets', ar: 'إجمالي التذاكر' },

  // ── Website CMS ──
  'website.title': { en: 'Website CMS', ar: 'إدارة محتوى الموقع' },
  'website.description': { en: 'Manage the landing page content of ouonex.com', ar: 'إدارة محتوى الصفحة الرئيسية لموقع ouonex.com' },
  'website.tab_general': { en: 'General & Contacts', ar: 'البيانات العامة والتواصل' },
  'website.tab_sections': { en: 'Landing Sections', ar: 'أقسام الموقع' },
  'website.tab_products': { en: 'Products Display', ar: 'عرض المنتجات' },

  // ── Settings Page ──
  'settings.title': { en: 'Settings', ar: 'الإعدادات' },
  'settings.description': { en: 'Team, audit log, and system health', ar: 'إدارة الفريق وسجل التدقيق وصحة النظام' },
  'settings.tab_general': { en: 'General', ar: 'عام' },
  'settings.tab_team': { en: 'Team', ar: 'فريق العمل' },
  'settings.tab_audit': { en: 'Audit Log', ar: 'سجل العمليات' },
  'settings.tab_health': { en: 'Health', ar: 'حالة النظام' },
};

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
      document.body.classList.add('rtl-layout');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en');
      document.body.classList.remove('rtl-layout');
    }
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  };

  const toggle = () => setLocale(locale === 'en' ? 'ar' : 'en');

  const t = (key: string, params?: Record<string, string | number>): string => {
    const entry = DICT[key];
    let text = entry ? entry[locale] : key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
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
