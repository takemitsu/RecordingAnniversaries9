import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Calendar } from "@/components/Calendar";
import { getUserId } from "@/lib/auth-helpers";
import { collectionQueries } from "@/lib/db/queries";
import type { Holiday } from "@/lib/types/calendar";

export default async function CalendarPage() {
  // 認証確認
  const userId = await getUserId();

  // public/holidays.json を読み込み
  const filePath = join(process.cwd(), "public", "holidays.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const holidays: Holiday[] = JSON.parse(fileContent);

  // ユーザーの記念日を取得
  const collections = await collectionQueries.findByUserId(userId);

  // Collectionsから全Anniversariesをフラット化
  const anniversaries = collections.flatMap((collection) =>
    collection.anniversaries.map((anniversary) => ({
      id: anniversary.id,
      name: anniversary.name,
      anniversaryDate: anniversary.anniversaryDate,
    })),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          カレンダー
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          祝日とあなたの記念日を表示しています
        </p>
      </div>

      <Calendar holidays={holidays} anniversaries={anniversaries} />
    </div>
  );
}
