import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntity } from "@/app/actions/entities";
import { getDay } from "@/app/actions/days";
import { DayForm } from "../new/DayForm";

export default async function EditDayPage({
  params,
}: {
  params: Promise<{ entityId: string; dayId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { entityId: entityIdStr, dayId: dayIdStr } = await params;
  const entityId = Number(entityIdStr);
  const dayId = Number(dayIdStr);

  const entity = await getEntity(entityId);
  const day = await getDay(dayId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        記念日編集
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        グループ: {entity.name}
      </p>
      <DayForm mode="edit" entityId={entityId} day={day} />
    </div>
  );
}
