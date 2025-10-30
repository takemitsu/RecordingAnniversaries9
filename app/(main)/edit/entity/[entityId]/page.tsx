import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntity } from "@/app/actions/entities";
import { EntityForm } from "../new/EntityForm";

export default async function EditEntityPage({
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
        グループ編集
      </h1>
      <EntityForm mode="edit" entity={entity} />
    </div>
  );
}
