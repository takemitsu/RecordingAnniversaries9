"use client";

import { signIn as reactSignIn } from "next-auth/react";
import { signIn as passkeySignIn } from "next-auth/webauthn";
import { useState } from "react";

export default function SignInForm() {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handlePasskeySignIn = async () => {
    try {
      setIsPasskeyLoading(true);
      await passkeySignIn("passkey");
    } catch (error) {
      console.error("Passkey sign in error:", error);
      // エラーハンドリングは後のフェーズで実装
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await reactSignIn("google", { redirectTo: "/" });
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Passkey ボタン */}
      <button
        type="button"
        onClick={handlePasskeySignIn}
        disabled={isPasskeyLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isPasskeyLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            認証中...
          </>
        ) : (
          <>🔑 Passkeyでログイン</>
        )}
      </button>

      {/* 区切り線 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
            または
          </span>
        </div>
      </div>

      {/* Google OAuth ボタン */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isGoogleLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            ログイン中...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Google"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </>
        )}
      </button>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Googleアカウントでログインまたは新規登録</p>
      </div>
    </div>
  );
}
