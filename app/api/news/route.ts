import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  category_name: string | null;
  category_slug: string | null;
  author_name: string | null;
};

function validDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 120);
  const category = (params.get("category") ?? "").slice(0, 120);
  const author = (params.get("author") ?? "").slice(0, 80);
  const from = validDate(params.get("from"));
  const to = validDate(params.get("to"));
  const sort = ["oldest", "title"].includes(params.get("sort") ?? "") ? params.get("sort")! : "newest";
  const offset = Math.max(0, Math.min(Number.parseInt(params.get("offset") ?? "0", 10) || 0, 100000));
  const requestedLimit = Number.parseInt(params.get("limit") ?? "9", 10) || 9;
  const limit = Math.max(1, Math.min(requestedLimit, 9));
  const sql = getDb();

  const rows = await sql`
    SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image_url, a.published_at,
      c.name AS category_name, c.slug AS category_slug, au.name AS author_name
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN authors au ON au.id = a.author_id
    WHERE a.status = 'published' AND a.published_at <= NOW()
      AND (${q} = '' OR a.title ILIKE '%' || ${q} || '%' OR COALESCE(a.excerpt, '') ILIKE '%' || ${q} || '%' OR a.slug ILIKE '%' || ${q} || '%')
      AND (${category} = '' OR c.slug = ${category})
      AND (${author} = '' OR a.author_id::text = ${author})
      AND (${from}::date IS NULL OR a.published_at >= ${from}::date)
      AND (${to}::date IS NULL OR a.published_at < (${to}::date + INTERVAL '1 day'))
    ORDER BY
      CASE WHEN ${sort} = 'title' THEN a.title END ASC,
      CASE WHEN ${sort} = 'oldest' THEN a.published_at END ASC NULLS LAST,
      CASE WHEN ${sort} = 'newest' THEN a.published_at END DESC NULLS LAST
    LIMIT ${limit + 1} OFFSET ${offset}
  ` as unknown as Article[];

  return NextResponse.json({
    articles: rows.slice(0, limit),
    hasMore: rows.length > limit,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
