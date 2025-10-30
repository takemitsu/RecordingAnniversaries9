"use client";

import DatePicker, { registerLocale } from "react-datepicker";
import { ja } from "date-fns/locale/ja";
import "react-datepicker/dist/react-datepicker.css";
import { japanDate, getAges } from "@/lib/utils/japanDate";

// 日本語ロケールを登録
registerLocale("ja", ja);

interface DatePickerFieldProps {
  label: string;
  name: string;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  error?: string;
  required?: boolean;
  showJapanDate?: boolean;
  showAge?: boolean;
}

export function DatePickerField({
  label,
  name,
  selectedDate,
  onDateChange,
  error,
  required = false,
  showJapanDate = true,
  showAge = true,
}: DatePickerFieldProps) {
  const errorClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-700";

  // ローカルタイムゾーンでのYYYY-MM-DD形式の文字列を生成
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <DatePicker
        selected={selectedDate}
        onChange={onDateChange}
        locale="ja"
        dateFormat="yyyy/MM/dd"
        inline
        className={`mt-1 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 ${errorClasses}`}
        calendarClassName="dark:bg-gray-800 dark:text-white"
      />

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedDate ? formatDateForInput(selectedDate) : ""}
        required={required}
      />

      {/* 和暦表示 */}
      {showJapanDate && selectedDate && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          和暦: {japanDate(formatDateForInput(selectedDate))}
        </div>
      )}

      {/* 年齢表示 */}
      {showAge && selectedDate && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          経過年数: {getAges(formatDateForInput(selectedDate))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
