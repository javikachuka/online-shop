import { getCompanyNameLogo, getMenuLinks } from "@/actions";
import { Footer, PageViewTracker, Sidebar, TopMenu, WhatsAppFloat } from "@/components";
import { Suspense } from "react";

export default async function ShopLayout({
 children
}: {
 children: React.ReactNode;
}) {

  const links = await getMenuLinks()
  const companyInfo = await getCompanyNameLogo();

  return (
    <main className="min-h-screen">
        {/* Page View Tracker */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <TopMenu categories={links.data as any} company={companyInfo.company} />
        <Sidebar categories={links.data as any}/>
        <div className="px-0 md:px-10">
          <Suspense fallback={<div>Loading...</div>}> 
            {children}
          </Suspense>
        </div>
        <Footer />
        {/* WhatsApp Float Button - aparece en todas las páginas */}
        <WhatsAppFloat
          phoneNumber={companyInfo.company?.phone || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "1234567890"}
          message={process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE}
          position="bottom-right"
        />
    </main>
  );
}