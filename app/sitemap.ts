import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ArticleSitemapRow = { slug: string; updated_at: string | Date | null; published_at: string | Date | null };
type CategorySitemapRow = { slug: string; last_modified: string | Date | null };

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://cnc-roraima.vercel.app").replace(/\/$/, "");
}

function asDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  try {
    const sql = getDb();
    const [articles, categories] = await Promise.all([
      sql`SELECT slug, updated_at, published_at
          FROM articles
          WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= NOW()
          ORDER BY published_at DESC` as unknown as Promise<ArticleSitemapRow[]>,
      sql`SELECT c.slug, MAX(COALESCE(a.updated_at, a.published_at)) AS last_modified
          FROM categories c
          INNER JOIN articles a ON a.category_id = c.id
          WHERE a.status = 'published' AND a.published_at IS NOT NULL AND a.published_at <= NOW()
          GROUP BY c.id, c.slug
          ORDER BY c.slug` as unknown as Promise<CategorySitemapRow[]>,
    ]);

    const staticRoutes: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
      { url: `${baseUrl}/noticias`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ];

    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${baseUrl}/noticias/${article.slug}`,
      lastModified: asDate(article.updated_at ?? article.published_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/editorias/${category.slug}`,
      lastModified: asDate(category.last_modified),
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [...staticRoutes, ...articleRoutes, ...categoryRoutes];
  } catch (error) {
    console.error("Não foi possível gerar o sitemap dinâmico da CNC Roraima.", error);
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
      { url: `${baseUrl}/noticias`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ];
  }
}
