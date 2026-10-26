import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublishedCategories } from "@/lib/db";
import { SiteNavigation } from "@/components/site-navigation";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="CNC Roraima - página inicial">
      <Image
        className="brand-logo"
        src="/cnc-logo.svg"
        alt="CNC Roraima"
        width={132}
        height={62}
        priority
      />
    </Link>
  );
}

export async function SiteHeader() {
  let categories: Awaited<ReturnType<typeof getPublishedCategories>> = [];
  try {
    categories = await getPublishedCategories();
  } catch (error) {
    // Keep institutional pages available when the database is temporarily unavailable.
    console.error("Não foi possível carregar as editorias da navegação", error);
  }

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
          <Link className="search-button" href="/noticias" aria-label="Pesquisar todas as notícias">
            <Search size={18} />
            <span>Notícias</span>
          </Link>
        </div>
      </header>
      <SiteNavigation categories={categories} />
    </>
  );
}
