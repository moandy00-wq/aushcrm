'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InterviewError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <div className="w-full max-w-sm border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The interview encountered an error. You can try again or switch to the
          standard form.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={reset} variant="secondary" className="w-full">
            Try again
          </Button>
          <Button asChild variant="default" className="w-full">
            <Link href="/interview?mode=form">Switch to form</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
