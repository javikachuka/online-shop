import { auth } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {
  // Middleware garantiza autenticación, solo validar rol
  const session = await auth();

  if (session?.user?.role !== 'admin') {
    redirect('/');
  }

  return (
    <>
        {children}
    </>
  );
}