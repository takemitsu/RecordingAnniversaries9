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
      </div>
    </div>
  );
}
