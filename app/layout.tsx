import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" });

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://cnc-roraima.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "CNC Roraima",
  title: {
    default: "CNC Roraima | Informação de Credibilidade",
    template: "%s | CNC Roraima",
  },
  description: "Notícias de Roraima, informação local e cobertura das ações da CNC.",
  openGraph: {
    type: "website",
    siteName: "CNC Roraima",
    title: "CNC Roraima — Informação de Credibilidade",
    description: "As notícias de Roraima com informação, contexto e credibilidade.",
    url: siteUrl,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CNC Roraima — Informação de Credibilidade",
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
  themeColor: "#202126",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${dmSans.variable} ${playfairDisplay.variable}`}>{children}</body></html>;
}
