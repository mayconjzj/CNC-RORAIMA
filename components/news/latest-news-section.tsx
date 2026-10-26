import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { shouldOptimizeImage } from "@/lib/media";
import { formatNewsDate } from "@/lib/news-date";
import styles from "./latest-news-section.module.css";

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
    <section className={styles.section} aria-labelledby="latest-news-heading">
      <div className={styles.heading}>
        <div>
          <p style={{ margin: "0 0 7px", color: "#b90018", fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase" }}>CNC Roraima</p>
          <h2 id="latest-news-heading" style={{ margin: 0, fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.15, color: "#202126" }}>Últimas notícias</h2>
        </div>
        <Link href="/noticias" style={{ color: "#b90018", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Ver todas as notícias →</Link>
      </div>

      <div className={styles.cards}>
        {articles.map((article) => (
          <article key={article.id} className={styles.card}>
            <Link href={`/noticias/${article.slug}`} aria-label={article.title} className={styles.image}>
              {article.featured_image_url ? (
                <Image
                  src={article.featured_image_url}
                  alt=""
                  width={640}
                  height={360}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 280px"
                  loading="lazy"
                  unoptimized={!shouldOptimizeImage(article.featured_image_url)}
                  className={styles.imageAsset}
                />
              ) : (
                <span aria-hidden="true" className={styles.imagePlaceholder} />
              )}
            </Link>
            <div className={styles.cardCopy}>
              <p className={styles.category}>{article.category_name ?? "Notícias"}</p>
              <h3 className={styles.title}>
                <Link href={`/noticias/${article.slug}`} className={styles.titleLink}>{article.title}</Link>
              </h3>
              {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
              <div className={styles.date}>
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
