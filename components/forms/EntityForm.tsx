"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, updateEntity } from "@/app/actions/entities";
import type { Entity } from "@/lib/db/schema";

type EntityFormProps = {
  entity?: Entity;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function EntityForm({ entity, onSuccess, onCancel }: EntityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!entity;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      let result;
      if (isEditing) {
        result = await updateEntity(entity.id, formData);
      } else {
        result = await createEntity(formData);
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
        router.push("/entities");
        router.refresh();
      }
    } catch (err) {
      setError("予期しないエラーが発生しました");
      setIsSubmitting(false);
    }
  }

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
          グループ名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={entity?.name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="例: 家族の記念日"
        />
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
          defaultValue={entity?.desc || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="このグループについての説明（任意）"
        />
      </div>

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          ステータス
        </label>
        <select
          id="status"
          name="status"
          defaultValue={entity?.status || 0}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={0}>有効</option>
          <option value={1}>無効</option>
        </select>
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
