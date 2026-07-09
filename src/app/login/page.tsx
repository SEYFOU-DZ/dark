'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUser, setAuth } from '@/lib/auth';
import { Lock, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password) as { message?: string; token?: string; user?: { isAdmin?: boolean } };

      if (data.message) {
        throw new Error(data.message);
      }

      if (!data.token || !data.user) {
        throw new Error('Login failed');
      }

      setAuth(data.token, data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 text-slate-900" dir="ltr">
      <div className="mx-auto flex max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:flex-row">
        {/* Left panel - logo area */}
        <div className="flex items-center justify-center bg-slate-950 p-6 sm:p-8 lg:w-1/4">
          <img src="/ttty.png" alt="Logo" className="h-16 w-auto sm:h-20" />
        </div>

        {/* Right panel - form */}
        <div className="flex-1 p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-slate-900">Login</h2>
              <p className="mt-2 text-sm text-slate-500">Enter your credentials to sign in.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Mail className="ml-3 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Lock className="ml-3 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}