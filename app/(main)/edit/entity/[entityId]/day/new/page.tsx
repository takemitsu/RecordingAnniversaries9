import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntity } from "@/app/actions/entities";
import { DayForm } from "./DayForm";

export default async function NewDayPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { entityId: entityIdStr } = await params;
  const entityId = Number(entityIdStr);
  const entity = await getEntity(entityId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        記念日作成
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        グループ: {entity.name}
      </p>
      <DayForm mode="create" entityId={entityId} />
    </div>
  );
}
