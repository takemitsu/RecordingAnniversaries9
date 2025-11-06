"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { deleteAuthenticator } from "@/app/actions/authenticators";
import type { Authenticator } from "@/lib/db/schema";

type PasskeyManagerProps = {
  authenticators: Authenticator[];
};

export function PasskeyManager({ authenticators }: PasskeyManagerProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePasskey = async () => {
    try {
      setIsCreating(true);
      await signIn("passkey", { action: "register" });
    } catch (error) {
      console.error("Passkey creation error:", error);
      // エラーハンドリングは後のフェーズで実装
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Passkey設定
      </h2>

      {/* Passkey作成ボタン */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleCreatePasskey}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isCreating ? (
            <>
              <span className="animate-spin">⏳</span> Passkey作成中...
            </>
          ) : (
            <>🔑 新しいPasskeyを作成</>
          )}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          このデバイスの生体認証（Touch ID、Face
          IDなど）でログインできるようになります
        </p>
      </div>

      {/* 登録済みPasskey一覧 */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          登録済みPasskey
        </h3>
        {authenticators.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Passkeyが登録されていません
          </p>
        ) : (
          <ul className="space-y-2">
            {authenticators.map((auth) => (
              <li
                key={auth.credentialID}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {auth.credentialDeviceType}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {auth.credentialBackedUp
                      ? "☁️ バックアップ済み"
                      : "📱 このデバイスのみ"}
                  </span>
                </div>
                <form
                  action={deleteAuthenticator.bind(null, auth.credentialID)}
                >
                  <button
                    type="submit"
                    className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
                  >
                    削除
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
