import { Search } from "lucide-react";
import { getPublishedCategories } from "@/lib/db";
import { SiteNavigation } from "@/components/site-navigation";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="CNC Roraima - página inicial">
      <span className="brand-mark">C<span>N</span>C</span>
      <span className="brand-copy">
        <strong>CRISTHIAN CRUZ <i>NEWS</i></strong>
        <small>INFORMAÇÃO DE CREDIBILIDADE</small>
      </span>
    </a>
  );
}

export async function SiteHeader() {
  const categories = await getPublishedCategories();

  return (
    <>
      <div className="topline">
        <div className="wrap top-inner">
          <span>RORAIMA • JORNALISMO LOCAL</span>
          <span>Informação de credibilidade, todos os dias.</span>
        </div>
      </div>
      <header className="masthead wrap">
        <Brand />
        <div className="masthead-right">
          <span className="edition">NOTÍCIAS • ANÁLISES • COMUNIDADE</span>
          <a className="search-button" href="/noticias" aria-label="Pesquisar todas as notícias">
            <Search size={18} />
            <span>Notícias</span>
          </a>
        </div>
      </header>
      <SiteNavigation categories={categories} />
    </>
  );
}
