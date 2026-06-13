import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Domínio de Produção Real detectado no painel da Vercel
const SITE_URL = "https://meu-site-five-delta.vercel.app";

export const metadata: Metadata = {
  // O metadataBase garante que todas as URLs relativas de imagens (como /og.png) virem caminhos absolutos corretos
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Concursos Maranhão 2026 - Editais, Salários e Previsões",
    template: "%s | Concursos Maranhão Pro",
  },

  description:
    "Confira concursos abertos no Maranhão, salários atualizados, previsões de editais e banco de questões para estudar.",

  verification: {
    google: "0Z_754Cw5srRkVIMK3NOaLltkeMBk3HrY17mFIivPGg",
  },

  keywords: [
    "concursos maranhão",
    "editais abertos",
    "concursos 2026",
    "uema",
    "enem",
    "banco de questões",
    "simulados maranhão"
  ],

  authors: [{ name: "Concursos Maranhão Pro", url: SITE_URL }],

  alternates: {
    canonical: "./", // Evita problemas de conteúdo duplicado (SEO Técnico)
  },

  openGraph: {
    title: "Concursos Maranhão 2026 - Editais, Salários e Previsões",
    description:
      "Confira concursos abertos no Maranhão, salários atualizados, previsões de editais e banco de questões para estudar.",
    url: SITE_URL,
    siteName: "Concursos Maranhão Pro",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Banner Oficial Concursos Maranhão Pro",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Concursos Maranhão 2026",
    description:
      "Veja editais abertos e previsões atualizadas para o Maranhão.",
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
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body style={{ backgroundColor: '#0b1120' }} className="min-h-full flex flex-col text-white">
        
        {/* Schema JSON-LD Otimizado para Site Estruturado com caixa de pesquisa interna potencial */}
        <Script
          id="schema-site"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Concursos Maranhão Pro",
              "url": SITE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${SITE_URL}/questoes?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            }),
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