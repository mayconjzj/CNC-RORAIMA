"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Newspaper, RefreshCw, Pencil, Trash2 } from "lucide-react";
import type { AdminArticle, AdminAuthor } from "@/lib/admin-types";

type Props = {
  articles: AdminArticle[];
  authors: AdminAuthor[];
  busy: boolean;
  onRefresh: () => void;
  onEdit: (article: AdminArticle) => void;
  onDelete: (article: AdminArticle) => void;
};

export function ArticleList({ articles, authors, busy, onRefresh, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return articles.filter((article) => {
      const author = authors.find((item) => item.id === article.author_id)?.name ?? "";
      const searchable = [
        article.title,
        article.slug,
        article.excerpt ?? "",
        article.category_name ?? "",
        author,
        article.status,
      ].join(" ").toLocaleLowerCase("pt-BR");

      return (!query || searchable.includes(query)) &&
        (statusFilter === "all" || article.status === statusFilter);
    });
  }, [articles, authors, search, statusFilter]);

  const panel: CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #eee", minWidth: 0 };
  const input: CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", background: "#fff", minWidth: 0 };
  const button: CSSProperties = { border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "9px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };

  return (
    <section style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>
          <Newspaper size={19} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }} />
          Notícias recentes
        </h2>
        <button type="button" aria-label="Atualizar lista de notícias" onClick={onRefresh} style={button}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 130px", gap: 8, marginTop: 14 }}>
        <input
          aria-label="Buscar notícias no painel"
          style={input}
          type="search"
          placeholder="Buscar por título, resumo, editoria ou autor..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filtrar notícias por status"
          style={input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Todos os status</option>
          <option value="published">Publicadas</option>
          <option value="draft">Rascunhos</option>
        </select>
      </div>

      <p style={{ color: "#777", fontSize: 12, margin: "8px 0 0" }}>
        {filteredArticles.length} de {articles.length} notícias
      </p>

      <div style={{ marginTop: 4 }}>
        {articles.length === 0 ? (
          <p style={{ color: "#777" }}>Nenhuma notícia cadastrada.</p>
        ) : filteredArticles.length === 0 ? (
          <p style={{ color: "#777" }}>Nenhuma notícia corresponde à busca.</p>
        ) : filteredArticles.map((article) => (
          <article key={article.id} style={{ padding: "13px 0", borderBottom: "1px solid #eee" }}>
            <strong>{article.title}</strong>
            <p style={{ color: "#777", fontSize: 12, margin: "5px 0" }}>
              {article.category_name ?? "Sem editoria"} · {authors.find((item) => item.id === article.author_id)?.name ?? "Autor não definido"} · {article.status === "published" ? "Publicado" : "Rascunho"}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {article.status === "published" && (
                <a href={`/noticias/${article.slug}`} target="_blank" rel="noreferrer" style={{ color: "#b90018", fontSize: 13 }}>Ver ↗</a>
              )}
              <button type="button" onClick={() => onEdit(article)} style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", fontSize: 13 }}>
                <Pencil size={13} /> Editar
              </button>
              <button type="button" disabled={busy} onClick={() => onDelete(article)} style={{ border: 0, background: "transparent", color: "#b90018", padding: 0, cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", fontSize: 13 }}>
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
