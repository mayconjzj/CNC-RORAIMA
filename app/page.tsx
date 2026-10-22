import { ArrowRight, Clock3, Menu, Search, TrendingUp, PlayCircle } from "lucide-react";

const stories = [
  { category: "POLÍTICA", title: "Decisões que impactam Roraima: acompanhe os principais assuntos do estado", time: "Há 18 min", image: "photo-1529107386315-e1a2ed48a620", size: "large" },
  { category: "CIDADES", title: "Boa Vista em pauta: iniciativas e serviços que movimentam a capital", time: "Há 42 min", image: "photo-1519501025264-65ba15a82390" },
  { category: "ECONOMIA", title: "Comércio local: oportunidades e desafios para quem empreende em Roraima", time: "Há 1 h", image: "photo-1441986300917-64674bd600d8" },
  { category: "EDUCAÇÃO", title: "Educação em foco: projetos e novidades para a comunidade", time: "Há 2 h", image: "photo-1509062522246-3755977927d7" },
];

const imageUrl = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

function Brand() {
  return <a className="brand" href="#" aria-label="CNC Roraima - página inicial">
    <span className="brand-mark">C<span>N</span>C</span>
    <span className="brand-copy"><strong>CRISTHIAN CRUZ <i>NEWS</i></strong><small>INFORMAÇÃO DE CREDIBILIDADE</small></span>
  </a>;
}

function StoryCard({ story, compact = false }: { story: typeof stories[number]; compact?: boolean }) {
  return <article className={`story-card ${compact ? "compact" : ""}`}>
    <a className="story-image" href="#ultimas" style={{ backgroundImage: `url("${imageUrl(story.image)}")` }} aria-label={story.title}>
      <span className="category-tag">{story.category}</span>
    </a>
    <div className="story-copy">
      <h3><a href="#ultimas">{story.title}</a></h3>
      <span className="story-time"><Clock3 size={13} /> {story.time}</span>
    </div>
  </article>;
}

export default function Home() {
  return <main>
    <div className="topline"><div className="wrap top-inner"><span>RORAIMA • JORNALISMO LOCAL</span><span>Informação de credibilidade, todos os dias.</span></div></div>
    <header className="masthead wrap">
      <button className="icon-button mobile-menu" aria-label="Abrir menu"><Menu size={22}/></button>
      <Brand />
      <div className="masthead-right"><span className="edition">NOTÍCIAS • ANÁLISES • COMUNIDADE</span><button className="search-button" aria-label="Buscar notícias"><Search size={18}/><span>Buscar</span></button></div>
    </header>
    <nav className="nav-bar"><div className="wrap nav-inner">
      <a className="nav-home" href="#">INÍCIO</a><a href="#ultimas">POLÍTICA</a><a href="#ultimas">CIDADES</a><a href="#ultimas">SEGURANÇA</a><a href="#ultimas">ECONOMIA</a><a href="#ultimas">EDUCAÇÃO</a><a href="#cnc">CNC</a>
      <span className="nav-live"><span/> RORAIMA AGORA</span>
    </div></nav>
    <section className="wrap lead-section">
      <div className="section-heading"><div><span className="eyebrow">O QUE VOCÊ PRECISA SABER</span><h1>As notícias que <em>movem Roraima.</em></h1></div><p>Informação local, contexto e credibilidade para você entender o que acontece no nosso estado.</p></div>
      <div className="lead-grid">
        <article className="hero-story">
          <a className="hero-image" href="#ultimas" style={{ backgroundImage: `linear-gradient(0deg,rgba(12,15,20,.88),transparent 75%),url("${imageUrl("photo-1519608487953-e999c86e7455")}")` }}>
            <span className="category-tag">DESTAQUE</span><div className="hero-text"><span className="hero-kicker">GIRO DE NOTÍCIAS • RORAIMA</span><h2>Roraima em movimento: os assuntos que merecem a sua atenção hoje</h2><span className="hero-meta"><Clock3 size={14}/> Atualizações ao longo do dia <ArrowRight size={16}/></span></div>
          </a>
        </article>
        <div className="side-stories">{stories.slice(0,2).map((story)=><StoryCard key={story.category} story={story} compact/>)}</div>
      </div>
    </section>
    <section className="ticker"><div className="wrap ticker-inner"><span className="ticker-label"><TrendingUp size={15}/> EM PAUTA</span><p>Acompanhe os fatos, as decisões e as histórias de Roraima.</p><a href="#ultimas">Ver notícias <ArrowRight size={15}/></a></div></section>
    <section className="wrap latest-section" id="ultimas">
      <div className="section-title-row"><div><span className="eyebrow">INFORMAÇÃO EM TEMPO REAL</span><h2>Últimas notícias<span>.</span></h2></div><a className="text-link" href="#ultimas">Todas as notícias <ArrowRight size={16}/></a></div>
      <div className="news-grid">{stories.map((story)=><StoryCard key={story.category} story={story}/>)}</div>
    </section>
    <section className="cnc-band" id="cnc"><div className="wrap cnc-inner"><div className="cnc-symbol">CNC<span>+</span></div><div className="cnc-text"><span className="eyebrow gold">ALÉM DAS NOTÍCIAS</span><h2>A CNC também faz parte dessa história.</h2><p>Conheça as ações, os projetos e as iniciativas da CNC em Roraima.</p></div><a className="gold-button" href="#cnc">Conheça a CNC <ArrowRight size={17}/></a></div></section>
    <section className="wrap newsletter"><div><span className="eyebrow">FIQUE BEM INFORMADO</span><h2>Roraima acontece. <em>A gente conta.</em></h2><p>Volte para acompanhar as principais atualizações do estado.</p></div><a className="red-button" href="#ultimas">Ler as notícias <ArrowRight size={16}/></a></section>
    <footer><div className="wrap footer-main"><Brand/><p>Informação de credibilidade para Roraima.</p><a href="#cnc">Sobre o portal</a></div><div className="footer-bottom"><div className="wrap"><span>© {new Date().getFullYear()} CNC — Cristhian Cruz News</span><span>Jornalismo local com responsabilidade.</span></div></div></footer>
  </main>;
}
