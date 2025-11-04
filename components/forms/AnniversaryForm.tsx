"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  createAnniversary,
  updateAnniversary,
} from "@/app/actions/anniversaries";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
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
