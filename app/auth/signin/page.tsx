import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  calculateDiffDays,
  formatCountdown,
} from "@/lib/utils/dateCalculation";
import { getAges, japanDate } from "@/lib/utils/japanDate";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
  const session = await auth();

  // 既にログイン済みの場合はメインページへ
  if (session) {
    redirect("/");
  }

  // 実例データ（動的計算）
  const exampleDate = "2025-11-11";
  const diffDays = calculateDiffDays(exampleDate);
  const countdown = formatCountdown(diffDays);
  const japanDateStr = japanDate(exampleDate, true);
  const ages = getAges(exampleDate);

  return (
    <>
      <Header session={session} />
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recording Anniversaries
            </h2>
          </div>

          <SignInForm />

          {/* アプリ説明セクション */}
          <div className="space-y-4">
            {/* アプリ説明見出し */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Recording Anniversariesとは
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                大切な記念日を記録・管理
              </p>
            </div>

            {/* アプリ説明 - 一覧UIの実例 */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 px-2 md:pt-6 md:px-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                プロジェクト
              </h3>

              {/* Anniversary実例 */}
              <div className="py-2 pl-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-base mb-1">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    サービスリリース
                  </span>
                  <span className="text-sm mx-2 text-gray-600 dark:text-gray-400">
                    まで
                  </span>
                  <span className="text-pink-600 dark:text-pink-400 font-bold">
                    {countdown.value}
                  </span>
                  {countdown.unit && (
                    <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">
                      {countdown.unit}
                    </span>
                  )}
                </div>
                <div className="text-base text-gray-600 dark:text-gray-200 mb-1">
                  <span>
                    {exampleDate}（{japanDateStr}）
                  </span>
                  {ages && <span className="ml-1">{ages}</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  このように誕生日や記念日までの和暦や日数を管理できます
                </p>
              </div>
            </div>

            {/* 年度一覧リンク */}
            <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4">
              <Link
                href="/years"
                className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline"
              >
                年度一覧を見る
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
