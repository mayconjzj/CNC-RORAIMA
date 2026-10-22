import { ArrowRight, Clock3, Menu, Search, TrendingUp } from "lucide-react";
import { getPublishedArticles, getPublishedCategories } from "@/lib/db";

const imageUrl = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

function Brand() {
  return <a className="brand" href="/" aria-label="CNC Roraima - página inicial">
    <span className="brand-mark">C<span>N</span>C</span>
    <span className="brand-copy"><strong>CRISTHIAN CRUZ <i>NEWS</i></strong><small>INFORMAÇÃO DE CREDIBILIDADE</small></span>
  </a>;
}

function StoryCard({ story, compact = false }: { story: Awaited<ReturnType<typeof getPublishedArticles>>[number]; compact?: boolean }) {
  return <article className={`story-card ${compact ? "compact" : ""}`}>
    <a className="story-image" href={`/noticias/${story.slug}`} style={{ backgroundImage: story.featured_image_url ? `url("${story.featured_image_url}")` : `url("${imageUrl("photo-1504711434969-e33886168f5c")}")` }} aria-label={story.title}>
      {story.category_name && story.category_slug ? <span className="category-tag">{story.category_name}</span> : <span className="category-tag">NOTÍCIAS</span>}
    </a>
    <div className="story-copy">
      <h3><a href={`/noticias/${story.slug}`}>{story.title}</a></h3>
      <span className="story-time"><Clock3 size={13} /> {story.published_at ? new Date(story.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Atualizado"}</span>
    </div>
  </article>;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  let stories: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let databaseReady = true;
  let categories: Awaited<ReturnType<typeof getPublishedCategories>> = [];
  try {
    [stories, categories] = await Promise.all([getPublishedArticles(12), getPublishedCategories()]);
  } catch (error) { databaseReady = false; console.error("Não foi possível carregar as notícias/editorias do banco", error); }
  const featured = stories.find((story) => story.is_featured) ?? stories[0];
  const sideStories = stories.filter((story) => story.id !== featured?.id).slice(0, 2);
  return <main>
    <div className="topline"><div className="wrap top-inner"><span>RORAIMA • JORNALISMO LOCAL</span><span>Informação de credibilidade, todos os dias.</span></div></div>
    <header className="masthead wrap">
      <button className="icon-button mobile-menu" aria-label="Menu"><Menu size={22}/></button>
      <Brand />
      <div className="masthead-right"><span className="edition">NOTÍCIAS • ANÁLISES • COMUNIDADE</span><a className="search-button" href="#ultimas" aria-label="Ver notícias"><Search size={18}/><span>Notícias</span></a></div>
    </header>
    <nav className="nav-bar"><div className="wrap nav-inner">
      <a className="nav-home" href="/">INÍCIO</a>{categories.map((category) => <a key={category.id} href={`/editorias/${category.slug}`}>{category.name.toLocaleUpperCase("pt-BR")}</a>)}<a href="#cnc">CNC</a>
      <span className="nav-live"><span/> RORAIMA AGORA</span>
    </div></nav>
    <section className="wrap lead-section">
      <div className="section-heading"><div><span className="eyebrow">O QUE VOCÊ PRECISA SABER</span><h1>As notícias que <em>movem Roraima.</em></h1></div><p>Informação local, contexto e credibilidade para você entender o que acontece no nosso estado.</p></div>
      {featured ? <div className="lead-grid">
        <article className="hero-story"><a className="hero-image" href={`/noticias/${featured.slug}`} style={{ backgroundImage: `linear-gradient(0deg,rgba(12,15,20,.9),transparent 75%),url("${featured.featured_image_url || imageUrl("photo-1519608487953-e999c86e7455")}")` }}>
          <span className="category-tag">{featured.category_name ?? "DESTAQUE"}</span><div className="hero-text"><span className="hero-kicker">GIRO DE NOTÍCIAS • RORAIMA</span><h2>{featured.title}</h2><span className="hero-meta"><Clock3 size={14}/> {featured.published_at ? new Date(featured.published_at).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Última notícia"} <ArrowRight size={16}/></span></div>
        </a></article>
        <div className="side-stories">{sideStories.map((story)=><StoryCard key={story.id} story={story} compact/>)}</div>
      </div> : <div style={{ padding: "42px 28px", background: "#f7f7f8", borderRadius: 12, marginTop: 26 }}><h2 style={{ marginTop: 0 }}>{databaseReady ? "Estamos preparando as primeiras notícias." : "Estamos conectando o portal."}</h2><p>{databaseReady ? "As notícias publicadas pela redação aparecerão aqui. Acesse o painel administrativo para cadastrar a primeira matéria." : "O portal não conseguiu consultar o banco de dados. Confira as variáveis de ambiente da hospedagem."}</p><a className="red-button" href="/admin">Acessar administração <ArrowRight size={16}/></a></div>}
    </section>
    <section className="ticker"><div className="wrap ticker-inner"><span className="ticker-label"><TrendingUp size={15}/> EM PAUTA</span><p>Acompanhe os fatos, as decisões e as histórias de Roraima.</p><a href="#ultimas">Ver notícias <ArrowRight size={15}/></a></div></section>
    <section className="wrap latest-section" id="ultimas">
      <div className="section-title-row"><div><span className="eyebrow">INFORMAÇÃO EM TEMPO REAL</span><h2>Últimas notícias<span>.</span></h2></div><a className="text-link" href="#ultimas">Atualizadas pela redação <ArrowRight size={16}/></a></div>
      {stories.length ? <div className="news-grid">{stories.map((story)=><StoryCard key={story.id} story={story}/>)}</div> : <p style={{ color: "#777", padding: "20px 0" }}>Ainda não há notícias publicadas. As matérias aparecerão automaticamente após a publicação no painel.</p>}
    </section>
    <section className="cnc-band" id="cnc"><div className="wrap cnc-inner"><div className="cnc-symbol">CNC<span>+</span></div><div className="cnc-text"><span className="eyebrow gold">ALÉM DAS NOTÍCIAS</span><h2>A CNC também faz parte dessa história.</h2><p>Conheça as ações, os projetos e as iniciativas da CNC em Roraima.</p></div><a className="gold-button" href="/admin">Painel editorial <ArrowRight size={17}/></a></div></section>
    <section className="wrap newsletter"><div><span className="eyebrow">FIQUE BEM INFORMADO</span><h2>Roraima acontece. <em>A gente conta.</em></h2><p>Volte para acompanhar as principais atualizações do estado.</p></div><a className="red-button" href="#ultimas">Ler as notícias <ArrowRight size={16}/></a></section>
    <footer><div className="wrap footer-main"><Brand/><p>Informação de credibilidade para Roraima.</p><a href="#cnc">Sobre o portal</a><a href="/admin">Administração</a></div><div className="footer-bottom"><div className="wrap"><span>© {new Date().getFullYear()} CNC — Cristhian Cruz News</span><span>Jornalismo local com responsabilidade.</span></div></div></footer>
  </main>;
}
