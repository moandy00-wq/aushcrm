'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border border-gray-200 bg-white p-8">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              AushCRM
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {resetSent ? (
              <p className="text-sm text-green-700">
                Check your email for a password reset link.
              </p>
            ) : (
              <button
                type="button"
                disabled={resetting}
                onClick={async () => {
                  if (!email) {
                    setError('Enter your email first, then click forgot password.');
                    return;
                  }
                  setResetting(true);
                  setError(null);
                  const supabase = createClient();
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  });
                  setResetting(false);
                  if (resetError) {
                    setError(resetError.message);
                  } else {
                    setResetSent(true);
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {resetting ? 'Sending...' : 'Forgot password?'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
