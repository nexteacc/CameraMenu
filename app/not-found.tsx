import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-800 p-4">
      <h1 className="text-6xl font-bold text-zinc-800 dark:text-white mb-4">404</h1>
      <h2 className="text-2xl font-medium text-zinc-500 mb-6">Page Not Found</h2>
      <p className="text-zinc-500 mb-8 text-center max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}