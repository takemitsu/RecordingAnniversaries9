import { redirect } from "next/navigation";
import { getCollections } from "@/app/actions/collections";
import { auth } from "@/auth";
import { EditPageClient } from "./EditPageClient";

export default async function EditPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const collections = await getCollections();

  return <EditPageClient collections={collections} />;
}
