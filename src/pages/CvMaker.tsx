import { useState, useEffect } from 'react';
import {
  FileText, Sparkles, Download, Eye, Zap, ShieldCheck, ToggleLeft, ToggleRight,
  Save, RefreshCw, BarChart2, Share2, Layers, CheckCircle2, AlertCircle, Award,
  Briefcase, GraduationCap, Palette, Users
} from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';

interface CvItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  template: string;
  downloads: number;
  isVip: boolean;
  createdAt: string;
}

const MOCK_CVS: CvItem[] = [
  { id: 'cv_1', candidateName: 'Mahmoud Osama', jobTitle: 'Senior Full-Stack Engineer', template: 'Modern Executive (Tech)', downloads: 14, isVip: true, createdAt: '15 mins ago' },
  { id: 'cv_2', candidateName: 'Sara Ahmed', jobTitle: 'UI/UX Product Designer', template: 'Creative Minimalist', downloads: 8, isVip: true, createdAt: '45 mins ago' },
  { id: 'cv_3', candidateName: 'Omar Khaled', jobTitle: 'Digital Marketing Specialist', template: 'Professional Classic', downloads: 22, isVip: false, createdAt: '2 hours ago' },
  { id: 'cv_4', candidateName: 'Nouran Mostafa', jobTitle: 'Financial Analyst', template: 'Executive Corporate', downloads: 5, isVip: true, createdAt: '4 hours ago' },
  { id: 'cv_5', candidateName: 'Youssef Ibrahim', jobTitle: 'Civil Site Engineer', template: 'Simple Grid Clean', downloads: 31, isVip: false, createdAt: '6 hours ago' },
];

