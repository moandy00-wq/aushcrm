'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitFallbackForm } from '@/lib/actions/interview';

interface FallbackFormProps {
  onComplete: () => void;
  onSwitchToChat: () => void;
}

export function FallbackForm({ onComplete, onSwitchToChat }: FallbackFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    // Include honeypot
    data.website = website;

    const result = await submitFallbackForm(data);

    if (!result.success) {
      setError(result.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    onComplete();
  }

  return (
    <div className="w-full max-w-lg">
      <div className="border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-950">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Tell us about your business
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill out the form below and our team will be in touch.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              name="name"
              type="text"
              placeholder="Your full name"
              required
              disabled={loading}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              disabled={loading}
            />
          </div>

          <Input
            label="Phone (optional)"
            name="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            disabled={loading}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Business Name"
              name="business_name"
              type="text"
              placeholder="Acme Corp"
              required
              disabled={loading}
            />
            <Input
              label="Industry"
              name="industry"
              type="text"
              placeholder="e.g. SaaS, Consulting"
              required
              disabled={loading}
            />
          </div>

          <Input
            label="Team Size"
            name="team_size"
            type="text"
            placeholder="e.g. 5-10, 50+"
            required
            disabled={loading}
          />

          <Textarea
            label="Biggest Pain Points"
            name="pain_points"
            placeholder="What challenges are you facing with your current setup? (one per line)"
            required
            disabled={loading}
          />

          <Input
            label="Current Tools / CRM (optional)"
            name="current_tools"
            type="text"
            placeholder="e.g. HubSpot, Salesforce, spreadsheets"
            disabled={loading}
          />

          <Textarea
            label="Goals"
            name="goals"
            placeholder="What do you hope to achieve with a new CRM?"
            required
            disabled={loading}
          />

          <Input
            label="How did you hear about us? (optional)"
            name="referral_source"
            type="text"
            placeholder="e.g. Google, referral, Twitter"
            disabled={loading}
          />

          {/* Honeypot */}
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
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onSwitchToChat}
            className="text-sm text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-900 dark:hover:text-gray-300"
          >
            Prefer to chat with our AI assistant instead?
          </button>
        </div>
      </div>
    </div>
  );
}
