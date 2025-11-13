import { auth } from "@/auth";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default async function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Header session={session} />
      <main className="max-w-4xl mx-auto p-2 md:p-12 mb-8">{children}</main>
      <Footer />
    </>
  );
}
