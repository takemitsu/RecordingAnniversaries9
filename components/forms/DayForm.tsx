"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDay, updateDay } from "@/app/actions/days";
import type { Day } from "@/lib/db/schema";
import dayjs from "dayjs";

type DayFormProps = {
  entityId: number;
  day?: Day & { entity?: { id: number; name: string } };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function DayForm({ entityId, day, onSuccess, onCancel }: DayFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!day;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      let result;
      if (isEditing) {
        result = await updateDay(day.id, formData);
      } else {
        result = await createDay(entityId, formData);
      }

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // 成功
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/entities/${entityId}`);
        router.refresh();
      }
    } catch (err) {
      setError("予期しないエラーが発生しました");
      setIsSubmitting(false);
    }
  }

  // デフォルト日付を今日に設定（編集時は既存の日付）
  const defaultDate = day?.annivAt || dayjs().format("YYYY-MM-DD");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          記念日名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={day?.name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 結婚記念日"
        />
      </div>

      <div>
        <label
          htmlFor="annivAt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          日付 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="annivAt"
          name="annivAt"
          defaultValue={defaultDate}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          毎年この日付で記念日が繰り返されます
        </p>
      </div>

      <div>
        <label
          htmlFor="desc"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          説明
        </label>
        <textarea
          id="desc"
          name="desc"
          defaultValue={day?.desc || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="この記念日についての説明（任意）"
        />
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "保存中..." : isEditing ? "更新" : "作成"}
        </button>
      </div>
    </form>
  );
}
