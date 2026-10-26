import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { shouldOptimizeImage } from "@/lib/media";
import { formatNewsDate } from "@/lib/news-date";

export type LatestNewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  category_name: string | null;
};

export function LatestNewsSection({ articles }: { articles: LatestNewsArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="latest-news-heading" style={{ marginTop: 56, paddingTop: 30, borderTop: "1px solid #e7e7e7" }}>
      <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <p style={{ margin: "0 0 7px", color: "#b90018", fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>CNC Roraima</p>
          <h2 id="latest-news-heading" style={{ margin: 0, fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.15, color: "#202126" }}>Últimas notícias</h2>
        </div>
        <Link href="/noticias" style={{ color: "#b90018", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Ver todas as notícias →</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 18 }}>
        {articles.map((article) => (
          <article key={article.id} style={{ minWidth: 0, overflow: "hidden", border: "1px solid #e9e9e9", borderRadius: 10, background: "#fff" }}>
            <Link href={`/noticias/${article.slug}`} aria-label={article.title} style={{ display: "block", aspectRatio: "16 / 9", overflow: "hidden", background: "#f3f3f3" }}>
              {article.featured_image_url ? (
                <Image
                  src={article.featured_image_url}
                  alt=""
                  width={640}
                  height={360}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 280px"
                  loading="lazy"
                  unoptimized={!shouldOptimizeImage(article.featured_image_url)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />
              )}
            </Link>
            <div style={{ padding: 15 }}>
              <p style={{ margin: "0 0 8px", color: "#b90018", fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>{article.category_name ?? "Notícias"}</p>
              <h3 style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35 }}>
                <Link href={`/noticias/${article.slug}`} style={{ color: "#202126", textDecoration: "none" }}>{article.title}</Link>
              </h3>
              {article.excerpt && <p style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: "0 0 13px", color: "#666", fontSize: 13, lineHeight: 1.5 }}>{article.excerpt}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#777", fontSize: 11 }}>
                <Clock3 size={13} aria-hidden="true" />
                <time dateTime={article.published_at ?? undefined}>{formatNewsDate(article.published_at)}</time>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
