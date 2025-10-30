import { requireAuth } from "@/lib/auth-helpers";
import { getAllDays } from "@/app/actions/days";
import { calculateDiffDays, formatCountdown } from "@/lib/utils/dateCalculation";
import { japanDate, getAges } from "@/lib/utils/japanDate";

export default async function DaysPage() {
  await requireAuth();
  const allDays = await getAllDays();

  // 日付計算を追加
  const daysWithCalc = allDays.map((day) => ({
    ...day,
    diffDays: calculateDiffDays(day.annivAt),
    ages: getAges(day.annivAt),
    japaneseDate: japanDate(day.annivAt),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          記念日一覧
        </h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          新規記念日作成
        </button>
      </div>

      {daysWithCalc.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            記念日が登録されていません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            新規記念日を作成しましょう
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          {daysWithCalc.map((day) => (
            <div key={day.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                  {day.desc && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {day.desc}
                    </p>
                  )}
                </div>
                <div className="ml-6 text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCountdown(day.diffDays)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
