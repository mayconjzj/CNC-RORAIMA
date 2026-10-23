"use client";

import { Search, SlidersHorizontal } from "lucide-react";

type Option = { id?: string; name: string; slug?: string };
type Props = {
  action?: string;
  categories?: Option[];
  authors?: Option[];
  values?: { q?: string; category?: string; author?: string; from?: string; to?: string; sort?: string };
  showCategory?: boolean;
  compact?: boolean;
};

export function NewsSearch({ action = "/noticias", categories = [], authors = [], values = {}, showCategory = true, compact = false }: Props) {
  return (
    <form action={action} method="get" className={`news-search ${compact ? "news-search-compact" : ""}`}>
      <div className="news-search-query">
        <Search size={18} aria-hidden="true" />
        <input type="search" name="q" defaultValue={values.q ?? ""} placeholder="Buscar por título, assunto ou palavra-chave..." aria-label="Buscar notícias" />
        <button type="submit">Buscar</button>
      </div>
      <details className="news-search-advanced">
        <summary><SlidersHorizontal size={15} /> Filtros avançados</summary>
        <div className="news-search-fields">
          {showCategory && <label>Editoria<select name="category" defaultValue={values.category ?? ""}><option value="">Todas as editorias</option>{categories.map((item) => <option key={item.slug ?? item.id} value={item.slug}>{item.name}</option>)}</select></label>}
          <label>Autor<select name="author" defaultValue={values.author ?? ""}><option value="">Todos os autores</option>{authors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>De<input type="date" name="from" defaultValue={values.from ?? ""} /></label>
          <label>Até<input type="date" name="to" defaultValue={values.to ?? ""} /></label>
          <label>Ordenar por<select name="sort" defaultValue={values.sort ?? "newest"}><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option><option value="title">Título (A–Z)</option></select></label>
          <div className="news-search-actions"><a href={action}>Limpar filtros</a><button type="submit">Aplicar filtros</button></div>
        </div>
      </details>
      <style>{`
        .news-search{margin:26px 0 32px;padding:18px;background:#fafafa;border:1px solid #e7e7ea;border-radius:10px;color:#202126}
        .news-search-query{display:flex;align-items:center;gap:12px;min-height:46px;padding:5px 6px 5px 13px;background:#fff;border:1px solid #dcdce1;border-radius:7px}
        .news-search-query svg{flex-shrink:0;color:#777}
        .news-search-query input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#202126;font:inherit;font-size:14px}
        .news-search button{border:0;border-radius:5px;background:#b90018;color:#fff;padding:11px 17px;font:inherit;font-size:13px;font-weight:750;cursor:pointer;white-space:nowrap}
        .news-search-advanced summary{display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;padding:14px 0 4px;color:#444;font-size:12px;font-weight:750;cursor:pointer;list-style:none}
        .news-search-advanced summary::-webkit-details-marker{display:none}
        .news-search-fields{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;padding-top:14px}
        .news-search-fields label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:750;color:#5c5d64}
        .news-search-fields select,.news-search-fields input{width:100%;min-width:0;min-height:40px;padding:8px 9px;border:1px solid #dedee3;border-radius:5px;background:#fff;color:#202126;font:inherit;font-size:12px}
        .news-search-actions{display:flex;align-items:end;justify-content:flex-end;gap:14px;grid-column:1/-1}
        .news-search-actions a{padding:11px 0;color:#666;font-size:12px;text-decoration:underline}
        .news-search-compact .news-search-advanced:not([open]) summary{padding-bottom:0}
        @media(max-width:760px){.news-search{padding:13px;margin:22px 0}.news-search-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.news-search-query{gap:8px}.news-search-query input{font-size:13px}.news-search button{padding:11px 12px}}
        @media(max-width:420px){.news-search-fields{grid-template-columns:1fr 1fr}.news-search-query svg{display:none}.news-search-query input{font-size:12px}.news-search-query button{font-size:12px;padding:10px}.news-search-actions{flex-wrap:wrap}}
      `}</style>
    </form>
  );
}
