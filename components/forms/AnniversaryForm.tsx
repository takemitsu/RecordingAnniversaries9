"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createAnniversary,
  updateAnniversary,
} from "@/app/actions/anniversaries";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { FormField } from "@/components/forms/FormField";
import { FormSuccessMessage } from "@/components/forms/FormSuccessMessage";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    anniversary?.anniversaryDate ? new Date(anniversary.anniversaryDate) : null,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result =
        mode === "create"
          ? await createAnniversary(collectionId, formData)
          : await updateAnniversary(anniversary?.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/edit");
        }, 1500);
      }
    } catch (_err) {
      setError("エラーが発生しました");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <FormSuccessMessage
        show={success}
        message="保存しました。編集ページに戻ります..."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="記念日名"
          name="name"
          type="text"
          defaultValue={anniversary?.name}
          required
          error={error ?? undefined}
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
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          required
        />

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
