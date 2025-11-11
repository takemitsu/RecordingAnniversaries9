import { redirect } from "next/navigation";
import { getAuthenticators } from "@/app/actions/authenticators";
import { auth } from "@/auth";
import { PasskeyManager } from "./PasskeyManager";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const authenticators = await getAuthenticators();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        プロフィール設定
      </h1>

      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <ProfileForm user={session.user} />
      </div>

      <PasskeyManager authenticators={authenticators} />
    </div>
  );
}
