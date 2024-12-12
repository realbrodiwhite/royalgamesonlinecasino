import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-lg max-w-md">
        <h2 className="text-2xl font-bold text-yellow-500">Game Not Found</h2>
        <p className="text-white text-center">
          Sorry, the game you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Return to Lobby
        </Link>
      </div>
    </div>
  );
}
