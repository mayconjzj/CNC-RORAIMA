import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getDb } from "@/lib/db";
import { parseArticleInput } from "@/lib/article-service";
import { revalidatePublishedContent } from "@/lib/revalidation";
import { parseBoundedInteger } from "@/lib/pagination";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("manage_news");
  if (auth.response) return auth.response;
  try {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim().slice(0, 120);
    const requestedStatus = params.get("status") ?? "all";
    const status = ["published", "draft"].includes(requestedStatus) ? requestedStatus : "all";
    const category = (params.get("category") ?? "all").slice(0, 120);
    const author = (params.get("author") ?? "all").slice(0, 120);
    const requestedSort = params.get("sort") ?? "updated_desc";
    const sort = ["updated_desc", "published_desc", "published_asc", "title_asc", "title_desc"].includes(requestedSort) ? requestedSort : "updated_desc";
    const limit = parseBoundedInteger(params.get("limit"), 50, 1, 100);
    const offset = parseBoundedInteger(params.get("offset"), 0, 0, 100000);
    const sql = getDb();
    const [articles, countRows] = await Promise.all([
      sql`
        SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.status, a.is_featured, a.category_id, a.author_id, a.published_at, a.updated_at, a.seo_title, a.seo_description,
          c.name AS category_name, au.name AS author_name
        FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN authors au ON au.id = a.author_id
        WHERE (${query} = '' OR a.title ILIKE '%' || ${query} || '%' OR a.slug ILIKE '%' || ${query} || '%'
          OR COALESCE(a.excerpt, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(a.seo_title, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(a.seo_description, '') ILIKE '%' || ${query} || '%'
          OR a.content::text ILIKE '%' || ${query} || '%'
          OR COALESCE(c.name, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(au.name, '') ILIKE '%' || ${query} || '%')
          AND (${status} = 'all' OR a.status = ${status})
          AND (${category} = 'all' OR (${category} = 'none' AND a.category_id IS NULL) OR a.category_id::text = ${category})
          AND (${author} = 'all' OR (${author} = 'none' AND a.author_id IS NULL) OR a.author_id::text = ${author})
        ORDER BY
          CASE WHEN ${sort} = 'published_asc' THEN a.published_at END ASC NULLS LAST,
          CASE WHEN ${sort} = 'published_desc' THEN a.published_at END DESC NULLS LAST,
          CASE WHEN ${sort} = 'title_asc' THEN LOWER(a.title) END ASC NULLS LAST,
          CASE WHEN ${sort} = 'title_desc' THEN LOWER(a.title) END DESC NULLS LAST,
          CASE WHEN ${sort} = 'updated_desc' THEN a.updated_at END DESC NULLS LAST,
          a.updated_at DESC NULLS LAST, a.id DESC LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN authors au ON au.id = a.author_id
        WHERE (${query} = '' OR a.title ILIKE '%' || ${query} || '%' OR a.slug ILIKE '%' || ${query} || '%'
          OR COALESCE(a.excerpt, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(a.seo_title, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(a.seo_description, '') ILIKE '%' || ${query} || '%'
          OR a.content::text ILIKE '%' || ${query} || '%'
          OR COALESCE(c.name, '') ILIKE '%' || ${query} || '%'
          OR COALESCE(au.name, '') ILIKE '%' || ${query} || '%')
          AND (${status} = 'all' OR a.status = ${status})
          AND (${category} = 'all' OR (${category} = 'none' AND a.category_id IS NULL) OR a.category_id::text = ${category})
          AND (${author} = 'all' OR (${author} = 'none' AND a.author_id IS NULL) OR a.author_id::text = ${author})
      `,
    ]);
    return NextResponse.json(
      { articles, total: Number(countRows[0]?.total ?? 0) },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Falha ao listar artigos", error);
    return NextResponse.json({ error: "Erro ao consultar artigos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("manage_news");
  if (auth.response) return auth.response;
  try {
    const parsed = parseArticleInput(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { title, excerpt, seoTitle, seoDescription, image, categoryId, authorId, status, isFeatured, sections } = parsed.data;
    const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160) + "-" + crypto.randomUUID().slice(0, 6);
    const sql = getDb();
    const rows = await sql`
      INSERT INTO articles (title, slug, excerpt, content, featured_image_url, image_alt, status, is_featured, category_id, author_id, published_at, seo_title, seo_description)
      VALUES (${title}, ${slug}, ${excerpt || null}, ${JSON.stringify(sections)}::jsonb, ${image || null}, ${image ? title : null}, ${status}, ${isFeatured}, ${categoryId}, ${authorId}, CASE WHEN ${status} = 'published' THEN NOW() ELSE NULL END, ${seoTitle || title}, ${seoDescription || excerpt || title})
      RETURNING id, title, slug, status
    `;
    revalidatePublishedContent();
    return NextResponse.json({ article: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar artigo", error);
    return NextResponse.json({ error: "Não foi possível salvar. Confira categoria, autor e conexão com o banco." }, { status: 500 });
  }
}
