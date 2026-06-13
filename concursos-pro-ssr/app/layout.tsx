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

export const metadata: Metadata = {
  // 🎯 Atualizado para o seu domínio oficial novo
  metadataBase: new URL("https://concursosmaranhaopro.vercel.app"),

  title: {
    default: "Concursos Maranhão 2026 - Editais, Salários e Previsões",
    template: "%s | Concursos Maranhão Pro",
  },

  description:
    "Confira concursos abertos no Maranhão, salários atualizados, previsões de editais e banco de questões para estudar.",

  // 🎯 A FORMA CORRETA DE ADICIONAR A VERIFICAÇÃO DO GOOGLE NO NEXT.JS:
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
  ],

  authors: [{ name: "Concursos Maranhão Pro" }],

  openGraph: {
    title: "Concursos Maranhão 2026",
    description:
      "Veja editais abertos, salários e previsões de concursos no Maranhão.",
    url: "https://concursosmaranhaopro.vercel.app", // 🎯 Atualizado aqui também
    siteName: "Concursos Maranhão Pro",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Concursos Maranhão 2026",
    description:
      "Veja editais abertos e previsões updated.",
    images: ["/og.png"],
  },

  robots: {
    index: true,
    follow: true,
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
        
        <Script
          id="schema-site"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Concursos Maranhão Pro",
              url: "https://concursosmaranhaopro.vercel.app", // 🎯 Atualizado aqui também
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