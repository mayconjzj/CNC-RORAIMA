import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" });

const siteUrl = SITE_URL;
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "CNC Roraima — Notícias de Roraima",
  url: siteUrl,
  inLanguage: "pt-BR",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: "CNC Roraima — Notícias de Roraima",
    template: "%s | CNC Roraima",
  },
  description: "Notícias de Roraima, informação local e cobertura das ações da CNC.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  verification: {
    google: "TxSfWovss5wRRrEt5OcWFHccbCtavJrUE9BnnYbOPzw",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "CNC Roraima — Notícias de Roraima",
    description: "As notícias de Roraima com informação, contexto e credibilidade.",
    url: siteUrl,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CNC Roraima — Notícias de Roraima",
    description: "As notícias de Roraima com informação, contexto e credibilidade.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a30d19",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${playfairDisplay.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
