import { requireAuth } from "@/lib/auth-helpers";
import { getEntities } from "@/app/actions/entities";
import Link from "next/link";

export default async function EntitiesPage() {
  await requireAuth();
  const entities = await getEntities();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          グループ管理
        </h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          新規グループ作成
        </button>
      </div>

      {entities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            グループがありません
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            新規グループを作成して記念日を整理しましょう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {entity.name}
              </h3>
              {entity.desc && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {entity.desc}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  記念日: {entity.days.length}件
                </span>
                <Link
                  href={`/entities/${entity.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  詳細 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
