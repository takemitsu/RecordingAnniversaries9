"use client";

import type { User } from "next-auth";
import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        プロフィール情報
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        アカウントのプロフィール情報を更新します
      </p>

      <form action={formAction} className="space-y-4">
        <FormField
          label="名前"
          name="name"
          type="text"
          defaultValue={user.name || ""}
          required
          error={state?.error}
        />

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">メールアドレス: </span>
          {user.email}
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>

          {state?.success && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              保存しました
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
