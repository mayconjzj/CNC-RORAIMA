import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://cnc-roraima.vercel.app").replace(/\/$/, "");
  try {
    const sql = getDb();
    const [articles, categories] = await Promise.all([
      sql`SELECT slug, updated_at, published_at FROM articles WHERE status = 'published' AND published_at <= NOW()`,
      sql`SELECT DISTINCT c.slug FROM categories c INNER JOIN articles a ON a.category_id = c.id WHERE a.status = 'published' AND a.published_at <= NOW()`,
    ]);
    return [
      { url: base, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
      ...articles.map((row) => ({ url: base + "/noticias/" + row.slug, lastModified: new Date(String(row.updated_at || row.published_at || Date.now())), changeFrequency: "weekly" as const, priority: 0.8 })),
      ...categories.map((row) => ({ url: base + "/editorias/" + row.slug, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.6 })),
    ];
  } catch (error) {
    console.error("Não foi possível gerar sitemap com artigos", error);
    return [{ url: base, lastModified: new Date(), priority: 1 }];
  }
}
