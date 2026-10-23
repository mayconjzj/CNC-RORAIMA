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

type Props = { params: Promise<{ slug: string }> };
type Article = { title: string; slug: string; excerpt: string | null; content: unknown; featured_image_url: string | null; image_alt: string | null; published_at: string | null; updated_at: string | null; category_name: string | null; author_name: string | null; author_avatar_url: string | null };

const findArticle = cache(unstable_cache(async function findArticle(slug: string): Promise<Article | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.image_alt, a.published_at, a.updated_at,
      c.name AS category_name, au.name AS author_name, au.avatar_url AS author_avatar_url
    FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN authors au ON au.id = a.author_id
    WHERE a.slug = ${slug} AND a.status = 'published' AND a.published_at <= NOW() LIMIT 1
  `;
  return (rows[0] as Article | undefined) ?? null;
}, ["published-article-by-slug"], { revalidate: 60, tags: ["published-articles"] }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) return { title: "Notícia não encontrada" };
  const description = (article.excerpt || article.title).slice(0, 160);
  return {
    title: article.title,
    description,
    alternates: { canonical: `/noticias/${article.slug}` },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "pt_BR",
      title: article.title,
      description,
      url: `/noticias/${article.slug}`,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || article.published_at || undefined,
      images: article.featured_image_url ? [{ url: article.featured_image_url, alt: article.image_alt || article.title }] : [],
    },
    twitter: {
      card: article.featured_image_url ? "summary_large_image" : "summary",
      title: article.title,
      description,
      images: article.featured_image_url ? [article.featured_image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();
  const sections = normalizeArticleSections(article.content);
  const siteUrl = SITE_URL;
  const articleUrl = `${siteUrl}/noticias/${article.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || article.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    author: article.author_name ? { "@type": "Person", name: article.author_name } : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: "CNC Roraima", url: siteUrl },
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    inLanguage: "pt-BR",
  };
  return <main style={{ minHeight: "100vh", color: "#202126" }}>
    
    <script type="application/ld+json">{JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>
    <article style={{ width: "min(900px, calc(100% - 32px))", margin: "42px auto 80px" }}>
      <ArticleBackLink />
      <p style={{ color: "#b90018", textTransform: "uppercase", letterSpacing: 1.5, fontSize: 12, fontWeight: 800, marginTop: 28 }}>{article.category_name ?? "Notícias de Roraima"}</p>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 54px)", lineHeight: 1.08, margin: "12px 0 18px" }}>{article.title}</h1>
      {article.excerpt && <p style={{ fontSize: 21, lineHeight: 1.6, color: "#666" }}>{article.excerpt}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 28px", color: "#777", fontSize: 13 }}>{article.author_name && (article.author_avatar_url ? <img src={article.author_avatar_url} alt={`Foto de ${article.author_name}`} width={40} height={40} loading="lazy" referrerPolicy="no-referrer" style={{ width: 40, height: 40, flexShrink: 0, objectFit: "cover", borderRadius: "50%", border: "1px solid #e5e5e5" }} /> : <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#f2e6e7", color: "#b90018", fontSize: 16, fontWeight: 800 }}>{article.author_name.trim().charAt(0).toUpperCase()}</span>)}<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{article.author_name && <span style={{ color: "#202126", fontWeight: 700 }}>Por {article.author_name}</span>}{article.published_at && <time dateTime={article.published_at}>{formatArticleTimestamp(article.published_at, "Publicado")}</time>}{hasArticleBeenUpdated(article.published_at, article.updated_at) && article.updated_at && <time dateTime={article.updated_at}>{formatArticleTimestamp(article.updated_at, "Atualizado")}</time>}</div></div>
      {article.featured_image_url && <Image src={article.featured_image_url} alt={article.image_alt || article.title} width={1200} height={520} sizes="(max-width: 900px) 100vw, 900px" priority unoptimized={!shouldOptimizeImage(article.featured_image_url)} style={{ width: "100%", height: "auto", maxHeight: 520, objectFit: "cover", borderRadius: 12, marginBottom: 30 }} />}
      <ArticleBody sections={sections} />
      <ShareButtons title={article.title} url={articleUrl} />
      
    </article>
  </main>;
}
