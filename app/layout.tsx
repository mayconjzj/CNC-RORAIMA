import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CNC Roraima | Informação de Credibilidade",
  description: "Notícias de Roraima, informação local e cobertura das ações da CNC.",
  metadataBase: new URL("https://cncroraima.com.br"),
  openGraph: {
    title: "CNC Roraima — Informação de Credibilidade",
    description: "As notícias de Roraima com informação, contexto e credibilidade.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
