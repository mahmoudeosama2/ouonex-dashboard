import { useEffect, useState, useCallback } from 'react';
import {
  Globe2, Mail, MessageCircle, Phone, Save, Loader2, Eye, EyeOff,
  ExternalLink, GripVertical, Type, FileText, Layout,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { WebsiteContent, ProductInfo } from '@/lib/types';
import { PageHeader } from '@/components/Layout';
import { ErrorState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/Skeleton';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';

type Tab = 'general' | 'sections' | 'products';

export function WebsiteCMS() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div>
      <PageHeader
        title={t('website.title')}
        description={t('website.description')}
        icon={<Globe2 className="w-5 h-5" />}
      />

      {/* SubTab Segmented Control */}
      <div className="flex items-center gap-1.5 p-1.5 mb-6 rounded-2xl bg-ink-900/80 border border-ink-800/80 backdrop-blur-md shadow-inner overflow-x-auto scrollbar-none">
        {([
          { key: 'general', label: t('website.tab_general'), icon: <Mail className="w-4 h-4" /> },
          { key: 'sections', label: t('website.tab_sections'), icon: <Layout className="w-4 h-4" /> },
          { key: 'products', label: t('website.tab_products'), icon: <GripVertical className="w-4 h-4" /> },
        ] as const).map(tabItem => {
          const isActive = tab === tabItem.key;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-2.5 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ease-out shrink-0 active:scale-[0.97] ${
                isActive
                  ? 'bg-gradient-to-r from-ink-800 to-ink-850 text-brand-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] border border-ink-700/60 ring-1 ring-brand-500/20'
                  : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/40 border border-transparent'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-brand-400' : 'text-ink-400'}`}>
                {tabItem.icon}
              </span>
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'general' && <GeneralTab />}
      {tab === 'sections' && <SectionsTab />}
      {tab === 'products' && <ProductsTab />}
    </div>
  );
}

function useWebsiteContent() {
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.website.getContent();
      setContent(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { content, setContent, loading, error, load };
}

function GeneralTab() {
  const toast = useToast();
  const { content, setContent, loading, error, load } = useWebsiteContent();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await api.website.updateContent(content);
      toast.success('Contacts saved', 'Contact information has been updated');
    } catch {
      toast.error('Save failed', 'Could not save contact information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message="Failed to load website content." onRetry={load} />;
  if (loading || !content) return <div className="max-w-2xl space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card p-6 rounded-2xl border border-ink-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Mail className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-ink-100">Contact Information</h3>
        </div>

        <div>
          <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Support Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="email"
              value={content.contact.email}
              onChange={e => setContent(c => c ? { ...c, contact: { ...c.contact, email: e.target.value } } : c)}
              className="input w-full pl-10 min-h-[42px] rounded-xl text-xs"
              placeholder="support@ouonex.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">WhatsApp Contact Number</label>
          <div className="relative">
            <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="tel"
              value={content.contact.whatsapp}
              onChange={e => setContent(c => c ? { ...c, contact: { ...c.contact, whatsapp: e.target.value } } : c)}
              className="input w-full pl-10 min-h-[42px] rounded-xl text-xs"
              placeholder="+20 100 123 4567"
            />
          </div>
          <p className="text-2xs text-ink-500 mt-1">Include country code (e.g. +20 for Egypt)</p>
        </div>

        <div>
          <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="tel"
              value={content.contact.phone}
              onChange={e => setContent(c => c ? { ...c, contact: { ...c.contact, phone: e.target.value } } : c)}
              className="input w-full pl-10 min-h-[42px] rounded-xl text-xs"
              placeholder="+20 2 1234 5678"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary min-h-[44px] px-6 rounded-xl font-bold active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

function SectionsTab() {
  const toast = useToast();
  const { content, setContent, loading, error, load } = useWebsiteContent();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await api.website.updateContent(content);
      toast.success('Sections saved', 'Landing page sections have been updated');
    } catch {
      toast.error('Save failed', 'Could not save sections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message="Failed to load website content." onRetry={load} />;
  if (loading || !content) return <div className="max-w-3xl space-y-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Hero Section */}
      <div className="card p-6 rounded-2xl border border-ink-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <Type className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-ink-100">Hero Section</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Hero Title (English)</label>
            <input
              type="text"
              value={content.hero.titleEn}
              onChange={e => setContent(c => c ? { ...c, hero: { ...c.hero, titleEn: e.target.value } } : c)}
              className="input w-full min-h-[42px] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Hero Title (Arabic)</label>
            <input
              type="text"
              dir="rtl"
              value={content.hero.titleAr}
              onChange={e => setContent(c => c ? { ...c, hero: { ...c.hero, titleAr: e.target.value } } : c)}
              className="input w-full min-h-[42px] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Hero Subtitle (English)</label>
            <textarea
              value={content.hero.bodyEn}
              onChange={e => setContent(c => c ? { ...c, hero: { ...c.hero, bodyEn: e.target.value } } : c)}
              className="input w-full min-h-[80px] rounded-xl text-xs resize-y"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">Hero Subtitle (Arabic)</label>
            <textarea
              dir="rtl"
              value={content.hero.bodyAr}
              onChange={e => setContent(c => c ? { ...c, hero: { ...c.hero, bodyAr: e.target.value } } : c)}
              className="input w-full min-h-[80px] rounded-xl text-xs resize-y"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-2 rounded-xl border border-ink-800/80 bg-ink-950/60 p-4 shadow-inner">
          <p className="text-2xs font-bold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-brand-400" /> Live Preview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center py-3">
              <p className="text-lg font-bold text-ink-50">{content.hero.titleEn || '—'}</p>
              <p className="text-xs text-ink-400 mt-1">{content.hero.bodyEn || '—'}</p>
            </div>
            <div className="text-center py-3" dir="rtl">
              <p className="text-lg font-bold text-ink-50">{content.hero.titleAr || '—'}</p>
              <p className="text-xs text-ink-400 mt-1">{content.hero.bodyAr || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="card p-6 rounded-2xl border border-ink-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="w-4 h-4 text-accent-400" />
          <h3 className="text-sm font-bold text-ink-100">About Section</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">About Title (English)</label>
            <input
              type="text"
              value={content.about.titleEn}
              onChange={e => setContent(c => c ? { ...c, about: { ...c.about, titleEn: e.target.value } } : c)}
              className="input w-full min-h-[42px] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">About Title (Arabic)</label>
            <input
              type="text"
              dir="rtl"
              value={content.about.titleAr}
              onChange={e => setContent(c => c ? { ...c, about: { ...c.about, titleAr: e.target.value } } : c)}
              className="input w-full min-h-[42px] rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">About Description (English)</label>
            <textarea
              value={content.about.bodyEn}
              onChange={e => setContent(c => c ? { ...c, about: { ...c.about, bodyEn: e.target.value } } : c)}
              className="input w-full min-h-[80px] rounded-xl text-xs resize-y"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-ink-300 uppercase tracking-wider mb-1.5">About Description (Arabic)</label>
            <textarea
              dir="rtl"
              value={content.about.bodyAr}
              onChange={e => setContent(c => c ? { ...c, about: { ...c.about, bodyAr: e.target.value } } : c)}
              className="input w-full min-h-[80px] rounded-xl text-xs resize-y"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-2 rounded-xl border border-ink-800/80 bg-ink-950/60 p-4 shadow-inner">
          <p className="text-2xs font-bold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-accent-400" /> Live Preview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center py-3">
              <p className="text-base font-bold text-ink-100">{content.about.titleEn || '—'}</p>
              <p className="text-xs text-ink-400 mt-1">{content.about.bodyEn || '—'}</p>
            </div>
            <div className="text-center py-3" dir="rtl">
              <p className="text-base font-bold text-ink-100">{content.about.titleAr || '—'}</p>
              <p className="text-xs text-ink-400 mt-1">{content.about.bodyAr || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary min-h-[44px] px-6 rounded-xl font-bold active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Sections</span>
        </button>
      </div>
    </div>
  );
}

function ProductsTab() {
  const toast = useToast();
  const { content, setContent, loading, error, load } = useWebsiteContent();
  const [saving, setSaving] = useState(false);

  const updateProduct = (id: string, patch: Partial<ProductInfo>) => {
    setContent(c => c ? {
      ...c,
      products: c.products.map(p => p.id === id ? { ...p, ...patch } : p),
    } : c);
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await api.website.updateContent(content);
      toast.success('Products saved', 'Product display configuration has been updated');
    } catch {
      toast.error('Save failed', 'Could not save product configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message="Failed to load website content." onRetry={load} />;
  if (loading || !content) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  const visibleCount = content.products.filter(p => p.visible).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-300">{content.products.length} products · {visibleCount} visible on landing page</p>
        <button onClick={handleSave} disabled={saving} className="btn-primary min-h-[44px] px-6 rounded-xl font-bold active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Product Config</span>
        </button>
      </div>

      {content.products.map(product => (
        <div key={product.id} className="card p-5 rounded-2xl border border-ink-800/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-ink-700/80 transition-all duration-200">
          <div className="flex items-start gap-4">
            {/* Visibility toggle */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <button
                onClick={() => updateProduct(product.id, { visible: !product.visible })}
                className={`relative w-11 h-6 rounded-full transition-colors active:scale-95 ${product.visible ? 'bg-brand-600' : 'bg-ink-700'}`}
                title={product.visible ? 'Visible on landing page' : 'Hidden from landing page'}
              >
                <span className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${product.visible ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-2xs ${product.visible ? 'text-success-400' : 'text-ink-500'}`}>
                {product.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </span>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                <p className="text-sm font-bold text-ink-100">{product.name}</p>
                <span className="text-2xs font-semibold text-ink-400" dir="rtl">{product.arName}</span>
                <span className={`badge ${product.visible ? 'bg-success-500/15 text-success-400 border border-success-500/30' : 'bg-ink-500/15 text-ink-400 border border-ink-600/40'}`}>
                  {product.visible ? 'Visible' : 'Hidden'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-2xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">Description (EN)</label>
                  <input
                    type="text"
                    value={product.description}
                    onChange={e => updateProduct(product.id, { description: e.target.value })}
                    className="input w-full min-h-[42px] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">Description (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={product.arDescription}
                    onChange={e => updateProduct(product.id, { arDescription: e.target.value })}
                    className="input w-full min-h-[42px] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="mt-3.5">
                <label className="block text-2xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">Destination URL</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                  <input
                    type="url"
                    value={product.link ?? ''}
                    onChange={e => updateProduct(product.id, { link: e.target.value })}
                    className="input w-full pl-10 min-h-[42px] rounded-xl text-xs font-mono"
                    placeholder="https://ouonex.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary min-h-[44px] px-6 rounded-xl font-bold active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Product Config</span>
        </button>
      </div>
    </div>
  );
}

