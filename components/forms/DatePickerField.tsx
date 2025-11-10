"use client";

import { useState } from "react";
import { getAges, japanDate } from "@/lib/utils/japanDate";

interface DatePickerFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  showJapanDate?: boolean;
  showAge?: boolean;
}

export function DatePickerField({
  label,
  name,
  defaultValue,
  error,
  required = false,
  showJapanDate = true,
  showAge = true,
}: DatePickerFieldProps) {
  const [currentDate, setCurrentDate] = useState<string>(defaultValue || "");

  const errorClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-700";

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        id={name}
        type="date"
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(e) => setCurrentDate(e.target.value)}
        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-zinc-700 dark:text-white ${errorClasses}`}
      />

      {/* 和暦表示 */}
      {showJapanDate && currentDate && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          和暦: {japanDate(currentDate)}
        </div>
      )}

      {/* 年齢表示 */}
      {showAge && currentDate && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          経過年数: {getAges(currentDate)}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
