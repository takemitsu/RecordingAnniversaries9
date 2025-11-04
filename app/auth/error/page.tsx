import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error || "認証中にエラーが発生しました"}
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="block text-center text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          ログインページに戻る
        </Link>
      </div>
    </div>
  );
}
