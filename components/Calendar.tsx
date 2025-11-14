"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { CalendarMonth } from "./CalendarMonth";
import { generateYearCalendar, generateCalendarGrid } from "@/lib/utils/calendar";
import type { Holiday, Anniversary } from "@/lib/types/calendar";

type CalendarProps = {
  holidays: Holiday[];
  anniversaries?: Anniversary[];
};

export function Calendar({ holidays, anniversaries = [] }: CalendarProps) {
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [viewMode, setViewMode] = useState<"year" | "month">("year");

  // PC版: 年次カレンダー（2×6グリッド）
  const yearCalendar = generateYearCalendar(year, holidays, anniversaries);

  // モバイル版: 月次カレンダー（今月・来月）
  const currentMonthGrid = generateCalendarGrid(year, month, holidays, anniversaries);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonthGrid = generateCalendarGrid(nextMonthYear, nextMonth, holidays, anniversaries);

  const handlePrevYear = () => setYear((prev) => prev - 1);
  const handleNextYear = () => setYear((prev) => prev + 1);
  const handleToday = () => {
    setYear(currentYear);
    setMonth(currentMonth);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((prev) => prev + 1);
      setMonth(1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full">
      {/* PC版: 年次カレンダー（2×6グリッド） */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {year}年のカレンダー
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrevYear}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ◀ {year - 1}
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              今年
            </button>
            <button
              type="button"
              onClick={handleNextYear}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {year + 1} ▶
            </button>
          </div>
        </div>

        {/* 2×6グリッド */}
        <div className="grid grid-cols-2 gap-6">
          {yearCalendar.map((monthGrid, index) => (
            <CalendarMonth
              key={`${year}-${index + 1}`}
              year={year}
              month={index + 1}
              grid={monthGrid}
            />
          ))}
        </div>
      </div>

      {/* モバイル版: 月次カレンダー（縦スクロール） */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {year}年{month}月
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              今月
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
            >
              ▶
            </button>
          </div>
        </div>

        {/* 今月 */}
        <div className="mb-8">
          <CalendarMonth year={year} month={month} grid={currentMonthGrid} />
        </div>

        {/* 来月 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {nextMonthYear}年{nextMonth}月
          </h2>
          <CalendarMonth year={nextMonthYear} month={nextMonth} grid={nextMonthGrid} />
        </div>
      </div>
    </div>
  );
}
