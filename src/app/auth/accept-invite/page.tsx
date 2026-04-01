'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateInviteToken, acceptInvitation } from '@/lib/actions/auth';
import { ROLE_LABELS } from '@/lib/constants';
import type { AppRole } from '@/types';

type PageState = 'loading' | 'form' | 'success' | 'error';

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setState('error');
      return;
    }

    validateInviteToken(token).then((result) => {
      if (!result.success) {
        setError(result.error ?? 'Invalid invitation');
        setState('error');
      } else {
        setEmail(result.data!.email);
        setRole(result.data!.role);
        setState('form');
      }
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await acceptInvitation({
      token,
      password,
      full_name: fullName,
    });

    if (!result.success) {
      setError(result.error ?? 'Failed to create account');
      setSubmitting(false);
      return;
    }

    // Sign in the newly created user
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Account created but sign-in failed — show success with manual redirect
      setState('success');
      return;
    }

    setState('success');
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
          </div>

          {state === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Validating your invitation...
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center">
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
              <a
                href="/auth/login"
                className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Go to login
              </a>
            </div>
          )}

          {state === 'form' && (
            <>
              <p className="mb-6 text-center text-sm text-gray-500">
                You&apos;ve been invited as{' '}
                <span className="font-medium text-gray-700">
                  {ROLE_LABELS[role as AppRole] ?? role}
                </span>
                . Create your account to get started.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  disabled
                />

                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />

                {error && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </>
          )}

          {state === 'success' && (
            <div className="text-center">
              <p className="text-sm text-gray-700">
                Your account has been created successfully. Redirecting...
              </p>
              <a
                href="/dashboard"
                className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Go to dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
