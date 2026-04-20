import type { Metadata } from "next";
import { inter } from "@/config/fonts";

import "./globals.css";
import { Providers, GoogleAnalytics } from "@/components";



export const metadata: Metadata = {
  title: {
    template: '%s | iOS Pro',
    default: 'iOS Pro — Accesorios para celular en Argentina',
  },
  description:
    'iOS Pro: fundas, cargadores, auriculares y accesorios para celular. Envíos a todo el país. Las mejores marcas al mejor precio.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://iospro.com.ar'),
  openGraph: {
    siteName: 'iOS Pro',
    locale: 'es_AR',
    type: 'website',
  },
  // robots: {
  //   index: true,
  //   follow: true,
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className={inter.className}>
        {/* Google Analytics 4 */}
        <GoogleAnalytics 
          measurementId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''} 
        />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
