import { useState, useEffect, useCallback } from 'react';
import {
  QrCode, Sparkles, Download, Eye, Zap, ShieldCheck, ToggleLeft, ToggleRight,
  Save, RefreshCw, BarChart2, Layers, CheckCircle2, AlertCircle, Palette, UserCheck
} from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

interface QrStats {
  total_qrs: number;
  total_scans: number;
  scans_today: number;
  scans_last_7_days: number;
  active_users: number;
  paid_unlocks: number;
  custom_colors_count: number;
  custom_profiles_count: number;
  by_type: Array<{ label: string; count: number; pct: number }>;
}

export function QrMe() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Real data state
  const [stats, setStats] = useState<QrStats>({
    total_qrs: 0,
    total_scans: 0,
    scans_today: 0,
    scans_last_7_days: 0,
    active_users: 0,
    paid_unlocks: 0,
    custom_colors_count: 0,
    custom_profiles_count: 0,
    by_type: [],
  });
  const [qrs, setQrs] = useState<any[]>([]);
  const [loadingQrs, setLoadingQrs] = useState(false);

  // Paywall states
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [vipPrice, setVipPrice] = useState(15);
  const [activeTab, setActiveTab] = useState<'stats' | 'paywall' | 'recent'>('stats');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.qrMe.stats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load QR Me stats:', err);
    }
  }, []);

  const fetchQrs = useCallback(async () => {
    setLoadingQrs(true);
    try {
      const res = await api.qrMe.list();
      if (res?.data) {
        setQrs(res.data);
      }
    } catch (err) {
      console.error('Failed to load QR Me list:', err);
    } finally {
      setLoadingQrs(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.settings.get().then(s => {
        if (s) {
          setIsPaymentEnabled(s.qr_me_payment_enabled ?? !(s.qr_me_free_mode ?? true));
          if (s.qr_me_vip_price) setVipPrice(s.qr_me_vip_price);
        }
      }).catch(() => {}),
      fetchStats(),
      fetchQrs(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchStats, fetchQrs]);

  const handleTogglePaywall = async (newVal: boolean) => {
    setIsPaymentEnabled(newVal);
    try {
      await api.settings.save({
        qr_me_payment_enabled: newVal,
        qr_me_free_mode: !newVal,
        qr_me_vip_price: vipPrice,
      });
      toast.success(
        newVal ? 'Paywall Activated' : 'Free Mode Enabled',
        newVal 
          ? 'Users will now be asked to pay for VIP QR templates & high-res exports.'
          : 'All VIP QR templates and exports are now 100% FREE for all users (Store Review Safe).'
      );
    } catch {
      toast.error('Failed to update', 'Could not sync paywall status with server.');
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await api.settings.save({
        qr_me_payment_enabled: isPaymentEnabled,
        qr_me_free_mode: !isPaymentEnabled,
        qr_me_vip_price: vipPrice,
      });
      toast.success('Settings Saved', 'QR Me pricing and paywall flags updated successfully.');
    } catch {
      toast.error('Error', 'Failed to save QR Me settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Me — Custom Barcode & QR Suite"
        description="Monitor QR generator metrics, user exports, and manage the dynamic in-app paywall."
        icon={<QrCode className="w-5 h-5" />}
      />

      {/* ── Dynamic Paywall Alert Banner ── */}
      <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        !isPaymentEnabled 
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            !isPaymentEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {!isPaymentEnabled ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">
                {!isPaymentEnabled ? 'Free Mode Active (Google/Apple Review Safe)' : 'VIP Paywall Active'}
              </h3>
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                !isPaymentEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {!isPaymentEnabled ? '100% FREE' : `${vipPrice} EGP / Template`}
              </span>
            </div>
            <p className="text-xs text-ink-300 mt-0.5">
              {!isPaymentEnabled 
                ? 'Payment screens are completely hidden in the app. Users get instant VIP exports without paying.'
                : 'Users must pay via InstaPay / Vodafone Cash to download watermark-free vector SVG/PDF templates.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => handleTogglePaywall(!isPaymentEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !isPaymentEnabled 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
            }`}
          >
            {!isPaymentEnabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
            <span>{!isPaymentEnabled ? 'Switch to Paid Mode' : 'Switch to Free Mode'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Grid (100% Real Database Metrics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total QRs Created"
          value={stats.total_qrs}
          format="num"
          icon={<QrCode className="w-4 h-4" />}
        />
        <KPICard
          label="Total Scans Tracked"
          value={stats.total_scans}
          format="num"
          icon={<Eye className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label="Scans Today"
          value={stats.scans_today}
          format="num"
          icon={<Zap className="w-4 h-4" />}
          accent="warning"
        />
        <KPICard
          label="Active App Users"
          value={stats.active_users}
          format="num"
          icon={<Layers className="w-4 h-4" />}
        />
      </div>

      {/* ── Navigation SubTabs ── */}
      <div className="flex items-center gap-2 border-b border-ink-800">
        {[
          { key: 'stats', label: 'Analytics & Categories', icon: <BarChart2 className="w-4 h-4" /> },
          { key: 'paywall', label: 'Dynamic Paywall Settings', icon: <Zap className="w-4 h-4" /> },
          { key: 'recent', label: 'Recent QR Generations', icon: <Layers className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Stats & Overview ── */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Popular QR Code Formats</span>
            </h3>
            {stats.by_type.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-500">
                No QR codes created yet in database.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.by_type.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-200">{item.label}</span>
                      <span className="font-semibold text-ink-400">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Customization & Pro Features Usage</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">Custom Colors / Styles</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.custom_colors_count}</p>
                <p className="text-2xs text-brand-400 mt-0.5">
                  {stats.total_qrs > 0 ? `${Math.round((stats.custom_colors_count / stats.total_qrs) * 100)}% of total QRs` : 'Live telemetry'}
                </p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">Profile / Business Cards</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.custom_profiles_count}</p>
                <p className="text-2xs text-brand-400 mt-0.5">
                  {stats.total_qrs > 0 ? `${Math.round((stats.custom_profiles_count / stats.total_qrs) * 100)}% of total QRs` : 'Live telemetry'}
                </p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">VIP Paid Unlocks</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.paid_unlocks}</p>
                <p className="text-2xs text-amber-400 mt-0.5">Approved Orders</p>
              </div>
              <div className="p-3 bg-ink-900/60 rounded-xl border border-ink-800">
                <p className="text-xs text-ink-400">Total Scans Tracked</p>
                <p className="text-lg font-bold text-ink-100 mt-1">{stats.total_scans}</p>
                <p className="text-2xs text-success-400 mt-0.5">{stats.scans_today} today</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Paywall Configuration ── */}
      {activeTab === 'paywall' && (
        <div className="max-w-2xl card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-50">QR Me Dynamic Paywall Config</h3>
              <p className="text-xs text-ink-400">Changes take effect immediately in the mobile app without releasing updates.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-ink-900/70 rounded-xl border border-ink-800">
              <div>
                <p className="text-sm font-semibold text-ink-100">In-App Paywall Status</p>
                <p className="text-xs text-ink-400">When OFF, the app runs 100% free with no payment dialogs (safe for Google Play & Apple reviews).</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentEnabled(!isPaymentEnabled)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  isPaymentEnabled ? 'bg-brand-600' : 'bg-ink-700'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isPaymentEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-300">
                VIP Template / High-Res Export Price (EGP)
              </label>
              <input
                type="number"
                value={vipPrice}
                onChange={e => setVipPrice(Number(e.target.value))}
                disabled={!isPaymentEnabled}
                className="input w-full"
                placeholder="15"
              />
              <p className="text-2xs text-ink-500">Amount users are prompted to transfer via InstaPay when payment is enabled.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-ink-800 flex justify-end gap-3">
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Paywall Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 3: Recent Generations (Real database list) ── */}
      {activeTab === 'recent' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-ink-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-100">Recent Generated Codes</h3>
            <span className="text-xs text-ink-400">Live database telemetry</span>
          </div>
          {loadingQrs ? (
            <div className="p-8 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
              <span>Loading QR codes...</span>
            </div>
          ) : qrs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-ink-200 mb-1">No QR Codes Generated Yet</p>
              <p className="text-xs text-ink-500">When users create QR codes in the app, they will appear here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-900/60 text-2xs uppercase tracking-wider text-ink-400 border-b border-ink-800">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Title / Name</th>
                    <th className="py-3 px-4">Identifier / Slug</th>
                    <th className="py-3 px-4">Scans</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/60 text-xs">
                  {qrs.map(q => (
                    <tr key={q.id} className="hover:bg-ink-900/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-brand-300 flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5 text-ink-400" />
                        <span>{q.type || 'Text'}</span>
                      </td>
                      <td className="py-3 px-4 text-ink-200">{q.title || q.profile_name || 'QR Code'}</td>
                      <td className="py-3 px-4 text-ink-400 font-mono text-2xs">{q.slug || q.id}</td>
                      <td className="py-3 px-4 text-ink-300 font-mono">{q.scans_count || q.view_count || 0}</td>
                      <td className="py-3 px-4 text-ink-500">{q.created_at ? timeAgo(q.created_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
