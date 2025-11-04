"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        エラーが発生しました
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {error.message || "予期しないエラーが発生しました"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition"
      >
        再試行
      </button>
    </div>
  );
}
