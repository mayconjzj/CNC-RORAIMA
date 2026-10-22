import type { Metadata } from "next";
import { ArrowRight, Clock3, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/db";
import { Brand } from "@/components/site-header";
import { NewsSearch } from "@/components/news-search";
import { StoryCard } from "@/components/news/story-card";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import { shouldOptimizeImage } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  let stories: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let databaseReady = true;
  try {
    stories = await getPublishedArticles(12);
  } catch (error) { databaseReady = false; console.error("Não foi possível carregar as notícias/editorias do banco", error); }
  const featured = stories.find((story) => story.is_featured) ?? stories[0];
  const sideStories = stories.filter((story) => story.id !== featured?.id).slice(0, 2);
  const siteUrl = SITE_URL;
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: SITE_NAME, url: siteUrl },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: SITE_NAME,
        url: siteUrl,
        inLanguage: "pt-BR",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/noticias?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return <main>
    <script type="application/ld+json">{JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c")}</script>

    <section className="wrap lead-section">
      <div className="section-heading"><div><span className="eyebrow">O QUE VOCÊ PRECISA SABER</span><h1>As notícias que <em>movem Roraima.</em></h1></div><p>Informação local, contexto e credibilidade para você entender o que acontece no nosso estado.</p></div>
      <NewsSearch compact />
      {featured ? <div className="lead-grid">
        <article className="hero-story"><Link className="hero-image" href={`/noticias/${featured.slug}`} aria-label={featured.title}>{featured.featured_image_url ? <Image src={featured.featured_image_url} alt="" fill sizes="(max-width: 850px) 100vw, 65vw" priority unoptimized={!shouldOptimizeImage(featured.featured_image_url)} /> : <span className="hero-image-fallback" />}<span className="hero-image-overlay" />
          <span className="category-tag">{featured.category_name ?? "DESTAQUE"}</span><div className="hero-text"><span className="hero-kicker">GIRO DE NOTÍCIAS • RORAIMA</span><h2>{featured.title}</h2><span className="hero-meta"><Clock3 size={14}/> {featured.published_at ? new Date(featured.published_at).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Última notícia"} <ArrowRight size={16}/></span></div>
        </Link></article>
        <div className="side-stories">{sideStories.map((story)=><StoryCard key={story.id} story={story} compact/>)}</div>
      </div> : <div style={{ padding: "42px 28px", background: "#f7f7f8", borderRadius: 12, marginTop: 26 }}><h2 style={{ marginTop: 0 }}>{databaseReady ? "Estamos preparando as primeiras notícias." : "Estamos conectando o portal."}</h2><p>{databaseReady ? "As notícias publicadas pela redação aparecerão aqui. Acesse o painel administrativo para cadastrar a primeira matéria." : "O portal não conseguiu consultar o banco de dados. Confira as variáveis de ambiente da hospedagem."}</p><Link className="red-button" href="/admin">Acessar administração <ArrowRight size={16}/></Link></div>}
    </section>
    <section className="ticker"><div className="wrap ticker-inner"><span className="ticker-label"><TrendingUp size={15}/> EM PAUTA</span><p>Acompanhe os fatos, as decisões e as histórias de Roraima.</p><Link href="#ultimas">Ver notícias <ArrowRight size={15}/></Link></div></section>
    <section className="wrap latest-section" id="ultimas">
      <div className="section-title-row"><div><span className="eyebrow">INFORMAÇÃO EM TEMPO REAL</span><h2>Últimas notícias<span>.</span></h2></div><Link className="text-link" href="/noticias">Ver todas as notícias <ArrowRight size={16}/></Link></div>
      {stories.length ? <div className="news-grid">{stories.map((story)=><StoryCard key={story.id} story={story}/>)}</div> : <p style={{ color: "#777", padding: "20px 0" }}>Ainda não há notícias publicadas. As matérias aparecerão automaticamente após a publicação no painel.</p>}
    </section>
    <section className="cnc-band" id="cnc"><div className="wrap cnc-inner"><div className="cnc-symbol">CNC<span>+</span></div><div className="cnc-text"><span className="eyebrow gold">ALÉM DAS NOTÍCIAS</span><h2>A CNC também faz parte dessa história.</h2><p>Conheça as ações, os projetos e as iniciativas da CNC em Roraima.</p></div><Link className="gold-button" href="/admin">Painel editorial <ArrowRight size={17}/></Link></div></section>
    <section className="wrap newsletter"><div><span className="eyebrow">FIQUE BEM INFORMADO</span><h2>Roraima acontece. <em>A gente conta.</em></h2><p>Volte para acompanhar as principais atualizações do estado.</p></div><Link className="red-button" href="#ultimas">Ler as notícias <ArrowRight size={16}/></Link></section>
    <footer><div className="wrap footer-main"><Brand/><p>Informação de credibilidade para Roraima.</p><Link href="#cnc">Sobre o portal</Link><Link href="/admin">Administração</Link></div><div className="footer-bottom"><div className="wrap"><span>© {new Date().getFullYear()} CNC — Cristhian Cruz News</span><span>Jornalismo local com responsabilidade.</span></div></div></footer>
  </main>;
}
