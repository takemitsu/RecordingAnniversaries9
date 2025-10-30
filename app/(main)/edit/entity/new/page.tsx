import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EntityForm } from "./EntityForm";

export default async function NewEntityPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        グループ作成
      </h1>
      <EntityForm mode="create" />
    </div>
  );
}
