'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function InterviewComplete() {
  return (
    <div className="w-full max-w-md">
      <div className="border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-gray-900 dark:bg-gray-100">
          <svg
            className="h-6 w-6 text-white dark:text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Thank you!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We&apos;ve received your information and our team will review it shortly.
          Expect to hear from us within 1-2 business days.
        </p>

        <div className="mt-8">
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
