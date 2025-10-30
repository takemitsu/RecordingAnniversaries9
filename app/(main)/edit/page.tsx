import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntities } from "@/app/actions/entities";
import { EditPageClient } from "./EditPageClient";

export default async function EditPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const entities = await getEntities();

  return <EditPageClient entities={entities} />;
}
