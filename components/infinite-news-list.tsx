"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NewsList } from "@/components/news-list";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  category_name: string | null;
  category_slug?: string | null;
  author_name?: string | null;
};

type Filters = {
  q?: string;
  category?: string;
  author?: string;
  from?: string;
  to?: string;
  sort?: string;
};

type Props = {
  initialArticles: Article[];
  hasMore: boolean;
  filters: Filters;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
};

export function InfiniteNewsList({
  initialArticles,
  hasMore: initiallyHasMore,
  filters,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyLinkLabel,
}: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initiallyHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialArticles.length);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set("offset", String(offsetRef.current));
      params.set("limit", "9");
      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) throw new Error("Não foi possível carregar as notícias.");
      const data = (await response.json()) as { articles: Article[]; hasMore: boolean };
      setArticles((current) => [...current, ...data.articles]);
      offsetRef.current += data.articles.length;
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters, hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, articles.length]);

  return (
    <>
      <NewsList
        articles={articles}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyHref={emptyHref}
        emptyLinkLabel={emptyLinkLabel}
      />
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      {loading && <p role="status" style={{ textAlign: "center", padding: "20px", color: "#666" }}>Carregando mais notícias…</p>}
      {error && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p role="alert">Não foi possível carregar mais notícias.</p>
          <button type="button" onClick={() => void loadMore()} style={{ border: "1px solid #ccc", borderRadius: 8, padding: "10px 16px", background: "#fff", cursor: "pointer" }}>Tentar novamente</button>
        </div>
      )}
      {!hasMore && articles.length > 0 && <p style={{ textAlign: "center", padding: "20px", color: "#777" }}>Você chegou ao fim das notícias.</p>}
    </>
  );
}
