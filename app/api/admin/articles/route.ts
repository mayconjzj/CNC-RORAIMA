import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseArticleInput } from "@/lib/article-service";
import { revalidatePublishedContent } from "@/lib/revalidation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim().slice(0, 120);
    const requestedStatus = params.get("status") ?? "all";
    const status = ["published", "draft"].includes(requestedStatus) ? requestedStatus : "all";
    const category = (params.get("category") ?? "all").slice(0, 120);
    const author = (params.get("author") ?? "all").slice(0, 120);
    const requestedLimit = Number.parseInt(params.get("limit") ?? "50", 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 50;
    const requestedOffset = Number.parseInt(params.get("offset") ?? "0", 10);
    const offset = Number.isFinite(requestedOffset) ? Math.max(0, requestedOffset) : 0;
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
        ORDER BY a.updated_at DESC LIMIT ${limit} OFFSET ${offset}
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
    return NextResponse.json({ articles, total: Number(countRows[0]?.total ?? 0) });
  } catch (error) {
    console.error("Falha ao listar artigos", error);
    return NextResponse.json({ error: "Erro ao consultar artigos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
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
