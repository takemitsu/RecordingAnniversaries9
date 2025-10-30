import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Recording Anniversaries
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          大切な記念日を記録・管理
        </p>

        <div className="flex gap-4 justify-center">
          {session ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ダッシュボードへ
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition"
              >
                新規登録
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Next.js 16 + TypeScript + Auth.js v5</p>
        </div>
      </div>
    </div>
  );
}
