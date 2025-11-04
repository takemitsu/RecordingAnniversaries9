"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createCollection, updateCollection } from "@/app/actions/collections";
import { FormField } from "@/components/forms/FormField";
import { VISIBILITY } from "@/lib/constants";
import type { Collection } from "@/lib/db/schema";

interface CollectionFormProps {
  mode: "create" | "edit";
  collection?: Collection;
}

export function CollectionForm({ mode, collection }: CollectionFormProps) {
  const router = useRouter();
  const action = mode === "create" ? createCollection : updateCollection;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="max-w-2xl">
      <form action={formAction} className="space-y-6">
        {mode === "edit" && collection?.id && (
          <input type="hidden" name="collectionId" value={collection.id} />
        )}

        <FormField
          label="グループ名"
          name="name"
          type="text"
          defaultValue={collection?.name}
          required
          error={state?.error}
        />

        <FormField
          label="説明"
          name="description"
          type="textarea"
          defaultValue={collection?.description ?? ""}
          rows={3}
        />

        <div>
          <label
            htmlFor="isVisible"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            表示設定
          </label>
          <select
            id="isVisible"
            name="isVisible"
            defaultValue={collection?.isVisible ?? VISIBILITY.VISIBLE}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={VISIBILITY.VISIBLE}>一覧に表示</option>
            <option value={VISIBILITY.HIDDEN}>一覧に非表示</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="img"
                aria-label="読み込み中"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
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
