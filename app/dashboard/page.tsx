import { requireAuth } from "@/lib/auth-helpers";
import { getEntities } from "@/app/actions/entities";
import { getAllDays } from "@/app/actions/days";
import { calculateDiffDays, formatCountdown, sortByClosest } from "@/lib/utils/dateCalculation";
import { japanDate, getAges } from "@/lib/utils/japanDate";
import Link from "next/link";

export default async function DashboardPage() {
  await requireAuth();

  const entities = await getEntities();
  const allDays = await getAllDays();

  // 日付計算を追加
  const daysWithCalc = allDays.map((day) => ({
    ...day,
    diffDays: calculateDiffDays(day.annivAt),
    ages: getAges(day.annivAt),
    japaneseDate: japanDate(day.annivAt),
  }));

  // 近い順にソート
  const sortedDays = sortByClosest(daysWithCalc);

  // 直近5件を表示
  const upcomingDays = sortedDays.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ダッシュボード
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          記念日の概要
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            グループ数
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {entities.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            記念日数
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {allDays.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            直近の記念日
          </h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
            {upcomingDays[0] ? formatCountdown(upcomingDays[0].diffDays) : "-"}
          </p>
        </div>
      </div>

      {/* 直近の記念日 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            直近の記念日
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {upcomingDays.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              記念日が登録されていません
            </div>
          ) : (
            upcomingDays.map((day) => (
              <div key={day.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {day.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {day.entity.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {day.japaneseDate} ({day.annivAt})
                    </p>
                    {day.ages && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {day.ages}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCountdown(day.diffDays)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {allDays.length > 5 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/days"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              すべての記念日を見る →
            </Link>
          </div>
        )}
      </div>

      {/* クイックアクション */}
      <div className="flex gap-4">
        <Link
          href="/entities"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          グループを管理
        </Link>
        <Link
          href="/days"
          className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          記念日を管理
        </Link>
      </div>
    </div>
  );
}
