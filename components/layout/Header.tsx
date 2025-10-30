import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getTodayForHeader } from "@/lib/utils/japanDate";

export async function Header() {
  const session = await auth();
  const today = getTodayForHeader();

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href={session ? "/dashboard" : "/"}
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Recording Anniversaries
            </Link>
          </div>

          <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
            {today}
          </div>

          <nav className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/entities"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  グループ
                </Link>
                <Link
                  href="/days"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  記念日
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {session.user?.name}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      ログアウト
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
