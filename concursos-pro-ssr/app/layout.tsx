import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Melhora a métrica LCP e CLS do Core Web Vitals
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Domínio Principal Oficial
const SITE_URL = "https://concursosmaranhao.com.br";

export const viewport: Viewport = {
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Concursos Maranhão: Editais Abertos, Salários e Vagas",
    template: "%s | Concursos Maranhão Pro",
  },

  description:
    "Acompanhe concursos públicos e seletivos abertos no Maranhão em 2026. Editais atualizados, salários, simulados e banco de questões para aprovação.",

  verification: {
    google: "0Z_754Cw5srRkVIMK3NOaLltkeMBk3HrY17mFIivPGg",
    
  },

  keywords: [
    "concursos maranhão 2026",
    "editais abertos maranhão",
    "concurso público maranhão",
    "seletivo maranhão",
    "banco de questões concursos",
    "simulados concursos ma"
  ],

  authors: [{ name: "Concursos Maranhão Pro", url: SITE_URL }],
  publisher: "Concursos Maranhão Pro",

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    title: "Concursos Maranhão 2026: Editais Abertos, Salários e Vagas",
    description:
      "Acompanhe concursos públicos e seletivos abertos no Maranhão em 2026. Editais atualizados, salários, simulados e banco de questões para aprovação.",
    url: SITE_URL,
    siteName: "Concursos Maranhão Pro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Concursos Maranhão Pro - Editais e Vagas",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Concursos Maranhão 2026: Editais Abertos e Salários",
    description:
      "Confira os editais abertos no Maranhão com vagas e salários atualizados.",
    images: ["/og.png"],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dados estruturados Schema.org combinando WebSite e Organization
  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "Concursos Maranhão Pro",
      "description": "Notícias, editais e questões de concursos públicos no Maranhão.",
      "inLanguage": "pt-BR",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/questoes?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Concursos Maranhão Pro",
      "url": SITE_URL,
      "logo": `${SITE_URL}/favicon.ico`
    }
  ];

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body style={{ backgroundColor: '#0b1120' }} className="min-h-full flex flex-col text-white">
        <Script
          id="schema-org-global"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdData),
          }}
        />

        <main className="flex-1">
          {children}
        </main>

        <Footer />

        <GoogleAnalytics gaId="G-HNMVXY4P0G" />
      </body>
    </html>
  );
}