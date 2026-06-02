import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
const siteDescription =
  "Perfumes autorais inspirados em grandes fragrâncias internacionais e orientais. Fragrâncias marcantes, elegantes e acessíveis em produção de pequenos lotes.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AMAROdosREIS Parfum",
  description: siteDescription,
  openGraph: {
    title: "AMAROdosREIS Parfum",
    description: siteDescription,
    url: siteUrl,
    siteName: "AMAROdosREIS Parfum",
    images: [
      {
        url: "/logo-amaro-parfum.png",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMAROdosREIS Parfum",
    description: siteDescription,
    images: ["/logo-amaro-parfum.png"],
  },
  icons: {
    icon: [
      {
        url: "/amaro-parfum-icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-amaro.png",
        type: "image/png",
      },
      {
        url: "/favicon-amaro.ico",
        type: "image/x-icon",
      },
    ],
    shortcut: "/favicon-amaro.ico",
    apple: "/favicon-amaro.png",
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
      <body className="min-h-full bg-background text-foreground">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
