import { ArrowRight, Clock3, Search, TrendingUp } from "lucide-react";
import { getPublishedCategories } from "@/lib/db";

export function Brand() {
  return <a className="brand" href="/" aria-label="CNC Roraima - página inicial">
    <span className="brand-mark">C<span>N</span>C</span>
    <span className="brand-copy"><strong>CRISTHIAN CRUZ <i>NEWS</i></strong><small>INFORMAÇÃO DE CREDIBILIDADE</small></span>
  </a>;
}

export async function SiteHeader() {
  const categories = await getPublishedCategories();

  return <>
    <div className="topline"><div className="wrap top-inner"><span>RORAIMA • JORNALISMO LOCAL</span><span>Informação de credibilidade, todos os dias.</span></div></div>
    <header className="masthead wrap">
      <Brand />
      <div className="masthead-right">
        <span className="edition">NOTÍCIAS • ANÁLISES • COMUNIDADE</span>
        <a className="search-button" href="/#ultimas" aria-label="Ver notícias"><Search size={18}/><span>Notícias</span></a>
      </div>
    </header>
    <nav className="nav-bar" aria-label="Navegação principal"><div className="wrap nav-inner">
      <a className="nav-home" href="/">INÍCIO</a>
      {categories.map(category => <a key={category.id} href={`/editorias/${category.slug}`}>{category.name.toLocaleUpperCase("pt-BR")}</a>)}
      <a href="/#cnc">CNC</a>
      <span className="nav-live"><span/> RORAIMA AGORA</span>
    </div></nav>
  </>;
}
