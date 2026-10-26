import Link from "next/link";
import { ArrowLeft, House } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: "clamp(56px, 9vw, 100px)", paddingBottom: "clamp(64px, 10vw, 112px)" }}>
        <section
          aria-labelledby="not-found-title"
          style={{
            maxWidth: "760px",
            marginInline: "auto",
            textAlign: "center",
            borderTop: "3px solid var(--gold)",
            borderBottom: "1px solid var(--line)",
            padding: "clamp(36px, 7vw, 68px) 0",
          }}
        >
          <p className="eyebrow">CNC RORAIMA · ERRO 404</p>
          <p
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-playfair-display), Georgia, serif",
              fontSize: "clamp(88px, 18vw, 150px)",
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.07em",
              color: "var(--red)",
              margin: "18px 0 24px",
            }}
          >
            404
          </p>
          <h1
            id="not-found-title"
            style={{
              fontFamily: "var(--font-playfair-display), Georgia, serif",
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.15,
              letterSpacing: "-0.035em",
              margin: 0,
            }}
          >
            Esta página não foi encontrada.
          </h1>
          <p style={{ maxWidth: "480px", margin: "18px auto 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.9 }}>
            O endereço pode estar incorreto ou a notícia pode ter sido removida. Continue acompanhando os acontecimentos de Roraima pelo portal.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", marginTop: "30px" }}>
            <Link href="/" className="red-button">
              <House size={16} aria-hidden="true" />
              Página inicial
            </Link>
            <Link href="/noticias" className="search-button">
              <ArrowLeft size={16} aria-hidden="true" />
              Todas as notícias
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
