import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseArticleInput } from "@/lib/article-service";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const sql = getDb();
    const articles = await sql`
      SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image_url, a.status, a.is_featured, a.category_id, a.author_id, a.published_at, a.updated_at, a.seo_title, a.seo_description,
        c.name AS category_name
      FROM articles a LEFT JOIN categories c ON c.id = a.category_id
      ORDER BY a.updated_at DESC LIMIT 100
    `;
    return NextResponse.json({ articles });
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
    return NextResponse.json({ article: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar artigo", error);
    return NextResponse.json({ error: "Não foi possível salvar. Confira categoria, autor e conexão com o banco." }, { status: 500 });
  }
}
