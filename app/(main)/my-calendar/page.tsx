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
    <div className="pt-2 px-2 md:p-0">
      <Calendar holidays={holidays} anniversaries={anniversaries} />
    </div>
  );
}
