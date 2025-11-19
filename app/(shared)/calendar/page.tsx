import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Calendar } from "@/components/Calendar";
import type { Holiday } from "@/lib/types/calendar";

export default async function HolidaysPage() {
  // public/holidays.json を読み込み
  const filePath = join(process.cwd(), "public", "holidays.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const holidays: Holiday[] = JSON.parse(fileContent);

  return (
    <div className="pt-2 px-2 md:p-0">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        カレンダー
      </h1>

      <Calendar holidays={holidays} />

      <p className="text-gray-600 dark:text-gray-400 text-sm mt-6">
        内閣府が公開している祝日データを使用しています
      </p>
    </div>
  );
}
