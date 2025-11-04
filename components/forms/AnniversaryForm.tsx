"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  createAnniversary,
  updateAnniversary,
} from "@/app/actions/anniversaries";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { FormField } from "@/components/forms/FormField";
import type { Anniversary } from "@/lib/db/schema";

interface AnniversaryFormProps {
  mode: "create" | "edit";
  collectionId: number;
  anniversary?: Anniversary;
}

export function AnniversaryForm({
  mode,
  collectionId,
  anniversary,
}: AnniversaryFormProps) {
  const router = useRouter();
  const action = mode === "create" ? createAnniversary : updateAnniversary;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="max-w-2xl">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="collectionId" value={collectionId} />
        {mode === "edit" && anniversary?.id && (
          <input type="hidden" name="anniversaryId" value={anniversary.id} />
        )}

        <FormField
          label="記念日名"
          name="name"
          type="text"
          defaultValue={anniversary?.name}
          required
          error={state?.error}
        />

        <FormField
          label="説明"
          name="description"
          type="textarea"
          defaultValue={anniversary?.description ?? ""}
          rows={3}
        />

        <DatePickerField
          label="記念日"
          name="anniversaryDate"
          defaultValue={anniversary?.anniversaryDate}
          required
        />

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
