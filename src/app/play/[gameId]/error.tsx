'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-lg max-w-md">
        <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
        <p className="text-white text-center">{error.message || 'Failed to load the game. Please try again.'}</p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Return to Lobby
          </Link>
        </div>
      </div>
    </div>
  );
}
