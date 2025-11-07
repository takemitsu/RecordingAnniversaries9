import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
  const session = await auth();

  // 既にログイン済みの場合はメインページへ
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recording Anniversaries
          </p>
        </div>

        <SignInForm />

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/years"
            className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline"
          >
            年度一覧を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
