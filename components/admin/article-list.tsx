"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Newspaper, RefreshCw, Pencil, Trash2, Search } from "lucide-react";
import type { AdminArticle, AdminAuthor, AdminOption } from "@/lib/admin-types";

type Props = {
  articles: AdminArticle[];
  authors: AdminAuthor[];
  categories: AdminOption[];
  busy: boolean;
  onRefresh: () => void;
  onEdit: (article: AdminArticle) => void;
  onDelete: (article: AdminArticle) => void;
};

const PAGE_SIZE = 50;

export function ArticleList({ articles, authors, categories, busy, onRefresh, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("updated_desc");
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState<AdminArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const previousArticlesRef = useRef(articles);

  useEffect(() => {
    const controller = new AbortController();
    loadingRef.current = true;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        q: search.trim(),
        status: statusFilter,
        category: categoryFilter,
        author: authorFilter,
        sort: sortOrder,
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      try {
        const response = await fetch(`/api/admin/articles?${params.toString()}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || "Não foi possível pesquisar as notícias.");
          return;
        }
        const nextArticles = (data.articles ?? []) as AdminArticle[];
        const nextTotal = Number(data.total ?? 0);
        setResults((current) => {
          if (offset === 0) return nextArticles;
          const seen = new Set(current.map((article) => article.id));
          return [...current, ...nextArticles.filter((article) => !seen.has(article.id))];
        });
        setTotal(nextTotal);
      } catch {
        if (!controller.signal.aborted) setError("Falha de conexão ao pesquisar notícias.");
      } finally {
        if (!controller.signal.aborted) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
      // Release the lock when filters or the requested page change, including
      // aborted requests whose finally block intentionally does not run state updates.
      loadingRef.current = false;
    };
  }, [search, statusFilter, categoryFilter, authorFilter, sortOrder, offset, articles]);

  const panel: CSSProperties = { background: "#fff", padding: 22, borderRadius: 14, border: "1px solid #eee", minWidth: 0 };
  const input: CSSProperties = { width: "100%", padding: "10px 11px", border: "1px solid #ddd", borderRadius: 8, font: "inherit", background: "#fff", minWidth: 0 };
  const button: CSSProperties = { border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "9px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 };
  const filtersChanged = () => setOffset(0);
  const hasMore = results.length < total;

  useEffect(() => {
    if (previousArticlesRef.current === articles) return;
    previousArticlesRef.current = articles;
    setOffset(0);
    setResults([]);
    setTotal(0);
  }, [articles]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingRef.current) {
          // Lock synchronously: IntersectionObserver can fire more than once
          // before React applies the offset update.
          loadingRef.current = true;
          setOffset((current) => current + PAGE_SIZE);
        }
      },
      { root, rootMargin: "180px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, results.length]);

  return (
    <section style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>
          <Newspaper size={19} style={{ verticalAlign: "middle", marginRight: 8, color: "#b90018" }} />
          Notícias
        </h2>
        <button type="button" aria-label="Atualizar lista de notícias" onClick={() => { setOffset(0); onRefresh(); }} style={button}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 8, marginTop: 14 }}>
        <div style={{ position: "relative" }}>
          <Search size={16} aria-hidden="true" style={{ position: "absolute", left: 11, top: 13, color: "#888" }} />
          <input
            aria-label="Buscar notícias no painel"
            style={{ ...input, paddingLeft: 34 }}
            type="search"
            placeholder="Buscar título, resumo, conteúdo, editoria ou autor..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); filtersChanged(); }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 8 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#666" }}>
            Status
            <select aria-label="Filtrar notícias por status" style={input} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); filtersChanged(); }}>
              <option value="all">Todos os status</option>
              <option value="published">Publicadas</option>
              <option value="draft">Rascunhos</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#666" }}>
            Editoria
            <select aria-label="Filtrar notícias por editoria" style={input} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); filtersChanged(); }}>
              <option value="all">Todas as editorias</option>
              <option value="none">Sem editoria</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#666" }}>
            Autor
            <select aria-label="Filtrar notícias por autor" style={input} value={authorFilter} onChange={(event) => { setAuthorFilter(event.target.value); filtersChanged(); }}>
              <option value="all">Todos os autores</option>
              <option value="none">Sem autor</option>
              {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#666" }}>
            Ordenar por
            <select aria-label="Ordenar notícias" style={input} value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); filtersChanged(); }}>
              <option value="updated_desc">Última edição (mais recente)</option>
              <option value="published_desc">Data de publicação (mais recente)</option>
              <option value="published_asc">Data de publicação (mais antiga)</option>
              <option value="title_asc">Título (A–Z)</option>
              <option value="title_desc">Título (Z–A)</option>
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <p style={{ color: "#777", fontSize: 12, margin: "9px 0 8px" }} aria-live="polite">
          {loading ? "Pesquisando…" : `Exibindo ${results.length} de ${total} notícias`}
        </p>
        {(search || statusFilter !== "all" || categoryFilter !== "all" || authorFilter !== "all" || sortOrder !== "updated_desc") &&
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setAuthorFilter("all"); setSortOrder("updated_desc"); setOffset(0); }} style={{ ...button, fontSize: 12, padding: "6px 8px" }}>Limpar filtros</button>}
      </div>
      {error && <p role="alert" style={{ color: "#b90018", fontSize: 13 }}>{error}</p>}

      <div ref={scrollContainerRef} style={{ marginTop: 4, maxHeight: 560, overflowY: "auto", overscrollBehavior: "contain", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", paddingRight: 5 }}>
        {results.length === 0 && !loading ? (
          <p style={{ color: "#777", padding: "12px 0" }}>{search.trim() || statusFilter !== "all" || categoryFilter !== "all" || authorFilter !== "all" ? "Nenhuma notícia corresponde aos filtros." : "Nenhuma notícia cadastrada."}</p>
        ) : results.map((article) => (
          <article key={article.id} style={{ padding: "13px 0", borderBottom: "1px solid #eee" }}>
            <strong style={{ display: "block", overflowWrap: "anywhere" }}>{article.title}</strong>
            <p style={{ color: "#777", fontSize: 12, margin: "5px 0" }}>
              {article.category_name ?? "Sem editoria"} · {authors.find((item) => item.id === article.author_id)?.name ?? "Autor não definido"} · {article.status === "published" ? "Publicada" : "Rascunho"}
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
        {results.length === 0 && loading && <p style={{ color: "#777", padding: "12px 0" }}>Carregando notícias…</p>}
        <div ref={loadMoreSentinelRef} aria-hidden="true" style={{ height: 1 }} />
        {loading && results.length > 0 && <p role="status" style={{ color: "#777", fontSize: 12, textAlign: "center", padding: "10px 0" }}>Carregando mais notícias…</p>}
        {!hasMore && results.length > 0 && <p style={{ color: "#777", fontSize: 12, textAlign: "center", padding: "10px 0" }}>Fim da lista.</p>}
      </div>
    </section>
  );
}