export function CvMaker() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Paywall states
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [pdfPrice, setPdfPrice] = useState(25);
  const [activeTab, setActiveTab] = useState<'stats' | 'templates' | 'paywall' | 'recent'>('stats');

  useEffect(() => {
    // Load current settings from backend / Firestore
    api.settings.get().then(s => {
      if (s) {
        setIsPaymentEnabled(s.cv_maker_payment_enabled ?? !(s.cv_maker_free_mode ?? true));
        if (s.cv_maker_pdf_price) setPdfPrice(s.cv_maker_pdf_price);
      }
    }).catch(() => {});
  }, []);

  const handleTogglePaywall = async (newVal: boolean) => {
    setIsPaymentEnabled(newVal);
    try {
      await api.settings.save({
        cv_maker_payment_enabled: newVal,
        cv_maker_free_mode: !newVal,
        cv_maker_pdf_price: pdfPrice,
      });
      toast.success(
        newVal ? 'CV Paywall Activated' : 'Free Mode Enabled',
        newVal 
          ? 'Users will now be asked to pay before downloading premium PDF resumes.'
          : 'All CV templates and PDF exports are now 100% FREE for all users (Store Review Safe).'
      );
    } catch {
      toast.error('Failed to update', 'Could not sync paywall status with server.');
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      await api.settings.save({
        cv_maker_payment_enabled: isPaymentEnabled,
        cv_maker_free_mode: !isPaymentEnabled,
        cv_maker_pdf_price: pdfPrice,
      });
      toast.success('Settings Saved', 'CV Maker pricing and paywall flags updated successfully.');
    } catch {
      toast.error('Error', 'Failed to save CV Maker settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CV Maker — Professional Resume Studio"
        description="Monitor resume downloads, template popularity, and manage the dynamic PDF paywall."
        icon={<FileText className="w-5 h-5" />}
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
                {!isPaymentEnabled ? 'Free Mode Active (Google/Apple Review Safe)' : 'VIP PDF Paywall Active'}
              </h3>
              <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                !isPaymentEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {!isPaymentEnabled ? '100% FREE' : `${pdfPrice} EGP / PDF`}
              </span>
            </div>
            <p className="text-xs text-ink-300 mt-0.5">
              {!isPaymentEnabled 
                ? 'Payment dialog is hidden in the app. Users can download water-mark free PDFs immediately.'
                : 'Users must confirm payment via InstaPay / Vodafone Cash to unlock vector PDF downloads.'}
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

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Resumes Created"
          value={12480}
          format="num"
          delta={{ value: 21.6, label: '+21.6%', direction: 'up' }}
          icon={<FileText className="w-4 h-4" />}
        />
        <KPICard
          label="PDF Resumes Exported"
          value={8340}
          format="num"
          delta={{ value: 16.3, label: '+16.3%', direction: 'up' }}
          icon={<Download className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label="VIP Paid Unlocks"
          value={1120}
          format="num"
          icon={<Zap className="w-4 h-4" />}
          accent="warning"
        />
        <KPICard
          label="Active Job Seekers"
          value={4690}
          format="num"
          delta={{ value: 9.8, label: '+9.8%', direction: 'up' }}
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* ── Navigation SubTabs ── */}
      <div className="flex items-center gap-2 border-b border-ink-800">
        {[
          { key: 'stats', label: 'Overview & Templates', icon: <BarChart2 className="w-4 h-4" /> },
          { key: 'templates', label: 'Template Gallery', icon: <Palette className="w-4 h-4" /> },
          { key: 'paywall', label: 'Paywall Controls', icon: <Zap className="w-4 h-4" /> },
          { key: 'recent', label: 'Recent Resumes', icon: <Layers className="w-4 h-4" /> },
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
              <Palette className="w-4 h-4 text-brand-400" />
              <span>Most Popular Resume Templates</span>
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Modern Executive (Tech & Engineering)', pct: 42, count: '5,240' },
                { label: 'Minimalist Clean (General / Fresh Grad)', pct: 28, count: '3,490' },
                { label: 'Creative Designer (Portfolio Style)', pct: 16, count: '1,990' },
                { label: 'Corporate Banker & Finance', pct: 9, count: '1,120' },
                { label: 'Academic & Research CV', pct: 5, count: '640' },
              ].map(item => (
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
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Top Career Categories</span>
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Software Engineering & IT', pct: 36, count: '4,490' },
                { label: 'Marketing & Sales', pct: 24, count: '2,990' },
                { label: 'Healthcare & Pharmacy', pct: 18, count: '2,240' },
                { label: 'Accounting & Banking', pct: 14, count: '1,750' },
                { label: 'Human Resources & Admin', pct: 8, count: '1,010' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink-200">{item.label}</span>
                    <span className="font-semibold text-ink-400">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Template Gallery ── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Modern Tech Executive', tag: 'VIP Premium', desc: 'Dual-column with skill proficiency bars, timeline bullets, and dark sidebar.' },
            { name: 'Clean Minimalist ATS', tag: 'Free Tier', desc: 'Single-column text optimized for automated Applicant Tracking Systems.' },
            { name: 'Creative Portfolio', tag: 'VIP Premium', desc: 'Vibrant color accents, QR contact code embed, and portfolio link pills.' },
            { name: 'Corporate Banking', tag: 'VIP Premium', desc: 'Formal serif typography, structured credentials grid, and executive summary.' },
            { name: 'Fresh Graduate Simple', tag: 'Free Tier', desc: 'Highlights coursework, graduation projects, internships, and languages.' },
            { name: 'Medical & Healthcare', tag: 'VIP Premium', desc: 'Dedicated certifications section, license badges, and clinical rotations.' },
          ].map(tpl => (
            <div key={tpl.name} className="card p-4 space-y-3 border border-ink-800 hover:border-brand-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                  tpl.tag.includes('VIP') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>{tpl.tag}</span>
                <span className="text-2xs text-ink-400 flex items-center gap-1">
                  <Download className="w-3 h-3" /> PDF Export
                </span>
              </div>
              <h4 className="text-sm font-bold text-ink-100">{tpl.name}</h4>
              <p className="text-xs text-ink-400 leading-relaxed">{tpl.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: Paywall Controls ── */}
      {activeTab === 'paywall' && (
        <div className="card p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-ink-100 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span>CV Maker Dynamic Paywall Configuration</span>
            </h3>
            <p className="text-xs text-ink-400">
              Settings synchronized in real-time with Firebase and user mobile apps without requiring app store updates.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-ink-800/60">
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-ink-100">Global In-App Paywall</p>
                <p className="text-xs text-ink-400">When enabled, users must pay via InstaPay / Vodafone Cash to download PDFs.</p>
              </div>
              <button
                onClick={() => setIsPaymentEnabled(!isPaymentEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isPaymentEnabled ? 'bg-brand-500' : 'bg-ink-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPaymentEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-ink-100">Store Review Bypass (Free Mode)</p>
                <p className="text-xs text-ink-400">When reviewing with Apple / Google, toggle this to hide all payment prompts.</p>
              </div>
              <button
                onClick={() => setIsPaymentEnabled(!isPaymentEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${!isPaymentEnabled ? 'bg-emerald-500' : 'bg-ink-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${!isPaymentEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="pt-4 space-y-2">
              <label className="block text-xs font-semibold text-ink-200">
                PDF Export Unlock Price (EGP)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={pdfPrice}
                  onChange={e => setPdfPrice(Number(e.target.value))}
                  className="input max-w-[160px]"
                />
                <span className="text-xs text-ink-400 font-medium">EGP per resume export</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ink-800 flex justify-end">
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2 px-5 py-2 text-xs font-bold"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 4: Recent CVs ── */}
      {activeTab === 'recent' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-ink-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-100">Recent Candidate Resumes</h3>
            <span className="text-xs text-ink-400">Real-time export telemetry</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Target Job Title</th>
                  <th>Chosen Template</th>
                  <th>Downloads</th>
                  <th>Tier</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CVS.map(c => (
                  <tr key={c.id}>
                    <td className="font-semibold text-ink-100">{c.candidateName}</td>
                    <td className="text-ink-300">{c.jobTitle}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded bg-ink-800/80 text-ink-300 border border-ink-700/50">
                        {c.template}
                      </span>
                    </td>
                    <td className="font-mono text-ink-200">{c.downloads}</td>
                    <td>
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                        c.isVip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-ink-700/40 text-ink-400'
                      }`}>
                        {c.isVip ? 'VIP Paid' : 'Free Tier'}
                      </span>
                    </td>
                    <td className="text-2xs text-ink-500">{c.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
