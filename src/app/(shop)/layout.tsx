import { getCompanyNameLogo, getMenuLinks } from "@/actions";
import { Footer, Sidebar, TopMenu } from "@/components";

export default async function ShopLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const links = await getMenuLinks()
  const companyInfo = await getCompanyNameLogo();

  return (
    <main className="min-h-screen">
        <TopMenu categories={links.data} company={companyInfo.company} />
        <Sidebar categories={links.data}/>
        <div className="px-0 md:px-10">
        {children}
        </div>
        <Footer />
    </main>
  );
}