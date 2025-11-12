import dayjs from "dayjs";
import ja from "dayjs/locale/ja";
import { auth } from "@/auth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getTodayForHeader, japanDate } from "@/lib/utils/japanDate";

dayjs.locale(ja);

export default async function YearsPage() {
  const session = await auth();
  const today = getTodayForHeader();

  // 1900年から現在年までの配列を生成（降順）
  const range = (start: number, end: number) =>
    [...Array(end - start + 1).keys()].map((elem) => elem + start);
  const years = range(1900, dayjs().year()).reverse();

  // 年度開始日（4月1日）
  const startDayOfNendo = (year: number, format?: string) => {
    return dayjs(`${year.toString()}-04-01`).format(format ?? "YYYY-MM-DD");
  };

  // 年度終了日（翌年3月31日）
  const endDayOfNendo = (year: number, format?: string) => {
    const nextYear = year + 1;
    return dayjs(`${nextYear.toString()}-03-31`).format(format ?? "YYYY-MM-DD");
  };

  // 年末（12月31日）- 和暦判定用
  const endOfYear = (year: number, format?: string) => {
    return dayjs()
      .set("year", year)
      .endOf("year")
      .format(format ?? "YYYY-MM-DD");
  };

  return (
    <>
      <Header session={session} today={today} />
      <main className="max-w-4xl mx-auto px-1 py-2 md:p-12 mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg px-2 py-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
              年度一覧
            </h1>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
              今日は{japanDate(dayjs().format("YYYY-MM-DD"), true)}、
              {dayjs().format("YYYY年MM月DD日（ddd）")}です。
              <br />
              年度は12/31基準で元年が表示されるようにしています。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-base md:text-lg">
                <thead>
                  <tr className="bg-gray-100 dark:bg-zinc-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 md:px-4 md:py-2 text-gray-700 dark:text-gray-200 text-center">
                      No.
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 md:px-4 md:py-2 text-gray-700 dark:text-gray-200 text-center">
                      年度
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 md:px-4 md:py-2 text-gray-700 dark:text-gray-200 text-center">
                      開始
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 md:px-4 md:py-2 text-gray-700 dark:text-gray-200 text-center">
                      終了
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((year: number, i: number) => (
                    <tr
                      key={`ty${year}`}
                      className="bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 md:px-2 md:py-1 text-gray-600 dark:text-gray-400 text-right">
                        {i}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 md:px-2 md:py-1 text-gray-600 dark:text-gray-400 text-center">
                        {japanDate(endOfYear(year), true)}度
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 md:px-2 md:py-1 text-gray-600 dark:text-gray-400 text-center">
                        {startDayOfNendo(year, "YYYY年M月")}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 md:px-2 md:py-1 text-gray-600 dark:text-gray-400 text-center">
                        {endDayOfNendo(year, "YYYY年M月")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
