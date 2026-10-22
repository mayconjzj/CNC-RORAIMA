import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não está configurada.");
  return neon(url);
}

export type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  image_alt: string | null;
  is_featured: boolean;
  published_at: string | null;
  category_name: string | null;
  category_slug: string | null;
  author_name: string | null;
};

const getCachedPublishedArticles = unstable_cache(
  async (limit: number): Promise<ArticleSummary[]> => {
    const sql = getDb();
    return sql`
      SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.image_alt,
        a.is_featured, a.published_at, c.name AS category_name, c.slug AS category_slug, au.name AS author_name
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN authors au ON au.id = a.author_id
      WHERE a.status = 'published' AND a.published_at <= NOW()
      ORDER BY a.is_featured DESC, a.published_at DESC NULLS LAST
      LIMIT ${limit}
    ` as unknown as ArticleSummary[];
  },
  ["published-articles"],
  { revalidate: 60, tags: ["published-articles"] },
);

export const getPublishedArticles = cache(async function getPublishedArticles(limit = 12): Promise<ArticleSummary[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  return getCachedPublishedArticles(safeLimit);
});

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  article_count: number;
};

const getCachedPublishedCategories = unstable_cache(
  async (): Promise<CategorySummary[]> => {
    const sql = getDb();
    return sql`
      SELECT c.id, c.name, c.slug, COUNT(a.id)::int AS article_count
      FROM categories c
      INNER JOIN articles a ON a.category_id = c.id
      WHERE a.status = 'published' AND a.published_at <= NOW()
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name ASC
    ` as unknown as CategorySummary[];
  },
  ["published-categories"],
  { revalidate: 60, tags: ["published-categories"] },
);

export const getPublishedCategories = cache(async function getPublishedCategories(): Promise<CategorySummary[]> {
  return getCachedPublishedCategories();
});
