import { auth } from "@/auth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getTodayForHeader } from "@/lib/utils/japanDate";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const today = getTodayForHeader();

  return (
    <>
      <Header session={session} today={today} />
      <main className="max-w-7xl mx-auto p-2 lg:p-12 mb-8">{children}</main>
      <Footer />
    </>
  );
}
