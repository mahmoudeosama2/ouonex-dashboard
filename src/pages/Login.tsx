import { useState, type FormEvent } from 'react';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Role } from '@/lib/types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const MOCK = !BASE.startsWith('http');

export function Login() {
  const auth = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      if (MOCK) {
        await new Promise(r => setTimeout(r, 600));
        if (email === 'admin@ouonex.com' || email.includes('@')) {
          auth.login('mock_admin_token_' + Date.now(), 'owner');
          toast.success('Welcome back', 'Signed in to Ouonex Dashboard');
        } else {
          throw new Error('Invalid credentials');
        }
      } else {
        const res = await fetch(`${BASE}/auth/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'Invalid email or password');
        }
        const data = await res.json();
        auth.login(data.token ?? data.access_token, (data.role ?? 'owner') as Role);
        toast.success('Welcome back', 'Signed in to Ouonex Dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-970 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft mb-3">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-ink-50">Ouonex Dashboard</h1>
          <p className="text-xs text-ink-400 mt-0.5">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-500/10 border border-danger-500/30 p-3 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-danger-400 mt-0.5 shrink-0" />
              <p className="text-sm text-danger-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ouonex.com"
                className="input w-full pl-9"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input w-full pl-9 pr-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
          </button>

          {MOCK && (
            <p className="text-2xs text-ink-500 text-center pt-1">
              Demo mode — any email/password works
            </p>
          )}
        </form>

        <p className="text-2xs text-ink-500 text-center mt-4">
          Ouonex Dashboard · Cairo, Egypt
        </p>
      </div>
    </div>
  );
}

