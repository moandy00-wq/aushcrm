import Link from 'next/link';

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-gray-200 bg-gray-50">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="text-lg font-semibold text-gray-900">
          Account Deactivated
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account has been deactivated. Contact your administrator for
          assistance.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
