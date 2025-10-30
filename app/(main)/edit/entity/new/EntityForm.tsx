"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, updateEntity } from "@/app/actions/entities";
import type { Entity } from "@/lib/db/schema";
import { FormField } from "@/components/forms/FormField";
import { FormSuccessMessage } from "@/components/forms/FormSuccessMessage";

interface EntityFormProps {
  mode: "create" | "edit";
  entity?: Entity;
}

export function EntityForm({ mode, entity }: EntityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result =
        mode === "create"
          ? await createEntity(formData)
          : await updateEntity(entity!.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/edit");
        }, 1500);
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {success && (
        <FormSuccessMessage message="保存しました。編集ページに戻ります..." />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="グループ名"
          name="name"
          type="text"
          defaultValue={entity?.name}
          required
          error={error}
        />

        <FormField
          label="説明"
          name="desc"
          type="textarea"
          defaultValue={entity?.desc ?? ""}
          rows={3}
        />

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            ステータス
          </label>
          <select
            id="status"
            name="status"
            defaultValue={entity?.status ?? 0}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={0}>アクティブ</option>
            <option value={1}>非アクティブ</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "保存中..." : mode === "create" ? "作成" : "更新"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/edit")}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
