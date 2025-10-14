import { isLoggedAdmin } from "@/actions";
import { redirect } from "next/navigation";


export default async function AdminLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const isAdmin = await isLoggedAdmin();

  if(!isAdmin){
    redirect('/');
  }

  return (
    <>
        {children}
    </>
  );
}