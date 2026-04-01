'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
