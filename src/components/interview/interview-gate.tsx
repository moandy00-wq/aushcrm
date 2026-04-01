'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPartialLead } from '@/lib/actions/interview';
import type { InterviewSession } from '@/types';

interface InterviewGateProps {
  onComplete: (session: InterviewSession, name: string) => void;
  onSwitchToForm: () => void;
}

export function InterviewGate({ onComplete, onSwitchToForm }: InterviewGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createPartialLead(name, email, website);

    if (!result.success) {
      setError(result.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    if (result.data) {
      onComplete(result.data, name);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Let&apos;s get started
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell us your name and email, then chat with our AI assistant to help us
          understand your needs.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          {/* Honeypot — hidden from real users */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <Input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="mt-2">
            {loading ? 'Starting...' : 'Start Interview'}
          </Button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onSwitchToForm}
            className="text-sm text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-900 dark:hover:text-gray-300"
          >
            Prefer to fill out a form instead?
          </button>
        </div>
      </div>
    </div>
  );
}
