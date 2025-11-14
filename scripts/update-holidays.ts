import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";

const CSV_URL = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv";
const OUTPUT_PATH = join(process.cwd(), "public", "holidays.json");

type Holiday = {
  date: string;
  name: string;
};

async function updateHolidays() {
  try {
    console.log("内閣府から祝日データを取得中...");
    console.log(`URL: ${CSV_URL}`);

    // 1. 内閣府CSVを取得
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    // 2. Shift-JIS → UTF-8 変換
    const csvText = iconv.decode(Buffer.from(buffer), "Shift_JIS");

    // 3. CSV → JSON 変換
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{
      "国民の祝日・休日月日": string;
      "国民の祝日・休日名称": string;
    }>;

    // 4. データ整形
    const holidays: Holiday[] = records.map((record) => {
      const rawDate = record["国民の祝日・休日月日"] || "";
      // YYYY/M/D → YYYY-MM-DD に変換
      const [year, month, day] = rawDate.split("/");
      const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      return {
        date,
        name: record["国民の祝日・休日名称"] || "",
      };
    });

    // 5. public/holidays.json に保存
    writeFileSync(OUTPUT_PATH, JSON.stringify(holidays, null, 2), "utf-8");

    console.log(`✅ 祝日データを更新しました: ${OUTPUT_PATH}`);
    console.log(`   取得件数: ${holidays.length}件`);
    console.log(
      `   範囲: ${holidays[0]?.date} 〜 ${holidays[holidays.length - 1]?.date}`,
    );
  } catch (error) {
    console.error("❌ 祝日データの更新に失敗しました:", error);
    process.exit(1);
  }
}

updateHolidays();
