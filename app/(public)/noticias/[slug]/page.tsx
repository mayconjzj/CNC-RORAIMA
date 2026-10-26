import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { normalizeArticleSections } from "@/lib/article-content";
import { ArticleBody } from "@/components/news/article-body";
import ArticleBackLink from "./article-back-link";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import { shouldOptimizeImage } from "@/lib/media";
import { formatArticleTimestamp, hasArticleBeenUpdated } from "@/lib/news-date";
import { ShareButtons } from "@/components/news/share-buttons";
import { LatestNewsSection, type LatestNewsArticle } from "@/components/news/latest-news-section";
import styles from "./article-layout.module.css";

type Props = { params: Promise<{ slug: string }> };
type Article = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  featured_image_url: string | null;
  image_alt: string | null;
  published_at: string | null;
  updated_at: string | null;
  category_name: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
};

export const revalidate = 60;

const findArticle = cache(
  unstable_cache(
    async (slug: string): Promise<Article | null> => {
      const sql = getDb();
      const rows = await sql`
        SELECT a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.image_alt,
          a.published_at, a.updated_at, c.name AS category_name,
          au.name AS author_name, au.avatar_url AS author_avatar_url
        FROM articles a
        LEFT JOIN categories c ON c.id = a.category_id
        LEFT JOIN authors au ON au.id = a.author_id
        WHERE a.slug = ${slug}
          AND a.status = 'published'
          AND a.published_at <= NOW()
        LIMIT 1
      `;
      return (rows[0] as Article | undefined) ?? null;
    },
    ["published-article-by-slug"],
    { revalidate: 60, tags: ["published-articles"] },
  ),
);

const findLatestNews = cache(
  unstable_cache(
    async (currentSlug: string): Promise<LatestNewsArticle[]> => {
      const sql = getDb();
      const rows = await sql`
        SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at,
          c.name AS category_name
        FROM articles a
        LEFT JOIN categories c ON c.id = a.category_id
        WHERE a.status = 'published'
          AND a.published_at <= NOW()
          AND a.slug <> ${currentSlug}
        ORDER BY a.published_at DESC
        LIMIT 5
      `;
      return rows as LatestNewsArticle[];
    },
    ["latest-published-news-excluding-current"],
    { revalidate: 60, tags: ["published-articles"] },
  ),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticle(slug);

  if (!article) {
    return { title: "Notícia não encontrada", robots: { index: false, follow: false } };
  }

  const description = (article.excerpt || article.title).slice(0, 160);
  const canonicalPath = `/noticias/${article.slug}`;
  const image = article.featured_image_url
    ? [{ url: article.featured_image_url, alt: article.image_alt || article.title }]
    : [];

  return {
    title: article.title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "pt_BR",
      title: `CNC Roraima | ${article.title}`,
      description,
      url: canonicalPath,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || article.published_at || undefined,
      images: image,
    },
    twitter: {
      card: image.length ? "summary_large_image" : "summary",
      title: `CNC Roraima | ${article.title}`,
      description,
      images: article.featured_image_url ? [article.featured_image_url] : [],
    },
  };
}

function ArticleByline({ article }: { article: Article }) {
  const { author_name, author_avatar_url, published_at, updated_at } = article;
  const showUpdated = hasArticleBeenUpdated(published_at, updated_at) && Boolean(updated_at);

  return (
    <div className={styles.articleMeta}>
      <div className={styles.authorDetails}>
        {author_name && (
          author_avatar_url ? (
            // External author avatars are intentionally not routed through the Next image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.authorAvatar}
              src={author_avatar_url}
              alt={`Foto de ${author_name}`}
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.authorInitial} aria-hidden="true">
              {author_name.trim().charAt(0).toUpperCase()}
            </span>
          )
        )}
        <div className={styles.authorCopy}>
          {author_name && <span className={styles.authorName}>Por {author_name}</span>}
          {published_at && (
            <time dateTime={published_at}>
              {formatArticleTimestamp(published_at, "Publicado")}
            </time>
          )}
          {showUpdated && updated_at && (
            <time dateTime={updated_at}>
              {formatArticleTimestamp(updated_at, "Atualizado")}
            </time>
          )}
        </div>
      </div>
      <ShareButtons title={article.title} url={`${SITE_URL}/noticias/${article.slug}`} />
    </div>
  );
}

function ArticleStructuredData({ article }: { article: Article }) {
  const articleUrl = `${SITE_URL}/noticias/${article.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || article.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    inLanguage: "pt-BR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  // Run the independent, cached reads concurrently to reduce article-page latency.
  const [article, latestNews] = await Promise.all([
    findArticle(slug),
    findLatestNews(slug),
  ]);
  if (!article) notFound();

  const sections = normalizeArticleSections(article.content);

  return (
    <main className={styles.articlePage}>
      <ArticleStructuredData article={article} />
      <div className={styles.articleLayout}>
        <article className={styles.articleContent}>
          <ArticleBackLink slug={article.slug} />
          <p className={styles.articleCategory}>
            {article.category_name ?? "Notícias de Roraima"}
          </p>
          <h1 className={styles.articleTitle}>{article.title}</h1>
          {article.excerpt && <p className={styles.articleExcerpt}>{article.excerpt}</p>}
          <ArticleByline article={article} />
          {article.featured_image_url && (
            <Image
              className={styles.articleHero}
              src={article.featured_image_url}
              alt={article.image_alt || article.title}
              width={1200}
              height={520}
              sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 320px), 850px"
              priority
              unoptimized={!shouldOptimizeImage(article.featured_image_url)}
            />
          )}
          <div className={styles.articleBody}>
            <ArticleBody sections={sections} />
          </div>
        </article>
        <aside className={styles.latestSidebar} aria-label="Últimas notícias">
          <LatestNewsSection articles={latestNews} />
        </aside>
      </div>
    </main>
  );
}
