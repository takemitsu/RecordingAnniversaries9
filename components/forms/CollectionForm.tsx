"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createCollection, updateCollection } from "@/app/actions/collections";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
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
          <Button type="submit" loading={isPending}>
            {isPending ? "保存中..." : mode === "create" ? "作成" : "更新"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/edit")}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
