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
  totalArticles: number;
  filters: Filters;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
};

export function InfiniteNewsList({
  initialArticles,
  hasMore: initiallyHasMore,
  totalArticles,
  filters,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyLinkLabel,
}: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initiallyHasMore);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialArticles.length);

  const listRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const skipSaveRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);
  const cacheKey = `cnc-news-list:${totalArticles}:${JSON.stringify(filters)}`;
  const returnKey = `${cacheKey}:return`;

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      if (sessionStorage.getItem(returnKey) !== "1") return;
      const cached = sessionStorage.getItem(cacheKey);
      sessionStorage.removeItem(returnKey);
      if (!cached) return;

      const saved = JSON.parse(cached) as {
        articles?: Article[];
        hasMore?: boolean;
        offset?: number;
        scrollY?: number;
      };
      if (!Array.isArray(saved.articles)) return;

      skipSaveRef.current = true;
      pendingScrollYRef.current = Math.max(0, saved.scrollY ?? 0);
      setArticles(saved.articles);
      setHasMore(saved.articles.length < totalArticles);
      offsetRef.current = saved.articles.length;
    } catch {
      sessionStorage.removeItem(returnKey);
    }
  }, [cacheKey, returnKey, totalArticles]);

  useEffect(() => {
    const targetY = pendingScrollYRef.current;
    if (targetY === null) return;

    let attempts = 0;
    let frame = 0;
    const restoreScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      attempts += 1;

      // Wait for the restored infinite-list items to render before animating.
      if (maxScroll < targetY - 2 && attempts < 30) {
        frame = requestAnimationFrame(restoreScroll);
        return;
      }

      pendingScrollYRef.current = null;
      window.scrollTo({
        top: Math.min(targetY, Math.max(0, maxScroll)),
        left: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(restoreScroll);
    });
    return () => cancelAnimationFrame(frame);
  }, [articles]);

  useEffect(() => {
    if (!restoredRef.current) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        articles,
        hasMore,
        offset: offsetRef.current,
        scrollY: window.scrollY,
      }));
    } catch {
      // If storage is unavailable or full, pagination still works normally.
    }
  }, [articles, hasMore, cacheKey]);

  const loadMore = useCallback(async () => {
    // A ref blocks simultaneous observer callbacks before React can rerender.
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set("offset", String(offsetRef.current));
      params.set("limit", "9");
      const response = await fetch(`/api/news?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar as notícias.");
      const data = (await response.json()) as { articles?: Article[]; hasMore?: boolean };
      if (!Array.isArray(data.articles)) throw new Error("A resposta da listagem está inválida.");

      const fetched = data.articles;
      if (fetched.length === 0) {
        // Do not silently stop before the server-reported total is reached.
        if (offsetRef.current < totalArticles) {
          throw new Error("A listagem retornou uma página vazia antes do fim das notícias.");
        }
        setHasMore(false);
        return;
      }

      setArticles((current) => {
        const knownIds = new Set(current.map((article) => article.id));
        const uniqueFetched = fetched.filter((article) => !knownIds.has(article.id));
        return uniqueFetched.length ? [...current, ...uniqueFetched] : current;
      });
      offsetRef.current += fetched.length;
      // The initial COUNT(*) is the authoritative total. This avoids ending
      // pagination early if an API response reports hasMore incorrectly.
      setHasMore(offsetRef.current < totalArticles);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filters, hasMore]);

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
      <div
        ref={listRef}
        onClick={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const link = target.closest("a[href]");
          if (!link) return;
          const href = link.getAttribute("href") ?? "";
          if (!href.startsWith("/noticias/") || href === "/noticias") return;
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              articles,
              hasMore,
              offset: offsetRef.current,
              scrollY: window.scrollY,
            }));
            sessionStorage.setItem(returnKey, "1");
          } catch {
            // Navigation remains available even when storage is unavailable.
          }
        }}
      >
        <NewsList
          articles={articles}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptyHref={emptyHref}
          emptyLinkLabel={emptyLinkLabel}
        />
      </div>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      {loading && <p role="status" style={{ textAlign: "center", padding: "20px", color: "#666" }}>Carregando mais notícias…</p>}
      {error && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p role="alert">Não foi possível carregar mais notícias.</p>
          <button type="button" onClick={() => void loadMore()} style={{ border: "1px solid #ccc", borderRadius: 8, padding: "10px 16px", background: "#fff", cursor: "pointer" }}>Tentar novamente</button>
        </div>
      )}
      {hasMore && <div style={{ textAlign: "center", padding: "20px" }}><button type="button" onClick={() => void loadMore()} disabled={loading} style={{ border: "1px solid #b90018", borderRadius: 8, padding: "12px 20px", background: loading ? "#f5f5f5" : "#fff", color: "#b90018", fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>{loading ? "Carregando…" : "Carregar mais notícias"}</button><p style={{ color: "#777", fontSize: 13, marginTop: 8 }}>{articles.length} de {totalArticles} notícias</p></div>}
      {!hasMore && articles.length > 0 && <p style={{ textAlign: "center", padding: "20px", color: "#777" }}>Você chegou ao fim das notícias. ({articles.length} de {totalArticles})</p>}
    </>
  );
}
