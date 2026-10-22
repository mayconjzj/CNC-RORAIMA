"use client";

import { useEffect, useState } from "react";
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
  const [results, setResults] = useState<AdminArticle[]>(articles);
  const [total, setTotal] = useState(articles.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ q: search.trim(), status: statusFilter });

      try {
        const response = await fetch(`/api/admin/articles?${params.toString()}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Não foi possível pesquisar as notícias.");
          return;
        }
        setResults(data.articles ?? []);
        setTotal(Number(data.total ?? 0));
      } catch {
        if (!controller.signal.aborted) setError("Falha de conexão ao pesquisar notícias.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search, statusFilter, articles]);

  const panel: CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #eee", minWidth: 0 };
  const input: CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", background: "#fff", minWidth: 0 };
  const button: CSSProperties = { border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "9px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };

  return (
    <section style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>
          <Newspaper size={19} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }} />
          Notícias
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
        {loading ? "Pesquisando…" : `${results.length} de ${total} notícias`}
        {!loading && total > results.length ? " · refine a busca para ver mais resultados" : ""}
      </p>
      {error && <p role="alert" style={{ color: "#b90018", fontSize: 13 }}>{error}</p>}

      <div style={{ marginTop: 4 }}>
        {results.length === 0 && !loading ? (
          <p style={{ color: "#777" }}>{search.trim() || statusFilter !== "all" ? "Nenhuma notícia corresponde aos filtros." : "Nenhuma notícia cadastrada."}</p>
        ) : results.map((article) => (
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
